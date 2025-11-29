from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys

import pytest

BACKEND_PATH = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from loyalty_service import LoyaltyService
from tests.utils.in_memory_db import InMemoryCollection, build_in_memory_db


def build_service(initial=None):
    initial = initial or {}
    db = build_in_memory_db(
        guests=InMemoryCollection(initial.get("guests")),
        loyalty_programs=InMemoryCollection(initial.get("loyalty_programs")),
        loyalty_transactions=InMemoryCollection(initial.get("loyalty_transactions")),
        loyalty_tier_benefits=InMemoryCollection(initial.get("loyalty_tier_benefits")),
        loyalty_partner_transfers=InMemoryCollection(initial.get("loyalty_partner_transfers")),
        loyalty_promotions=InMemoryCollection(initial.get("loyalty_promotions")),
        loyalty_redemption_catalog=InMemoryCollection(initial.get("loyalty_redemption_catalog")),
    )
    return LoyaltyService(db)


@pytest.mark.asyncio
async def test_upgrade_tier_updates_membership_and_logs_transaction():
    tenant_id = "tenant-1"
    guest_id = "guest-1"
    now = datetime.now(timezone.utc)

    service = build_service({
        "guests": [{
            "id": guest_id,
            "tenant_id": tenant_id,
            "name": "Jane Doe",
            "loyalty_points": 2500,
            "loyalty_tier": "silver"
        }],
        "loyalty_programs": [{
            "id": "member-1",
            "tenant_id": tenant_id,
            "guest_id": guest_id,
            "tier": "silver",
            "points": 2500,
            "lifetime_points": 10000,
            "last_activity": now
        }]
    })

    result = await service.upgrade_tier(
        tenant_id=tenant_id,
        guest_id=guest_id,
        new_tier="gold",
        actor="GM"
    )

    assert result["tier"] == "gold"
    assert result["guest_id"] == guest_id
    transactions = service.db.loyalty_transactions.documents
    assert len(transactions) == 1
    assert transactions[0]["transaction_type"] == "tier_upgrade"
    updated_guest = service.db.guests.documents[0]
    assert updated_guest["loyalty_tier"] == "gold"


@pytest.mark.asyncio
async def test_expiring_points_returns_members_within_window():
    tenant_id = "tenant-1"
    guest_id = "guest-2"
    now = datetime.now(timezone.utc)
    expires_soon = now + timedelta(days=10)

    service = build_service({
        "guests": [{
            "id": guest_id,
            "tenant_id": tenant_id,
            "name": "John Smith",
            "loyalty_points": 800,
            "loyalty_tier": "bronze"
        }],
        "loyalty_programs": [{
            "id": "member-2",
            "tenant_id": tenant_id,
            "guest_id": guest_id,
            "tier": "bronze",
            "points": 800,
            "lifetime_points": 1200,
            "last_activity": now - timedelta(days=60),
            "points_expire_at": expires_soon
        }]
    })

    response = await service.get_expiring_points(tenant_id, days=30)
    assert response["total_points_at_risk"] == 800
    assert len(response["expiring_soon"]) == 1
    item = response["expiring_soon"][0]
    assert item["guest_id"] == guest_id
    assert item["points_expiring"] == 800
