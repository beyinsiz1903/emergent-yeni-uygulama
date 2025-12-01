from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from fastapi import BackgroundTasks
from typing import List, Dict, Any, Optional
from server import db, get_current_user, User
from celery_app import celery_app
import httpx

class BookingCredentialManager:
    @staticmethod
    async def upsert_credentials(
        tenant_id: str,
        property_id: str,
        username: str,
        password: str,
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "provider": "booking",
            "property_id": property_id,
            "username": username,
            "password": password,
            "settings": settings or {},
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        await db.ota_credentials.update_one(
            {"tenant_id": tenant_id, "provider": "booking"},
            {"$set": record},
            upsert=True
        )
        record.pop("_id", None)
        return record

    @staticmethod
    async def get_credentials(tenant_id: str) -> Optional[Dict[str, Any]]:
        doc = await db.ota_credentials.find_one(
            {"tenant_id": tenant_id, "provider": "booking"},
            {"_id": 0}
        )
        return doc


class BookingPayloadBuilder:
    def __init__(self, tenant_id: str, credentials: Dict[str, Any]):
        self.tenant_id = tenant_id
        self.credentials = credentials

    def build_rate_payload(self, rooms: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "property_id": self.credentials.get("property_id"),
            "rooms": [
                {
                    "room_code": r["room_code"],
                    "rate_plan": r["rate_plan"],
                    "date": r["date"],
                    "price": r["price"],
                    "currency": r.get("currency", "EUR"),
                    "min_stay": r.get("min_stay", 1),
                    "closed": r.get("closed", False),
                }
                for r in rooms
            ],
        }


class BookingIntegrationLogger:
    @staticmethod
    async def log_event(tenant_id: str, event_type: str, payload: Dict[str, Any], status: str, message: Optional[str] = None):
        record = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "provider": "booking",
            "event_type": event_type,
            "payload": payload,
            "status": status,
            "message": message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.booking_integration_logs.insert_one(record)


class BookingAPIClient:
    def __init__(self, credentials: Dict[str, Any]):
        self.credentials = credentials
        self.base_url = credentials.get("settings", {}).get("base_url", "https://api.mock-booking.com")

    async def push_ari(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/ari"
        async with httpx.AsyncClient(timeout=10) as client:
            # Mock response for now
            await asyncio.sleep(0.1)
            return {"success": True, "rooms": len(payload.get("rooms", [])), "endpoint": endpoint}

    async def fetch_reservations(self, modified_since: Optional[str] = None) -> Dict[str, Any]:
        endpoint = f"{self.base_url}/reservations"
        async with httpx.AsyncClient(timeout=10) as client:
            await asyncio.sleep(0.1)
            return {
                "success": True,
                "reservations": [
                    {
                        "id": f"BOOK-{uuid.uuid4().hex[:8]}",
                        "guest_name": "Booking Guest",
                        "room_code": "DLX",
                        "check_in": datetime.now(timezone.utc).isoformat(),
                        "check_out": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
                        "status": "confirmed",
                        "total_amount": 300,
                        "currency": "EUR"
                    }
                ],
                "endpoint": endpoint
            }

booking_router = APIRouter(prefix="/booking", tags=["booking-integrations"])

class RoomRate(BaseModel):
    room_code: str
    rate_plan: str
    date: str
    price: float
    currency: str = "EUR"
    min_stay: int = 1
    closed: bool = False


class BookingPushRequest(BaseModel):
    rooms: List[RoomRate]


@booking_router.post("/credentials")
async def upsert_booking_credentials(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    required = ['property_id', 'username', 'password']
    if not all(field in payload for field in required):
        raise HTTPException(status_code=400, detail="property_id, username, password required")
    record = await BookingCredentialManager.upsert_credentials(
        tenant_id=current_user.tenant_id,
        property_id=payload['property_id'],
        username=payload['username'],
        password=payload['password'],
        settings=payload.get('settings')
    )
    return {"success": True, "credentials": record}

@booking_router.get("/credentials")
async def get_booking_credentials(current_user: User = Depends(get_current_user)):
    creds = await BookingCredentialManager.get_credentials(current_user.tenant_id)
    if not creds:
        raise HTTPException(status_code=404, detail="Booking.com credentials not found")
    return creds

@booking_router.post("/ari/push")
async def trigger_booking_ari_push(
    payload: BookingPushRequest,
    current_user: User = Depends(get_current_user)
):
    credentials = await BookingCredentialManager.get_credentials(current_user.tenant_id)
    if not credentials:
        raise HTTPException(status_code=400, detail="Booking.com credentials missing")

    builder = BookingPayloadBuilder(current_user.tenant_id, credentials)
    push_payload = builder.build_rate_payload([room.model_dump() for room in payload.rooms])

    celery_app.send_task('celery_tasks.booking_push_task', args=[current_user.tenant_id, push_payload])
    await BookingIntegrationLogger.log_event(
        current_user.tenant_id,
        'ari_push',
        push_payload,
        'queued',
        message='Booking.com ARI push queued'
    )
    return {"success": True, "queued": True}

@booking_router.post("/reservations/pull")
async def trigger_booking_reservation_pull(
    current_user: User = Depends(get_current_user)
):
    credentials = await BookingCredentialManager.get_credentials(current_user.tenant_id)
    if not credentials:
        raise HTTPException(status_code=400, detail="Booking.com credentials missing")

    celery_app.send_task('celery_tasks.booking_pull_task', args=[current_user.tenant_id])
    await BookingIntegrationLogger.log_event(
        current_user.tenant_id,
        'reservation_pull',
        {"tenant_id": current_user.tenant_id},
        'queued',
        message='Booking.com reservation pull queued'
    )
    return {"success": True, "queued": True}

@booking_router.get("/logs")
async def list_booking_logs(limit: int = 20, current_user: User = Depends(get_current_user)):
    cursor = db.booking_integration_logs.find(
        {'tenant_id': current_user.tenant_id},
        {'_id': 0}
    ).sort('created_at', -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return {"items": items, "count": len(items)}

