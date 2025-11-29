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
        loyalty_redemptions=InMemoryCollection(initial.get("loyalty_redemptions")),
        loyalty_automation_runs=InMemoryCollection(initial.get("loyalty_automation_runs")),
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


@pytest.mark.asyncio
async def test_record_transaction_updates_balance_and_transactions():
    tenant_id = "tenant-2"
    guest_id = "guest-3"

    service = build_service({
        "guests": [{
            "id": guest_id,
            "tenant_id": tenant_id,
            "name": "Maria Lopez",
            "loyalty_points": 0,
            "loyalty_tier": "bronze"
        }]
    })

    txn = await service.record_transaction(
        tenant_id=tenant_id,
        guest_id=guest_id,
        points=500,
        transaction_type="earned",
        description="Check-in bonus"
    )

    assert txn["balance"] == 500
    member = service.db.loyalty_programs.documents[0]
    assert member["points"] == 500

    redeem = await service.redeem_points(
        tenant_id=tenant_id,
        guest_id=guest_id,
        points_to_redeem=200,
        reward_type="spa_credit",
        actor="Front Desk"
    )

    assert redeem["transaction"]["balance"] == 300
    assert redeem["redemption"]["redemption_type"] == "spa_credit"


@pytest.mark.asyncio
async def test_get_member_benefits_includes_next_tier_progress():
    tenant_id = "tenant-3"
    guest_id = "guest-4"

    service = build_service({
        "guests": [{
            "id": guest_id,
            "tenant_id": tenant_id,
            "name": "Alex Kim",
            "loyalty_points": 3200,
            "loyalty_tier": "silver",
            "total_spend": 4500.0,
            "total_stays": 12
        }],
        "loyalty_tier_benefits": [{
            "tenant_id": tenant_id,
            "tier_name": "silver",
            "benefits": ["Late checkout", "Breakfast"],
            "points_required": 1000
        }]
    })

    benefits = await service.get_member_benefits(tenant_id, guest_id)
    assert benefits["loyalty_tier"] == "silver"
    assert benefits["next_tier"] == "gold"
    assert benefits["points_to_next_tier"] == 5000 - 3200
    assert "Late checkout" in benefits["tier_benefits"]


@pytest.mark.asyncio
async def test_get_insights_returns_coherent_summary():
    tenant_id = "tenant-4"
    now = datetime.now(timezone.utc)

    service = build_service({
        "guests": [
            {"id": "guest-10", "tenant_id": tenant_id, "name": "VIP Guest", "loyalty_points": 9000, "loyalty_tier": "gold"},
            {"id": "guest-11", "tenant_id": tenant_id, "name": "Sleeper Member", "loyalty_points": 800, "loyalty_tier": "silver"},
        ],
        "loyalty_programs": [
            {
                "id": "member-10",
                "tenant_id": tenant_id,
                "guest_id": "guest-10",
                "tier": "gold",
                "points": 9000,
                "lifetime_points": 15000,
                "last_activity": now - timedelta(days=5)
            },
            {
                "id": "member-11",
                "tenant_id": tenant_id,
                "guest_id": "guest-11",
                "tier": "silver",
                "points": 800,
                "lifetime_points": 2500,
                "last_activity": now - timedelta(days=90),
                "points_expire_at": now + timedelta(days=20)
            },
        ],
        "loyalty_transactions": [
            {
                "id": "txn-1",
                "tenant_id": tenant_id,
                "guest_id": "guest-10",
                "points": 1200,
                "transaction_type": "earned",
                "created_at": now - timedelta(days=10)
            },
            {
                "id": "txn-2",
                "tenant_id": tenant_id,
                "guest_id": "guest-10",
                "points": 600,
                "transaction_type": "redeemed",
                "created_at": now - timedelta(days=8)
            },
            {
                "id": "txn-3",
                "tenant_id": tenant_id,
                "guest_id": "guest-11",
                "points": 400,
                "transaction_type": "earned",
                "created_at": now - timedelta(days=50)
            },
        ],
        "loyalty_partner_transfers": [
            {
                "id": "transfer-1",
                "tenant_id": tenant_id,
                "guest_id": "guest-10",
                "partner": "AirlineX",
                "direction": "to_partner",
                "points": 200,
                "created_at": now - timedelta(days=2)
            }
        ],
        "loyalty_promotions": [
            {
                "id": "promo-1",
                "tenant_id": tenant_id,
                "target_tier": "gold",
                "offer": "Double points weekends",
                "status": "active",
                "valid_until": (now + timedelta(days=30)).date().isoformat(),
                "created_at": now - timedelta(days=1)
            }
        ]
    })

    insights = await service.get_insights(tenant_id, lookback_days=90)

    assert insights["summary"]["total_members"] == 2
    assert insights["summary"]["points_outstanding"] == 9800
    assert insights["summary"]["points_earned"] == 1600
    assert len(insights["tier_breakdown"]) >= 1
    assert insights["top_members"][0]["guest_id"] == "guest-10"
    assert insights["churn_risk"][0]["guest_id"] == "guest-11"
    assert insights["partner_activity"]["points_to_partner"] == 200
    assert insights["active_promotions"][0]["offer"] == "Double points weekends"
    assert len(insights["recommended_actions"]) >= 1


