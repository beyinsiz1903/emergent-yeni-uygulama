"""
Loyalty service layer for world-class endpoints.
Handles tier upgrades, point expirations, partner transfers, promotions, catalog.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import uuid

from fastapi import HTTPException, status

from advanced_loyalty_models import LoyaltyTier


DEFAULT_TIER_BENEFITS = {
    "bronze": {
        "benefits": ["Free Wi-Fi", "Welcome drink"],
        "points_required": 0,
    },
    "silver": {
        "benefits": ["Late checkout (12pm)", "Free breakfast", "Free Wi-Fi"],
        "points_required": 1000,
    },
    "gold": {
        "benefits": ["Late checkout (1pm)", "Free breakfast", "Priority upgrade", "Welcome amenity", "Free Wi-Fi"],
        "points_required": 5000,
    },
    "platinum": {
        "benefits": ["Late checkout (2pm)", "Free breakfast", "Priority upgrade", "Welcome amenity", "Free Wi-Fi", "Guaranteed room availability"],
        "points_required": 10000,
    },
    "diamond": {
        "benefits": ["24/7 concierge", "Suite upgrade", "Airport transfer", "Spa package", "Complimentary minibar"],
        "points_required": 20000,
    },
}


class LoyaltyService:
    def __init__(self, db):
        self.db = db

    # ------------------------------------------------------------------
    # Tier management
    # ------------------------------------------------------------------
    async def upgrade_tier(self, tenant_id: str, guest_id: str, new_tier: str, actor: str) -> Dict[str, Any]:
        tier_enum = self._parse_tier(new_tier)
        member = await self._get_or_create_member(tenant_id, guest_id)
        now = datetime.now(timezone.utc)

        await self.db.loyalty_programs.update_one(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'$set': {'tier': tier_enum.value, 'last_activity': now}}
        )
        await self.db.guests.update_one(
            {'tenant_id': tenant_id, 'id': guest_id},
            {'$set': {'loyalty_tier': tier_enum.value}}
        )

        transaction = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'guest_id': guest_id,
            'points': 0,
            'transaction_type': 'tier_upgrade',
            'description': f'Tier upgraded to {tier_enum.value} by {actor}',
            'created_at': now
        }
        await self.db.loyalty_transactions.insert_one(transaction)

        updated = await self._get_or_create_member(tenant_id, guest_id)
        guest = await self._get_guest(tenant_id, guest_id)
        response = self._serialize_member(updated, guest)
        response['upgraded_by'] = actor
        return response

    async def get_tier_benefits(self, tenant_id: str, tier: str) -> Dict[str, Any]:
        tier_enum = self._parse_tier(tier)
        doc = await self.db.loyalty_tier_benefits.find_one(
            {'tenant_id': tenant_id, 'tier_name': tier_enum.value},
            {'_id': 0}
        )
        if not doc:
            defaults = DEFAULT_TIER_BENEFITS[tier_enum.value]
            return {
                'tier': tier_enum.value,
                'benefits': defaults['benefits'],
                'points_required': defaults['points_required']
            }
        return {
            'tier': tier_enum.value,
            'benefits': doc.get('benefits', []),
            'points_required': doc.get('points_required', DEFAULT_TIER_BENEFITS[tier_enum.value]['points_required'])
        }

    # ------------------------------------------------------------------
    # Points expiration & tracking
    # ------------------------------------------------------------------
    async def set_point_expiration(self, tenant_id: str, guest_id: str, expiration_months: int) -> Dict[str, Any]:
        member = await self._get_or_create_member(tenant_id, guest_id)
        months = max(1, expiration_months)
        expire_at = datetime.now(timezone.utc) + timedelta(days=months * 30)
        await self.db.loyalty_programs.update_one(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'$set': {'points_expire_at': expire_at}}
        )
        guest = await self._get_guest(tenant_id, guest_id)
        response = self._serialize_member({**member, 'points_expire_at': expire_at}, guest)
        response['message'] = f'Points will expire in {months} months'
        return response

    async def get_expiring_points(self, tenant_id: str, days: int) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(days=days)
        cursor = self.db.loyalty_programs.find(
            {
                'tenant_id': tenant_id,
                'points_expire_at': {'$lte': cutoff, '$gte': now}
            },
            {'_id': 0}
        )
        programs = await cursor.to_list(1000)

        # Include members without explicit expiration but nearing default expiry (365 days after last activity)
        additional_members: List[Dict[str, Any]] = []
        fallback_cursor = self.db.loyalty_programs.find(
            {
                'tenant_id': tenant_id,
                'points_expire_at': {'$exists': False},
                'last_activity': {'$exists': True}
            },
            {'_id': 0}
        )
        fallback_members = await fallback_cursor.to_list(1000)
        for member in fallback_members:
            last_activity = self._ensure_datetime(member.get('last_activity'))
            if not last_activity:
                continue
            candidate = last_activity + timedelta(days=365)
            if now <= candidate <= cutoff:
                member['points_expire_at'] = candidate
                additional_members.append(member)

        combined = programs + additional_members

        expiring_list = []
        total_points = 0
        for member in combined:
            guest = await self.db.guests.find_one(
                {'tenant_id': tenant_id, 'id': member['guest_id']},
                {'_id': 0, 'name': 1}
            )
            points = member.get('points', 0)
            expiring_at = self._ensure_datetime(member.get('points_expire_at'))
            expiring_list.append({
                'guest_id': member['guest_id'],
                'guest_name': guest.get('name') if guest else None,
                'points_expiring': points,
                'expiration_date': expiring_at.isoformat() if expiring_at else None
            })
            total_points += points

        return {
            'expiring_soon': expiring_list,
            'total_points_at_risk': total_points
        }

    # ------------------------------------------------------------------
    # Partner transfers & activity
    # ------------------------------------------------------------------
    async def transfer_partner_points(self, tenant_id: str, transfer_data: Dict[str, Any]) -> Dict[str, Any]:
        guest_id = transfer_data['guest_id']
        points = int(transfer_data.get('points', 0))
        if points <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Points must be positive")

        direction = transfer_data.get('direction', 'to_partner')
        partner = transfer_data.get('partner', 'external_partner')
        conversion_rate = float(transfer_data.get('conversion_rate', 1.0))

        member = await self._get_or_create_member(tenant_id, guest_id)
        new_balance = member.get('points', 0)

        if direction == 'to_partner':
            if member.get('points', 0) < points:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient points")
            new_balance -= points
        else:
            new_balance += points

        await self.db.loyalty_programs.update_one(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'$set': {'points': new_balance, 'last_activity': datetime.now(timezone.utc)}}
        )

        record = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'guest_id': guest_id,
            'partner': partner,
            'direction': direction,
            'points': points,
            'conversion_rate': conversion_rate,
            'created_at': datetime.now(timezone.utc),
            'status': 'completed'
        }
        await self.db.loyalty_partner_transfers.insert_one(record)

        return {
            'success': True,
            'balance': new_balance,
            'transfer': record | {'created_at': record['created_at'].isoformat()}
        }

    async def get_member_activity(self, tenant_id: str, guest_id: str) -> Dict[str, Any]:
        transactions_cursor = self.db.loyalty_transactions.find(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'_id': 0}
        ).sort('created_at', -1)
        transactions = await transactions_cursor.to_list(200)
        for txn in transactions:
            created_at = self._ensure_datetime(txn.get('created_at'))
            if created_at:
                txn['created_at'] = created_at.isoformat()

        member = await self._get_or_create_member(tenant_id, guest_id)
        guest = await self._get_guest(tenant_id, guest_id)
        summary = self._serialize_member(member, guest)
        summary['activities'] = transactions
        return summary

    # ------------------------------------------------------------------
    # Promotions & catalog
    # ------------------------------------------------------------------
    async def create_promotion(self, tenant_id: str, promo_data: Dict[str, Any], actor: str) -> Dict[str, Any]:
        promotion = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'target_tier': promo_data.get('target_tier', 'all'),
            'offer': promo_data.get('offer'),
            'valid_until': promo_data.get('valid_until'),
            'created_by': actor,
            'status': 'active',
            'created_at': datetime.now(timezone.utc)
        }
        await self.db.loyalty_promotions.insert_one(promotion)
        promotion['created_at'] = promotion['created_at'].isoformat()
        return promotion

    async def get_redemption_catalog(self, tenant_id: str) -> Dict[str, Any]:
        catalog = await self.db.loyalty_redemption_catalog.find(
            {'tenant_id': tenant_id},
            {'_id': 0}
        ).to_list(200)
        if not catalog:
            catalog = [
                {'item': 'Free Night', 'points_required': 12000, 'value': 180.0},
                {'item': 'Room Upgrade', 'points_required': 6000, 'value': 90.0},
                {'item': 'Spa Credit', 'points_required': 3500, 'value': 50.0},
                {'item': 'Airport Transfer', 'points_required': 2500, 'value': 40.0},
            ]
        return {'catalog': catalog}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    async def _get_guest(self, tenant_id: str, guest_id: str) -> Dict[str, Any]:
        guest = await self.db.guests.find_one({'tenant_id': tenant_id, 'id': guest_id})
        if not guest:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest not found")
        return guest

    async def _get_or_create_member(self, tenant_id: str, guest_id: str) -> Dict[str, Any]:
        member = await self.db.loyalty_programs.find_one(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'_id': 0}
        )
        if member:
            return member

        guest = await self._get_guest(tenant_id, guest_id)
        now = datetime.now(timezone.utc)
        member = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'guest_id': guest_id,
            'tier': guest.get('loyalty_tier', 'bronze'),
            'points': guest.get('loyalty_points', 0),
            'lifetime_points': guest.get('loyalty_points', 0),
            'last_activity': now,
        }
        await self.db.loyalty_programs.insert_one(member)
        return member

    def _serialize_member(self, member: Dict[str, Any], guest: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        expire_at = self._ensure_datetime(member.get('points_expire_at'))
        last_activity = self._ensure_datetime(member.get('last_activity'))
        return {
            'id': member.get('id'),
            'guest_id': member.get('guest_id'),
            'tier': member.get('tier'),
            'points': member.get('points'),
            'lifetime_points': member.get('lifetime_points'),
            'points_expire_at': expire_at.isoformat() if expire_at else None,
            'last_activity': last_activity.isoformat() if last_activity else None,
            'guest_name': guest.get('name') if guest else None
        }

    def _parse_tier(self, tier_value: str) -> LoyaltyTier:
        if isinstance(tier_value, LoyaltyTier):
            return tier_value
        try:
            return LoyaltyTier(tier_value.lower())
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid loyalty tier") from exc

    @staticmethod
    def _ensure_datetime(value: Any) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except ValueError:
            return None
