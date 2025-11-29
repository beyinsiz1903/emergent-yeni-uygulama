import asyncio
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from pathlib import Path
import sys

BACKEND_PATH = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

import pytest
from fastapi import HTTPException

from meeting_events_models import MeetingRoomCreate, MeetingRoomBookingCreate
from meeting_events_service import MeetingEventsService


class InMemoryCursor:
    def __init__(self, items):
        self._items = items

    def sort(self, key, direction):
        reverse = direction == -1
        self._items.sort(key=lambda item: item.get(key), reverse=reverse)
        return self

    async def to_list(self, length):
        return self._items[:length]


class InMemoryCollection:
    def __init__(self, initial=None):
        self.documents = list(initial or [])

    async def insert_one(self, document):
        self.documents.append(document)
        return document

    async def insert_many(self, documents):
        self.documents.extend(documents)
        return documents

    async def count_documents(self, query):
        return sum(1 for doc in self.documents if self._matches(doc, query))

    async def find_one(self, query, projection=None):
        for doc in self.documents:
            if self._matches(doc, query):
                return self._project(doc, projection)
        return None

    def find(self, query, projection=None):
        items = [self._project(doc, projection) for doc in self.documents if self._matches(doc, query)]
        return InMemoryCursor(items)

    async def update_one(self, query, update):
        for doc in self.documents:
            if self._matches(doc, query):
                for op, values in update.items():
                    if op == "$set":
                        doc.update(values)
                return SimpleNamespace(matched_count=1)
        return SimpleNamespace(matched_count=0)

    def _matches(self, document, query):
        for key, expected in query.items():
            value = document.get(key)
            if isinstance(expected, dict):
                for op, operand in expected.items():
                    if op == "$ne" and value == operand:
                        return False
                    if op == "$lt" and not (value < operand):
                        return False
                    if op == "$gt" and not (value > operand):
                        return False
                    if op == "$gte" and not (value >= operand):
                        return False
                    if op == "$lte" and not (value <= operand):
                        return False
                    if op == "$in" and value not in operand:
                        return False
            else:
                if value != expected:
                    return False
        return True

    @staticmethod
    def _project(document, projection):
        if not projection:
            return dict(document)
        result = dict(document)
        excluded = [key for key, flag in projection.items() if flag == 0]
        for key in excluded:
            result.pop(key, None)
        return result


def build_service(initial_rooms=None, initial_room_bookings=None):
    db = SimpleNamespace(
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