@pytest.mark.asyncio
async def test_run_automation_creates_queued_task():
    tenant_id = "tenant-5"
    now = datetime.now(timezone.utc)
    service = build_service({
        "guests": [
            {"id": "guest-20", "tenant_id": tenant_id, "name": "Active Member", "loyalty_points": 6000, "loyalty_tier": "gold"},
            {"id": "guest-21", "tenant_id": tenant_id, "name": "Dormant Member", "loyalty_points": 800, "loyalty_tier": "silver"},
        ],
        "loyalty_programs": [
            {
                "id": "member-20",
                "tenant_id": tenant_id,
                "guest_id": "guest-20",
                "tier": "gold",
                "points": 6000,
                "lifetime_points": 11000,
                "last_activity": now - timedelta(days=10)
            },
            {
                "id": "member-21",
                "tenant_id": tenant_id,
                "guest_id": "guest-21",
                "tier": "silver",
                "points": 800,
                "lifetime_points": 2000,
                "last_activity": now - timedelta(days=120),
                "points_expire_at": now + timedelta(days=15)
            },
        ],
        "loyalty_transactions": [
            {"id": "txn-10", "tenant_id": tenant_id, "guest_id": "guest-20", "points": 500, "transaction_type": "earned", "created_at": now - timedelta(days=20)},
            {"id": "txn-11", "tenant_id": tenant_id, "guest_id": "guest-20", "points": 300, "transaction_type": "redeemed", "created_at": now - timedelta(days=15)},
        ],
    })

    result = await service.run_automation(
        tenant_id=tenant_id,
        action_id="expiring_points",
        actor="Automation Bot",
        payload={"limit": 1, "lookback_days": 90}
    )

    assert result["success"] is True
    automation = result["automation"]
    assert automation["action_id"] == "expiring_points"
    assert automation["targets"]
    runs_collection = service.db.loyalty_automation_runs.documents
    assert len(runs_collection) == 1
    assert runs_collection[0]["initiated_by"] == "Automation Bot"


@pytest.mark.asyncio
async def test_run_automation_applies_segment_filter():
    tenant_id = "tenant-6"
    now = datetime.now(timezone.utc)
    service = build_service({
        "guests": [
            {"id": "guest-30", "tenant_id": tenant_id, "name": "VIP Platinum", "loyalty_points": 12000, "loyalty_tier": "platinum"},
            {"id": "guest-31", "tenant_id": tenant_id, "name": "Starter Bronze", "loyalty_points": 500, "loyalty_tier": "bronze"},
        ],
        "loyalty_programs": [
            {
                "id": "member-30",
                "tenant_id": tenant_id,
                "guest_id": "guest-30",
                "tier": "platinum",
                "points": 12000,
                "lifetime_points": 20000,
                "last_activity": now - timedelta(days=5)
            },
            {
                "id": "member-31",
                "tenant_id": tenant_id,
                "guest_id": "guest-31",
                "tier": "bronze",
                "points": 500,
                "lifetime_points": 800,
                "last_activity": now - timedelta(days=20)
            },
        ],
        "loyalty_transactions": [
            {"id": "txn-20", "tenant_id": tenant_id, "guest_id": "guest-30", "points": 700, "transaction_type": "earned", "created_at": now - timedelta(days=10)},
            {"id": "txn-21", "tenant_id": tenant_id, "guest_id": "guest-31", "points": 200, "transaction_type": "earned", "created_at": now - timedelta(days=15)},
        ],
    })

    result = await service.run_automation(
        tenant_id=tenant_id,
        action_id="boost_redemptions",
        actor="Marketing Bot",
        payload={"segment": "vip"}
    )

    assert result["success"] is True
    stored_run = service.db.loyalty_automation_runs.documents[0]
    assert len(stored_run["targets"]) == 1
    assert stored_run["targets"][0]["guest_id"] == "guest-30"
