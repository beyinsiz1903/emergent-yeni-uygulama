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


def build_service(initial_rooms=None, initial_room_bookings=None):
    db = build_in_memory_db(
        meeting_rooms=InMemoryCollection(initial_rooms),
        meeting_room_bookings=InMemoryCollection(initial_room_bookings),
        event_bookings=InMemoryCollection(),
        catering_orders=InMemoryCollection(),
        banquet_event_orders=InMemoryCollection(),
        av_equipment=InMemoryCollection(),
        event_floor_plans=InMemoryCollection(),
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
