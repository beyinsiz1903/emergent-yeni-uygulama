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
    POSITIVE_TRANSACTION_TYPES = {"earned", "bonus", "adjustment_credit", "manual_credit"}
    NEGATIVE_TRANSACTION_TYPES = {"redeemed", "expired", "adjustment_debit", "manual_debit"}
    AUTOMATION_ACTIONS = {
        "expiring_points": {
            "title": "Expiring Points Outreach",
            "category": "retention",
            "description": "Send reminder to members whose points expire soon.",
        },
        "reactivate_members": {
            "title": "Dormant Member Reactivation",
            "category": "engagement",
            "description": "Target members inactive for 60+ days with a comeback incentive.",
        },
        "boost_redemptions": {
            "title": "Boost Redemptions",
            "category": "monetization",
            "description": "Offer limited-time bonus for high-value members to redeem points.",
        },
        "partner_activation": {
            "title": "Partner Earn Campaign",
            "category": "partnerships",
            "description": "Invite members to earn with airline or retail partners.",
        },
    }

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

    async def record_transaction(
        self,
        tenant_id: str,
        guest_id: str,
        points: int,
        transaction_type: str,
        description: str,
        booking_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if points <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Points must be positive")

        tx_type = transaction_type.lower()
        positive_types = self.POSITIVE_TRANSACTION_TYPES
        negative_types = self.NEGATIVE_TRANSACTION_TYPES

        if tx_type not in positive_types | negative_types:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported transaction type")

        member = await self._get_or_create_member(tenant_id, guest_id)
        delta = points if tx_type in positive_types else -points
        new_balance = member.get('points', 0) + delta
        if new_balance < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient points")

        update_fields: Dict[str, Any] = {
            'points': new_balance,
            'last_activity': datetime.now(timezone.utc)
        }
        if delta > 0:
            update_fields['lifetime_points'] = member.get('lifetime_points', 0) + delta

        await self.db.loyalty_programs.update_one(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'$set': update_fields}
        )
        await self.db.guests.update_one(
            {'tenant_id': tenant_id, 'id': guest_id},
            {'$set': {'loyalty_points': new_balance}}
        )

        transaction = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'guest_id': guest_id,
            'points': points,
            'transaction_type': tx_type,
            'description': description,
            'booking_id': booking_id,
            'created_at': datetime.now(timezone.utc)
        }
        await self.db.loyalty_transactions.insert_one(transaction)
        serialized = transaction | {'created_at': transaction['created_at'].isoformat()}
        serialized['balance'] = new_balance
        return serialized

    async def redeem_points(
        self,
        tenant_id: str,
        guest_id: str,
        points_to_redeem: int,
        reward_type: str,
        actor: str
    ) -> Dict[str, Any]:
        transaction = await self.record_transaction(
            tenant_id=tenant_id,
            guest_id=guest_id,
            points=points_to_redeem,
            transaction_type='redeemed',
            description=f'{reward_type} redemption by {actor}'
        )
        redemption = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'guest_id': guest_id,
            'points_redeemed': points_to_redeem,
            'redemption_type': reward_type,
            'processed_by': actor,
            'created_at': datetime.now(timezone.utc)
        }
        await self.db.loyalty_redemptions.insert_one(redemption)
        redemption['created_at'] = redemption['created_at'].isoformat()
        return {
            'success': True,
            'transaction': transaction,
            'redemption': redemption
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
                'expiration_date': expiring_at.isoformat() if expiring_at else None,
                'tier': guest.get('loyalty_tier') if guest else member.get('tier')
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

    async def get_member_details(self, tenant_id: str, guest_id: str) -> Dict[str, Any]:
        member = await self._get_or_create_member(tenant_id, guest_id)
        guest = await self._get_guest(tenant_id, guest_id)
        serialized_member = self._serialize_member(member, guest)
        transactions_cursor = self.db.loyalty_transactions.find(
            {'tenant_id': tenant_id, 'guest_id': guest_id},
            {'_id': 0}
        ).sort('created_at', -1)
        transactions = await transactions_cursor.to_list(200)
        for txn in transactions:
            created_at = self._ensure_datetime(txn.get('created_at'))
            if created_at:
                txn['created_at'] = created_at.isoformat()
        return {'program': serialized_member, 'transactions': transactions}

    async def get_member_benefits(self, tenant_id: str, guest_id: str) -> Dict[str, Any]:
        guest = await self._get_guest(tenant_id, guest_id)
        points = guest.get('loyalty_points', 0)
        tier = guest.get('loyalty_tier') or self._tier_from_points(points)
        tier_info = await self.get_tier_benefits(tenant_id, tier)
        next_tier, points_needed = self._next_tier_progress(points, tier)
        points_expiry = self._ensure_datetime(
            guest.get('loyalty_points_expire_at')
        ) or (datetime.now(timezone.utc) + timedelta(days=365))

        return {
            'guest_id': guest_id,
            'guest_name': guest.get('name'),
            'loyalty_tier': tier,
            'points_balance': points,
            'points_expiry_date': points_expiry.date().isoformat(),
            'next_tier': next_tier,
            'points_to_next_tier': points_needed,
            'tier_benefits': tier_info.get('benefits', []),
            'total_stays': guest.get('total_stays', 0),
            'lifetime_value': round(guest.get('total_spend', 0.0), 2),
            'member_since': guest.get('created_at')
        }

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
    # Analytics & Insights
    # ------------------------------------------------------------------
    async def get_insights(self, tenant_id: str, lookback_days: int = 90) -> Dict[str, Any]:
        lookback_days = max(30, min(lookback_days, 365))
        now = datetime.now(timezone.utc)
        lookback_start = now - timedelta(days=lookback_days)

        programs_cursor = self.db.loyalty_programs.find({'tenant_id': tenant_id}, {'_id': 0})
        programs = await programs_cursor.to_list(5000)

        transactions_cursor = self.db.loyalty_transactions.find(
            {'tenant_id': tenant_id, 'created_at': {'$gte': lookback_start}},
            {'_id': 0}
        )
        transactions = await transactions_cursor.to_list(20000)

        transfers_cursor = self.db.loyalty_partner_transfers.find(
            {'tenant_id': tenant_id, 'created_at': {'$gte': lookback_start}},
            {'_id': 0}
        ).sort('created_at', -1)
        transfers = await transfers_cursor.to_list(200)

        promotions_cursor = self.db.loyalty_promotions.find(
            {'tenant_id': tenant_id, 'status': {'$in': ['active', 'scheduled']}},
            {'_id': 0}
        ).sort('created_at', -1)
        promotions = await promotions_cursor.to_list(20)

        guest_ids = {program.get('guest_id') for program in programs if program.get('guest_id')}
        guest_map: Dict[str, Dict[str, Any]] = {}
        if guest_ids:
            guests_cursor = self.db.guests.find(
                {'tenant_id': tenant_id, 'id': {'$in': list(guest_ids)}},
                {'_id': 0}
            )
            guests = await guests_cursor.to_list(5000)
            guest_map = {guest.get('id'): guest for guest in guests}

        total_members = len(programs)
        active_threshold = now - timedelta(days=30)
        churn_threshold = now - timedelta(days=60)

        active_members = 0
        points_outstanding = 0
        tier_breakdown: Dict[str, int] = {}
        churn_candidates = []

        for program in programs:
            points = program.get('points', 0)
            tier = (program.get('tier') or 'bronze').lower()
            last_activity = self._ensure_datetime(program.get('last_activity'))

            points_outstanding += points
            tier_breakdown[tier] = tier_breakdown.get(tier, 0) + 1

            if last_activity and last_activity >= active_threshold:
                active_members += 1

            if not last_activity or last_activity < churn_threshold:
                days_inactive = (now - last_activity).days if last_activity else lookback_days
                guest = guest_map.get(program.get('guest_id'), {})
                churn_candidates.append({
                    'guest_id': program.get('guest_id'),
                    'guest_name': guest.get('name'),
                    'tier': tier,
                    'points': points,
                    'days_inactive': days_inactive,
                    'last_activity': last_activity.isoformat() if last_activity else None
                })

        tier_breakdown_list = []
        for tier, count in sorted(tier_breakdown.items(), key=lambda item: item[1], reverse=True):
            percentage = round((count / total_members) * 100, 1) if total_members else 0
            tier_breakdown_list.append({
                'tier': tier,
                'count': count,
                'percentage': percentage
            })

        trend_map: Dict[str, Dict[str, Any]] = {}
        earned_total = 0
        redeemed_total = 0
        for txn in transactions:
            created_at = self._ensure_datetime(txn.get('created_at'))
            if not created_at:
                continue
            period = created_at.strftime('%Y-%m')
            bucket = trend_map.setdefault(period, {'period': period, 'earned': 0, 'redeemed': 0})
            tx_type = (txn.get('transaction_type') or '').lower()
            points = txn.get('points', 0)
            if tx_type in self.POSITIVE_TRANSACTION_TYPES:
                bucket['earned'] += points
                earned_total += points
            elif tx_type in self.NEGATIVE_TRANSACTION_TYPES:
                bucket['redeemed'] += points
                redeemed_total += points
        points_trend = [trend_map[key] for key in sorted(trend_map.keys())]

        sorted_programs = sorted(programs, key=lambda prog: prog.get('points', 0), reverse=True)[:5]
        top_members = []
        for program in sorted_programs:
            guest = guest_map.get(program.get('guest_id'), {})
            points = program.get('points', 0)
            tier = program.get('tier') or guest.get('loyalty_tier') or 'bronze'
            last_activity = self._ensure_datetime(program.get('last_activity'))
            next_tier, points_needed = self._next_tier_progress(points, tier)
            top_members.append({
                'guest_id': program.get('guest_id'),
                'guest_name': guest.get('name'),
                'tier': tier,
                'points': points,
                'lifetime_points': program.get('lifetime_points', 0),
                'last_activity': last_activity.isoformat() if last_activity else None,
                'next_tier': next_tier,
                'points_to_next_tier': points_needed
            })

        churn_risk = sorted(churn_candidates, key=lambda item: item['days_inactive'], reverse=True)[:5]
        for item in churn_risk:
            days = item['days_inactive']
            if days >= 90:
                item['risk_level'] = 'high'
            elif days >= 60:
                item['risk_level'] = 'medium'
            else:
                item['risk_level'] = 'low'

        expiring_points = await self.get_expiring_points(tenant_id, days=45)

        points_to_partner = sum(t.get('points', 0) for t in transfers if t.get('direction') == 'to_partner')
        points_from_partner = sum(t.get('points', 0) for t in transfers if t.get('direction') == 'from_partner')
        recent_transfers = []
        for transfer in transfers[:5]:
            created_at = self._ensure_datetime(transfer.get('created_at'))
            recent_transfers.append({
                'guest_id': transfer.get('guest_id'),
                'partner': transfer.get('partner'),
                'direction': transfer.get('direction'),
                'points': transfer.get('points', 0),
                'created_at': created_at.isoformat() if created_at else None
            })
        partner_activity = {
            'total_transfers': len(transfers),
            'points_to_partner': points_to_partner,
            'points_from_partner': points_from_partner,
            'recent_transfers': recent_transfers
        }

        active_promotions = []
        for promo in promotions:
            created_at = self._ensure_datetime(promo.get('created_at'))
            active_promotions.append({
                'id': promo.get('id'),
                'offer': promo.get('offer'),
                'target_tier': promo.get('target_tier', 'all'),
                'valid_until': promo.get('valid_until'),
                'status': promo.get('status'),
                'created_at': created_at.isoformat() if created_at else None
            })

        redemption_rate = round((redeemed_total / earned_total) * 100, 2) if earned_total else 0.0
        active_rate = round((active_members / total_members) * 100, 2) if total_members else 0.0
        avg_points = round(points_outstanding / total_members, 2) if total_members else 0.0

        recommendations = []
        total_points_at_risk = expiring_points.get('total_points_at_risk', 0)
        if total_points_at_risk:
            recommendations.append({
                'id': 'expiring_points',
                'title': 'Puan kaybını önleyin',
                'description': f"{total_points_at_risk} puan 45 gün içerisinde risk altında.",
                'priority': 'high' if total_points_at_risk > 5000 else 'medium',
                'category': 'retention'
            })
        if churn_risk:
            high_risk = sum(1 for item in churn_risk if item['risk_level'] == 'high')
            recommendations.append({
                'id': 'reactivate_members',
                'title': 'Pasif üyeler için kampanya',
                'description': f"{len(churn_risk)} üye 60+ gündür aktif değil.",
                'priority': 'high' if high_risk else 'medium',
                'category': 'engagement'
            })
        if redemption_rate < 25 and earned_total:
            recommendations.append({
                'id': 'boost_redemptions',
                'title': 'Kullanımı teşvik edin',
                'description': f"Son dönemde kullanım oranı %{redemption_rate:.1f}. Redeem bonusu önerilir.",
                'priority': 'medium',
                'category': 'monetization'
            })
        if points_from_partner == 0 and points_to_partner > 0:
            recommendations.append({
                'id': 'partner_activation',
                'title': 'Partner kazanımlarını artırın',
                'description': 'Partnerlerden gelen puan yok. Ortak kampanya önerilir.',
                'priority': 'low',
                'category': 'partnerships'
            })

        summary = {
            'total_members': total_members,
            'active_members': active_members,
            'active_rate': active_rate,
            'points_outstanding': points_outstanding,
            'points_earned': earned_total,
            'points_redeemed': redeemed_total,
            'redemption_rate': redemption_rate,
            'average_points_per_member': avg_points
        }

        return {
            'generated_at': now.isoformat(),
            'lookback_days': lookback_days,
            'summary': summary,
            'tier_breakdown': tier_breakdown_list,
            'points_trend': points_trend,
            'top_members': top_members,
            'churn_risk': churn_risk,
            'expiring_points': expiring_points,
            'partner_activity': partner_activity,
            'active_promotions': active_promotions,
            'recommended_actions': recommendations
        }

    async def run_automation(
        self,
        tenant_id: str,
        action_id: str,
        actor: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        payload = payload or {}
        action = self.AUTOMATION_ACTIONS.get(action_id)
        if not action:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported automation action")

        lookback = int(payload.get('lookback_days', 90))
        limit = int(payload.get('limit', 10))
        limit = max(1, min(limit, 50))
        insights = await self.get_insights(tenant_id, lookback)
        now = datetime.now(timezone.utc)

        targets: List[Dict[str, Any]] = []
        summary: Dict[str, Any] = {'category': action['category']}

        if action_id == 'expiring_points':
            expiring_list = insights.get('expiring_points', {}).get('expiring_soon', [])
            targets = expiring_list[:limit]
            if not targets:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No members with expiring points found")
            summary |= {
                'template': 'points_expiring',
                'message': payload.get('message') or 'Puanlarınız yakında sona eriyor. Şimdi kullanın!',
            }
        elif action_id == 'reactivate_members':
            churn_list = insights.get('churn_risk', [])
            targets = churn_list[:limit]
            if not targets:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No dormant members available")
            summary |= {
                'template': 'reactivation_offer',
                'offer': payload.get('offer') or 'Geri dönün: 2 gecelik konaklamaya +500 puan',
            }
        elif action_id == 'boost_redemptions':
            high_value_members = insights.get('top_members', [])
            targets = high_value_members[:limit]
            if not targets:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No high-value members found")
            summary |= {
                'template': 'redemption_flash_sale',
                'bonus': payload.get('bonus') or 'Bu hafta redemption işlemlerinde %25 indirim',
            }
        elif action_id == 'partner_activation':
            partner_stats = insights.get('partner_activity', {})
            if partner_stats.get('points_from_partner', 0) > 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Partner kazanımları zaten aktif görünüyor")
            targets = partner_stats.get('recent_transfers', [])
            summary |= {
                'template': 'partner_campaign',
                'partner': payload.get('partner') or 'AirlineX',
                'call_to_action': 'Yeni partner kampanyasıyla çift puan kazanın',
            }
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown automation action")

        segment = payload.get('segment')
        targets = self._filter_targets_by_segment(targets, segment)
        if not targets:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Seçilen segment için uygun üye bulunamadı")

        run_doc = {
            'id': str(uuid.uuid4()),
            'tenant_id': tenant_id,
            'action_id': action_id,
            'title': action['title'],
            'initiated_by': actor,
            'parameters': {
                'lookback_days': lookback,
                'limit': limit,
                **{k: v for k, v in payload.items() if k not in {'lookback_days', 'limit'}}
            },
            'targets': targets,
            'summary': summary,
            'status': 'queued',
            'created_at': now,
            'emails_sent': 0,
            'whatsapp_sent': 0,
        }
        await self.db.loyalty_automation_runs.insert_one(run_doc)
        run_doc['created_at'] = run_doc['created_at'].isoformat()

        return {
            'success': True,
            'automation': run_doc
        }

    async def list_automation_runs(self, tenant_id: str, limit: int = 20) -> Dict[str, Any]:
        cursor = (
            self.db.loyalty_automation_runs.find({'tenant_id': tenant_id}, {'_id': 0})
            .sort('created_at', -1)
        )
        if limit:
            cursor = cursor.limit(limit)
        runs = await cursor.to_list(limit or 100)
        for run in runs:
            created_at = self._ensure_datetime(run.get('created_at'))
            if created_at:
                run['created_at'] = created_at.isoformat()
        return {'runs': runs}

    async def get_automation_metrics(self, tenant_id: str, lookback_days: int = 30) -> Dict[str, Any]:
        lookback_days = max(1, min(lookback_days, 365))
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=lookback_days)

        cursor = self.db.loyalty_automation_runs.find(
            {
                'tenant_id': tenant_id,
                'created_at': {'$gte': since}
            },
            {'_id': 0}
        ).sort('created_at', -1)
        runs = await cursor.to_list(1000)

        summary = {
            'total_runs': len(runs),
            'completed_runs': 0,
            'failed_runs': 0,
            'notifications_sent': 0,
            'emails_sent': 0,
            'whatsapp_sent': 0,
        }

        actions: Dict[str, Dict[str, Any]] = {}
        for run in runs:
            status = run.get('status')
            if status == 'completed':
                summary['completed_runs'] += 1
            elif status == 'failed':
                summary['failed_runs'] += 1
            summary['notifications_sent'] += run.get('notifications_created', 0)
            summary['emails_sent'] += run.get('emails_sent', 0)
            summary['whatsapp_sent'] += run.get('whatsapp_sent', 0)

            action_id = run.get('action_id')
            action_stats = actions.setdefault(action_id, {
                'action_id': action_id,
                'title': self.AUTOMATION_ACTIONS.get(action_id, {}).get('title', action_id),
                'runs': 0,
                'completed': 0,
                'failed': 0,
                'notifications': 0,
                'emails_sent': 0,
                'whatsapp_sent': 0,
                'last_run_at': None,
            })
            action_stats['runs'] += 1
            if status == 'completed':
                action_stats['completed'] += 1
            if status == 'failed':
                action_stats['failed'] += 1
            action_stats['notifications'] += run.get('notifications_created', 0)
            action_stats['emails_sent'] += run.get('emails_sent', 0)
            action_stats['whatsapp_sent'] += run.get('whatsapp_sent', 0)
            created_at = self._ensure_datetime(run.get('created_at'))
            if created_at:
                current_last = self._ensure_datetime(action_stats['last_run_at'])
                if not current_last or created_at > current_last:
                    action_stats['last_run_at'] = created_at.isoformat()

        actions_list = []
        for stats in actions.values():
            runs_count = stats['runs'] or 1
            stats['completion_rate'] = round((stats['completed'] / runs_count) * 100, 1)
            if isinstance(stats['last_run_at'], datetime):
                stats['last_run_at'] = stats['last_run_at'].isoformat()
            actions_list.append(stats)

        return {
            'lookback_days': lookback_days,
            'summary': summary,
            'actions': sorted(actions_list, key=lambda a: a['runs'], reverse=True),
        }

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

    def _tier_from_points(self, points: int) -> str:
        if points >= 10000:
            return LoyaltyTier.PLATINUM.value
        if points >= 5000:
            return LoyaltyTier.GOLD.value
        if points >= 1000:
            return LoyaltyTier.SILVER.value
        return LoyaltyTier.BRONZE.value

    def _next_tier_progress(self, points: int, tier: str) -> tuple[Optional[str], Optional[int]]:
        tier = tier.lower()
        thresholds = {
            'bronze': ('silver', 1000),
            'silver': ('gold', 5000),
            'gold': ('platinum', 10000),
            'platinum': ('diamond', 20000),
            'diamond': (None, None)
        }
        next_tier, required = thresholds.get(tier, (None, None))
        if not next_tier:
            return None, None
        points_needed = max(required - points, 0)
        return next_tier, points_needed

    def _filter_targets_by_segment(self, targets: List[Dict[str, Any]], segment: Optional[str]) -> List[Dict[str, Any]]:
        if not segment or segment == 'all':
            return targets

        segment = segment.lower()

        if segment == 'high_value':
            return [
                target
                for target in targets
                if (target.get('points') or target.get('lifetime_points') or 0) >= 5000
            ]

        if segment == 'dormant':
            return [
                target
                for target in targets
                if target.get('days_inactive', 0) >= 60
            ]

        if segment == 'vip':
            vip_tiers = {LoyaltyTier.PLATINUM.value, LoyaltyTier.DIAMOND.value}
            return [
                target
                for target in targets
                if (target.get('tier') or '').lower() in vip_tiers
            ]

        if segment == 'expiring':
            return [
                target
                for target in targets
                if target.get('points_expiring', 0) > 0
            ]

        return targets
