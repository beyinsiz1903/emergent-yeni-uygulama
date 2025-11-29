"""
Service layer for Meeting & Events management.
Encapsulates MongoDB operations used by world_class_features endpoints.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Tuple
import uuid

from fastapi import HTTPException, status

from meeting_events_models import (
    MeetingRoomCreate,
    MeetingRoomUpdate,
    MeetingRoomBookingCreate,
    MeetingRoomBookingStatus,
    CateringOrderCreate,
    BanquetEventOrderCreate,
    SetupType,
)


def _to_utc(date_str: str, time_str: str) -> datetime:
    """Combine date + time strings and normalize to UTC."""
    if "T" in date_str:
        dt = datetime.fromisoformat(date_str)
    else:
        dt = datetime.fromisoformat(f"{date_str}T{time_str}")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class MeetingEventsService:
    # Utilities
    # ------------------------------------------------------------------
    def _ensure_datetime(self, value: Any, fallback_tz: timezone = timezone.utc) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value if value.tzinfo else value.replace(tzinfo=fallback_tz)
        try:
            dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            return dt if dt.tzinfo else dt.replace(tzinfo=fallback_tz)
        except ValueError:
            return None

    """Encapsulates Meeting & Events CRUD logic."""

    def __init__(self, db):
        self.db = db

    # ------------------------------------------------------------------
    # Meeting Rooms
    # ------------------------------------------------------------------
    async def list_meeting_rooms(self, tenant_id: str) -> List[Dict[str, Any]]:
        cursor = (
            self.db.meeting_rooms.find(
                {"tenant_id": tenant_id},
                {"_id": 0},
            )
            .sort("room_name", 1)
        )
        return await cursor.to_list(length=200)

    async def create_meeting_room(self, tenant_id: str, payload: MeetingRoomCreate) -> Dict[str, Any]:
        room_data = payload.model_dump()
        room_data.update(
            {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        )
        await self.db.meeting_rooms.insert_one(room_data)
        room_data["created_at"] = room_data["created_at"].isoformat()
        room_data["updated_at"] = room_data["updated_at"].isoformat()
        return room_data

    async def update_meeting_room(
        self,
        tenant_id: str,
        room_id: str,
        payload: MeetingRoomUpdate,
    ) -> Dict[str, Any]:
        update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await self.db.meeting_rooms.update_one(
            {"tenant_id": tenant_id, "id": room_id},
            {"$set": update_data},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting room not found")
        room = await self.db.meeting_rooms.find_one({"tenant_id": tenant_id, "id": room_id}, {"_id": 0})
        return room

    # ------------------------------------------------------------------
    # Meeting Room Bookings
    # ------------------------------------------------------------------
    async def book_meeting_room(
        self,
        tenant_id: str,
        room_id: str,
        booking_data: MeetingRoomBookingCreate,
    ) -> Dict[str, Any]:
        room = await self.db.meeting_rooms.find_one({"tenant_id": tenant_id, "id": room_id}, {"_id": 0})
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting room not found")

        start_dt = _to_utc(booking_data.event_date, booking_data.start_time)
        end_dt = _to_utc(booking_data.event_date, booking_data.end_time)

        # Basic capacity validation
        if booking_data.expected_attendees > room.get("capacity", 0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expected attendees exceed room capacity",
            )

        if await self._has_conflict(tenant_id, room_id, start_dt, end_dt):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Room is not available for the requested time range",
            )

        booking = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "room_id": room_id,
            "event_name": booking_data.event_name,
            "organizer": booking_data.organizer,
            "event_date": booking_data.event_date,
            "start_datetime": start_dt,
            "end_datetime": end_dt,
            "expected_attendees": booking_data.expected_attendees,
            "booking_source": "pms",
            "event_id": booking_data.event_id,
            "notes": booking_data.notes,
            "status": booking_data.status.value,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        await self.db.meeting_room_bookings.insert_one(booking)
        return self._serialize_datetime_fields(booking)

    async def get_meeting_room_availability(
        self,
        tenant_id: str,
        room_id: str,
        start_date: str,
        end_date: str,
    ) -> Dict[str, Any]:
        start_dt = _to_utc(start_date, "00:00")
        end_dt = _to_utc(end_date, "23:59")
        bookings = await self.db.meeting_room_bookings.find(
            {
                "tenant_id": tenant_id,
                "room_id": room_id,
                "status": {"$ne": MeetingRoomBookingStatus.CANCELLED.value},
                "start_datetime": {"$lt": end_dt},
                "end_datetime": {"$gt": start_dt},
            },
            {"_id": 0},
        ).to_list(200)

        serialized = [self._serialize_datetime_fields(b) for b in bookings]
        return {
            "room_id": room_id,
            "start_date": start_date,
            "end_date": end_date,
            "busy_slots": serialized,
            "is_available": len(bookings) == 0,
        }

    async def cancel_meeting_room_booking(
        self,
        tenant_id: str,
        booking_id: str,
    ) -> Dict[str, Any]:
        result = await self.db.meeting_room_bookings.update_one(
            {"tenant_id": tenant_id, "id": booking_id},
            {
                "$set": {
                    "status": MeetingRoomBookingStatus.CANCELLED.value,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        booking = await self.db.meeting_room_bookings.find_one(
            {"tenant_id": tenant_id, "id": booking_id},
            {"_id": 0},
        )
        return self._serialize_datetime_fields(booking)

    async def _has_conflict(
        self,
        tenant_id: str,
        room_id: str,
        start_dt: datetime,
        end_dt: datetime,
        exclude_booking_id: Optional[str] = None,
    ) -> bool:
        query: Dict[str, Any] = {
            "tenant_id": tenant_id,
            "room_id": room_id,
            "status": {"$ne": MeetingRoomBookingStatus.CANCELLED.value},
            "start_datetime": {"$lt": end_dt},
            "end_datetime": {"$gt": start_dt},
        }
        if exclude_booking_id:
            query["id"] = {"$ne": exclude_booking_id}

        count = await self.db.meeting_room_bookings.count_documents(query)
        return count > 0

    # ------------------------------------------------------------------
    # Catering
    # ------------------------------------------------------------------
    async def create_catering_order(
        self,
        tenant_id: str,
        payload: CateringOrderCreate,
    ) -> Dict[str, Any]:
        event = await self.db.event_bookings.find_one(
            {"tenant_id": tenant_id, "id": payload.event_id},
            {"_id": 0, "event_name": 1},
        )
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        total_amount = payload.total_amount or payload.guest_count * 35.0
        order = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "event_id": payload.event_id,
            "guest_count": payload.guest_count,
            "menu_items": payload.menu_items,
            "service_type": payload.service_type.value,
            "special_requirements": payload.special_requirements,
            "total_amount": round(total_amount, 2),
            "status": "confirmed",
            "created_at": datetime.now(timezone.utc),
        }
        await self.db.catering_orders.insert_one(order)
        order["created_at"] = order["created_at"].isoformat()
        return order

    async def list_catering_orders(
        self,
        tenant_id: str,
        event_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"tenant_id": tenant_id}
        if event_id:
            query["event_id"] = event_id
        orders = await self.db.catering_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
        return orders

    # ------------------------------------------------------------------
    # Banquet Event Orders (BEO)
    # ------------------------------------------------------------------
    async def create_beo(
        self,
        tenant_id: str,
        payload: BanquetEventOrderCreate,
    ) -> Dict[str, Any]:
        # Validate meeting room
        room = await self.db.meeting_rooms.find_one(
            {"tenant_id": tenant_id, "id": payload.meeting_room_id},
            {"_id": 0, "room_name": 1},
        )
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting room not found")

        beo = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "event_name": payload.event_name,
            "event_date": payload.event_date,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
            "expected_guests": payload.expected_guests,
            "meeting_room_id": payload.meeting_room_id,
            "setup_style": payload.setup_style.value,
            "av_requirements": payload.av_requirements,
            "total_cost": payload.total_cost,
            "catering_order_id": payload.catering_order_id,
            "status": payload.status.value,
            "notes": payload.notes,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await self.db.banquet_event_orders.insert_one(beo)
        return self._serialize_datetime_fields(beo)

    async def list_beo(
        self,
        tenant_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"tenant_id": tenant_id}
        filters = {}
        if start_date:
            filters["$gte"] = start_date
        if end_date:
            filters["$lte"] = end_date
        if filters:
            query["event_date"] = filters

        beos = await self.db.banquet_event_orders.find(query, {"_id": 0}).sort("event_date", 1).to_list(200)
        return [self._serialize_datetime_fields(beo) for beo in beos]

    async def get_beo_details(self, tenant_id: str, beo_id: str) -> Dict[str, Any]:
        beo = await self.db.banquet_event_orders.find_one(
            {"tenant_id": tenant_id, "id": beo_id},
            {"_id": 0},
        )
        if not beo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="BEO not found")

        meeting_room = await self.db.meeting_rooms.find_one(
            {"tenant_id": tenant_id, "id": beo["meeting_room_id"]},
            {"_id": 0, "room_name": 1, "capacity": 1},
        )
        catering = None
        if beo.get("catering_order_id"):
            catering = await self.db.catering_orders.find_one(
                {"tenant_id": tenant_id, "id": beo["catering_order_id"]},
                {"_id": 0},
            )

        response = self._serialize_datetime_fields(beo)
        response["meeting_room"] = meeting_room
        response["catering"] = catering
        return response

    # ------------------------------------------------------------------
    # Analytics / Reporting
    # ------------------------------------------------------------------
    async def get_event_calendar(self, tenant_id: str, month: str) -> Dict[str, Any]:
        try:
            month_start = datetime.fromisoformat(f"{month}-01").replace(tzinfo=timezone.utc)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month format") from exc

        next_month = (month_start + timedelta(days=32)).replace(day=1)
        events = await self.db.event_bookings.find(
            {"tenant_id": tenant_id},
            {"_id": 0},
        ).to_list(500)

        filtered = []
        for event in events:
            event_date_str = event.get("event_date")
            if not event_date_str:
                continue
            try:
                event_date = datetime.fromisoformat(event_date_str).replace(tzinfo=timezone.utc)
            except ValueError:
                continue
            if month_start <= event_date < next_month:
                filtered.append(event)

        total_revenue = sum(e.get("total_cost", 0) for e in filtered)
        return {
            "month": month,
            "events": filtered,
            "total_events": len(filtered),
            "total_projected_revenue": round(total_revenue, 2),
        }

    async def get_event_revenue_report(
        self,
        tenant_id: str,
        start_date: str,
        end_date: str,
    ) -> Dict[str, Any]:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        events = await self.db.event_bookings.find(
            {"tenant_id": tenant_id},
            {"_id": 0, "total_cost": 1, "event_date": 1, "event_name": 1},
        ).to_list(1000)

        def _within_range(event_date_str: str) -> bool:
            try:
                event_dt = datetime.fromisoformat(event_date_str)
            except ValueError:
                return False
            return start_dt <= event_dt <= end_dt

        filtered = [e for e in events if e.get("event_date") and _within_range(e["event_date"])]
        total_revenue = round(sum(e.get("total_cost", 0) for e in filtered), 2)
        room_rental = round(total_revenue * 0.4, 2)
        catering = round(total_revenue * 0.5, 2)
        av = round(total_revenue - room_rental - catering, 2)
        return {
            "period": f"{start_date} to {end_date}",
            "total_events": len(filtered),
            "total_revenue": total_revenue,
            "breakdown": {
                "room_rental": room_rental,
                "catering": catering,
                "av_equipment": av,
            },
        }

    async def get_av_equipment(self, tenant_id: str) -> Dict[str, Any]:
        equipment = await self.db.av_equipment.find(
            {"tenant_id": tenant_id},
            {"_id": 0},
        ).to_list(100)
        if not equipment:
            equipment = [
                {"name": "Projector 4K", "quantity": 5, "hourly_rate": 50.0},
                {"name": "Wireless Mic Set", "quantity": 10, "hourly_rate": 25.0},
                {"name": "LED Wall", "quantity": 2, "daily_rate": 500.0},
            ]
        return {"equipment": equipment}

    async def save_floor_plan(self, tenant_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        plan = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": plan_data.get("name", "Plan"),
            "payload": plan_data,
            "created_at": datetime.now(timezone.utc),
        }
        await self.db.event_floor_plans.insert_one(plan)
        plan["created_at"] = plan["created_at"].isoformat()
        return plan

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _serialize_datetime_fields(document: Dict[str, Any]) -> Dict[str, Any]:
        if not document:
            return document
        serialized = document.copy()
        for key in ["start_datetime", "end_datetime", "created_at", "updated_at"]:
            value = serialized.get(key)
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
        return serialized

    # ------------------------------------------------------------------
    # Group Reservations & Analytics
    # ------------------------------------------------------------------
    async def get_group_pickup(self, tenant_id: str, group_id: str) -> Dict[str, Any]:
        group = await self.db.group_reservations.find_one(
            {'tenant_id': tenant_id, 'id': group_id},
            {'_id': 0}
        )
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group reservation not found")

        bookings = await self.db.bookings.find(
            {'tenant_id': tenant_id, 'group_id': group_id},
            {'_id': 0}
        ).to_list(1000)

        total_rooms = group.get('total_rooms', len(bookings))
        rooms_picked_up = len(bookings)
        pickup_percentage = round((rooms_picked_up / total_rooms) * 100, 2) if total_rooms else 0.0

        check_in = self._ensure_datetime(group.get('check_in_date'))
        days_until_event = (check_in - datetime.now(timezone.utc)).days if check_in else None

        total_revenue = 0.0
        room_type_distribution: Dict[str, int] = {}
        pace_map: Dict[str, int] = {}

        for booking in bookings:
            total_amount = booking.get('total_amount')
            if total_amount is None:
                rate = booking.get('base_rate') or booking.get('nightly_rate') or 0
                total_amount = rate * booking.get('nights', 1)
            total_revenue += total_amount

            room_type = booking.get('room_type', 'standard')
            room_type_distribution[room_type] = room_type_distribution.get(room_type, 0) + 1

            created_at = self._ensure_datetime(booking.get('created_at'))
            if created_at:
                bucket = created_at.date().isoformat()
                pace_map[bucket] = pace_map.get(bucket, 0) + 1

        average_rate = round(total_revenue / rooms_picked_up, 2) if rooms_picked_up else 0.0
        pace = [
            {'date': date, 'rooms_added': count}
            for date, count in sorted(pace_map.items())
        ]

        next_milestone = None
        for threshold in [0.5, 0.75, 1.0]:
            target_rooms = int(total_rooms * threshold)
            if rooms_picked_up < target_rooms:
                next_milestone = {
                    'target_percentage': int(threshold * 100),
                    'rooms_needed': max(0, target_rooms - rooms_picked_up)
                }
                break

        return {
            'group': {
                'id': group['id'],
                'name': group.get('group_name'),
                'group_type': group.get('group_type'),
                'contact_person': group.get('contact_person'),
                'check_in_date': group.get('check_in_date'),
                'check_out_date': group.get('check_out_date'),
                'status': group.get('status')
            },
            'pickup_summary': {
                'total_rooms_blocked': total_rooms,
                'rooms_picked_up': rooms_picked_up,
                'pickup_percentage': pickup_percentage,
                'expected_revenue': round(total_revenue, 2),
                'average_rate': average_rate,
                'days_until_event': days_until_event
            },
            'pace': pace,
            'room_type_distribution': room_type_distribution,
            'next_milestone': next_milestone
        }

    async def get_event_analytics(self, tenant_id: str, lookahead_days: int = 60) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        window_end = now + timedelta(days=lookahead_days)

        events = await self.db.event_bookings.find(
            {'tenant_id': tenant_id},
            {'_id': 0}
        ).to_list(1000)

        upcoming = []
        for event in events:
            event_date = self._ensure_datetime(event.get('event_date'))
            if event_date and now <= event_date <= window_end:
                event_copy = event.copy()
                event_copy['event_date'] = event_date
                upcoming.append(event_copy)

        total_revenue = sum(e.get('total_cost', 0.0) for e in upcoming)
        total_attendance = sum(e.get('expected_attendees', 0) for e in upcoming)
        events_by_setup: Dict[str, int] = {}

        for event in upcoming:
            setup = event.get('setup_type', 'other')
            events_by_setup[setup] = events_by_setup.get(setup, 0) + 1

        top_events = sorted(
            upcoming,
            key=lambda e: e.get('total_cost', 0),
            reverse=True
        )[:5]

        weekly_buckets: Dict[str, Dict[str, float]] = {}
        for event in upcoming:
            event_date = event['event_date']
            week_start = (event_date - timedelta(days=event_date.weekday())).date().isoformat()
            bucket = weekly_buckets.setdefault(week_start, {'events': 0, 'revenue': 0.0})
            bucket['events'] += 1
            bucket['revenue'] += event.get('total_cost', 0.0)

        timeline = [
            {'week_start': week, 'events': data['events'], 'revenue': round(data['revenue'], 2)}
            for week, data in sorted(weekly_buckets.items())
        ]

        return {
            'window_days': lookahead_days,
            'total_events': len(upcoming),
            'projected_revenue': round(total_revenue, 2),
            'average_attendance': round(total_attendance / len(upcoming), 2) if upcoming else 0,
            'events_by_setup': events_by_setup,
            'top_events': [
                {
                    'event_name': e.get('event_name'),
                    'event_date': e['event_date'].date().isoformat(),
                    'expected_attendees': e.get('expected_attendees', 0),
                    'total_cost': e.get('total_cost', 0.0),
                    'meeting_room_id': e.get('meeting_room_id')
                }
                for e in top_events
            ],
            'timeline': timeline
        }
