import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys

BACKEND_PATH = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

import pytest
from fastapi import HTTPException

from meeting_events_models import MeetingRoomCreate, MeetingRoomBookingCreate
from meeting_events_service import MeetingEventsService
from tests.utils.in_memory_db import InMemoryCollection, build_in_memory_db


def build_service(
    initial_rooms=None,
    initial_room_bookings=None,
    group_reservations=None,
    group_bookings=None,
    event_bookings=None
):
    db = build_in_memory_db(
        meeting_rooms=InMemoryCollection(initial_rooms),
        meeting_room_bookings=InMemoryCollection(initial_room_bookings),
        event_bookings=InMemoryCollection(event_bookings),
        catering_orders=InMemoryCollection(),
        banquet_event_orders=InMemoryCollection(),
        av_equipment=InMemoryCollection(),
        event_floor_plans=InMemoryCollection(),
        group_reservations=InMemoryCollection(group_reservations),
        bookings=InMemoryCollection(group_bookings),
    )
    return MeetingEventsService(db)


@pytest.mark.asyncio
async def test_create_meeting_room_and_list():
    service = build_service()

    room_payload = MeetingRoomCreate(
        room_name="Innovation Hub",
        capacity=60,
        hourly_rate=150.0,
        full_day_rate=900.0,
        equipment=["Projector", "Whiteboard"],
    )

    room = await service.create_meeting_room("tenant-1", room_payload)
    assert room["room_name"] == "Innovation Hub"

    rooms = await service.list_meeting_rooms("tenant-1")
    assert len(rooms) == 1
    assert rooms[0]["room_name"] == "Innovation Hub"


@pytest.mark.asyncio
async def test_book_meeting_room_conflict_detection():
    tenant_id = "tenant-1"
    room_id = "room-123"
    start = datetime.now(timezone.utc) + timedelta(days=2)
    end = start + timedelta(hours=4)

    service = build_service(
        initial_rooms=[{
            "id": room_id,
            "tenant_id": tenant_id,
            "room_name": "Board Room",
            "capacity": 10,
            "hourly_rate": 120.0,
            "full_day_rate": 800.0,
            "equipment": [],
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }],
        initial_room_bookings=[{
            "id": "booking-1",
            "tenant_id": tenant_id,
            "room_id": room_id,
            "event_name": "Existing Meeting",
            "organizer": "Ops Team",
            "event_date": start.date().isoformat(),
            "start_datetime": start,
            "end_datetime": end,
            "expected_attendees": 8,
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }]
    )

    booking_payload = MeetingRoomBookingCreate(
        event_name="New Meeting",
        organizer="Sales",
        event_date=start.date().isoformat(),
        start_time=start.strftime("%H:%M"),
        end_time=(start + timedelta(hours=2)).strftime("%H:%M"),
        expected_attendees=6,
    )

    with pytest.raises(HTTPException) as exc:
        await service.book_meeting_room(tenant_id, room_id, booking_payload)

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_group_pickup_summary():
    tenant_id = "tenant-3"
    group_id = "group-123"
    now = datetime.now(timezone.utc)

    service = build_service(
        group_reservations=[{
            "id": group_id,
            "tenant_id": tenant_id,
            "group_name": "Corporate Summit",
            "group_type": "corporate",
            "contact_person": "Dana Lead",
            "check_in_date": (now + timedelta(days=15)).date().isoformat(),
            "check_out_date": (now + timedelta(days=18)).date().isoformat(),
            "total_rooms": 40,
            "status": "partial"
        }],
        group_bookings=[{
            "id": "booking-1",
            "tenant_id": tenant_id,
            "group_id": group_id,
            "room_type": "Suite",
            "total_amount": 600,
            "created_at": (now - timedelta(days=5)).isoformat()
        }, {
            "id": "booking-2",
            "tenant_id": tenant_id,
            "group_id": group_id,
            "room_type": "Deluxe",
            "total_amount": 400,
            "created_at": (now - timedelta(days=3)).isoformat()
        }]
    )

    summary = await service.get_group_pickup(tenant_id, group_id)
    assert summary['pickup_summary']['rooms_picked_up'] == 2
    assert summary['pickup_summary']['pickup_percentage'] == 5.0
    assert summary['room_type_distribution']['Suite'] == 1
    assert len(summary['pace']) == 2


@pytest.mark.asyncio
async def test_event_analytics_overview():
    tenant_id = "tenant-4"
    now = datetime.now(timezone.utc)

    service = build_service(
        event_bookings=[{
            "id": "event-1",
            "tenant_id": tenant_id,
            "event_name": "Tech Expo",
            "event_date": (now + timedelta(days=10)).date().isoformat(),
            "total_cost": 12000,
            "expected_attendees": 150,
            "setup_type": "theater"
        }, {
            "id": "event-2",
            "tenant_id": tenant_id,
            "event_name": "Gala Dinner",
            "event_date": (now + timedelta(days=40)).date().isoformat(),
            "total_cost": 8000,
            "expected_attendees": 90,
            "setup_type": "banquet"
        }]
    )

    analytics = await service.get_event_analytics(tenant_id, lookahead_days=60)
    assert analytics['total_events'] == 2
    assert round(analytics['projected_revenue'], 2) == 20000
    assert analytics['events_by_setup']['theater'] == 1
    assert len(analytics['top_events']) == 2
