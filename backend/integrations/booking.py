from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi import BackgroundTasks
from server import db, get_current_user, User

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


booking_router = APIRouter(prefix="/booking", tags=["booking-integrations"])

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


