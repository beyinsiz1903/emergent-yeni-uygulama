from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date, timedelta
from enum import Enum
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    FRONT_DESK = "front_desk"
    SALES = "sales"
    ACCOUNTING = "accounting"
    HOUSEKEEPING = "housekeeping"
    MANAGER = "manager"

class ReservationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class RoomStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    OUT_OF_ORDER = "out_of_order"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    REFUNDED = "refunded"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole
    department: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    department: Optional[str] = None

class Guest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    loyalty_member: bool = False
    loyalty_points: int = 0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GuestCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None

class RoomType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    base_price: float
    max_occupancy: int
    amenities: List[str] = []
    image_url: Optional[str] = None
    active: bool = True

class RoomTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: float
    max_occupancy: int
    amenities: List[str] = []
    image_url: Optional[str] = None

class Room(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_number: str
    room_type_id: str
    floor: int
    status: RoomStatus = RoomStatus.AVAILABLE
    notes: Optional[str] = None

class RoomCreate(BaseModel):
    room_number: str
    room_type_id: str
    floor: int
    notes: Optional[str] = None

class RoomRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_type_id: str
    date: str  # YYYY-MM-DD format
    rate: float
    channel: str = "direct"  # direct, booking.com, expedia, etc.

class RoomRateCreate(BaseModel):
    room_type_id: str
    date: str
    rate: float
    channel: str = "direct"

class Reservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guest_id: str
    room_id: str
    room_type_id: str
    check_in: str
    check_out: str
    adults: int
    children: int = 0
    status: ReservationStatus = ReservationStatus.PENDING
    total_amount: float
    paid_amount: float = 0
    channel: str = "direct"
    special_requests: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None

class ReservationCreate(BaseModel):
    guest_id: str
    room_type_id: str
    check_in: str
    check_out: str
    adults: int
    children: int = 0
    channel: str = "direct"
    special_requests: Optional[str] = None

class FolioCharge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reservation_id: str
    description: str
    amount: float
    category: str  # room, food, beverage, service, etc.
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FolioChargeCreate(BaseModel):
    reservation_id: str
    description: str
    amount: float
    category: str

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reservation_id: str
    guest_id: str
    invoice_number: str
    total_amount: float
    tax_amount: float
    discount: float = 0
    final_amount: float
    payment_status: PaymentStatus = PaymentStatus.PENDING
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None

class InvoiceCreate(BaseModel):
    reservation_id: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    reservation_id: Optional[str] = None
    amount: float
    currency: str
    payment_status: str
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    reservation_id: str
    origin_url: str

class DashboardStats(BaseModel):
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    occupancy_rate: float
    today_checkins: int
    today_checkouts: int
    pending_reservations: int
    revenue_today: float
    revenue_month: float

# Helper functions
def get_stripe_client(request: Request) -> StripeCheckout:
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

async def get_available_rooms(room_type_id: str, check_in: str, check_out: str) -> List[str]:
    """Get available rooms for a room type and date range"""
    # Find all rooms of this type
    rooms = await db.rooms.find({"room_type_id": room_type_id, "status": {"$in": ["available", "cleaning"]}}, {"_id": 0}).to_list(1000)
    room_ids = [r["id"] for r in rooms]
    
    # Find reservations that overlap with the requested dates
    overlapping = await db.reservations.find({
        "room_id": {"$in": room_ids},
        "status": {"$in": ["confirmed", "checked_in"]},
        "$or": [
            {"check_in": {"$lt": check_out}, "check_out": {"$gt": check_in}}
        ]
    }, {"_id": 0}).to_list(1000)
    
    occupied_room_ids = [r["room_id"] for r in overlapping]
    available_room_ids = [rid for rid in room_ids if rid not in occupied_room_ids]
    
    return available_room_ids

# Routes
@api_router.get("/")
async def root():
    return {"message": "Hotel PMS API"}

# Dashboard
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # Get total rooms
    total_rooms = await db.rooms.count_documents({})
    occupied_rooms = await db.rooms.count_documents({"status": "occupied"})
    available_rooms = await db.rooms.count_documents({"status": "available"})
    
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # Today's date
    today = date.today().isoformat()
    
    # Today's check-ins and check-outs
    today_checkins = await db.reservations.count_documents({"check_in": today, "status": {"$ne": "cancelled"}})
    today_checkouts = await db.reservations.count_documents({"check_out": today, "status": "checked_in"})
    
    # Pending reservations
    pending = await db.reservations.count_documents({"status": "pending"})
    
    # Revenue calculation
    today_payments = await db.payment_transactions.find({
        "payment_status": "paid",
        "created_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()}
    }, {"_id": 0}).to_list(1000)
    revenue_today = sum(p.get("amount", 0) for p in today_payments)
    
    # Month revenue
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_payments = await db.payment_transactions.find({
        "payment_status": "paid",
        "created_at": {"$gte": start_of_month.isoformat()}
    }, {"_id": 0}).to_list(1000)
    revenue_month = sum(p.get("amount", 0) for p in month_payments)
    
    return DashboardStats(
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms,
        available_rooms=available_rooms,
        occupancy_rate=round(occupancy_rate, 2),
        today_checkins=today_checkins,
        today_checkouts=today_checkouts,
        pending_reservations=pending,
        revenue_today=round(revenue_today, 2),
        revenue_month=round(revenue_month, 2)
    )

# Users
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user = User(**user_data.model_dump())
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

# Guests
@api_router.post("/guests", response_model=Guest)
async def create_guest(guest_data: GuestCreate):
    guest = Guest(**guest_data.model_dump())
    doc = guest.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.guests.insert_one(doc)
    return guest

@api_router.get("/guests", response_model=List[Guest])
async def get_guests():
    guests = await db.guests.find({}, {"_id": 0}).to_list(1000)
    for guest in guests:
        if isinstance(guest.get('created_at'), str):
            guest['created_at'] = datetime.fromisoformat(guest['created_at'])
    return guests

@api_router.get("/guests/{guest_id}", response_model=Guest)
async def get_guest(guest_id: str):
    guest = await db.guests.find_one({"id": guest_id}, {"_id": 0})
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    if isinstance(guest.get('created_at'), str):
        guest['created_at'] = datetime.fromisoformat(guest['created_at'])
    return guest

@api_router.put("/guests/{guest_id}", response_model=Guest)
async def update_guest(guest_id: str, guest_data: GuestCreate):
    existing = await db.guests.find_one({"id": guest_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Guest not found")
    
    update_data = guest_data.model_dump()
    await db.guests.update_one({"id": guest_id}, {"$set": update_data})
    
    updated = await db.guests.find_one({"id": guest_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

# Room Types
@api_router.post("/room-types", response_model=RoomType)
async def create_room_type(room_type_data: RoomTypeCreate):
    room_type = RoomType(**room_type_data.model_dump())
    await db.room_types.insert_one(room_type.model_dump())
    return room_type

@api_router.get("/room-types", response_model=List[RoomType])
async def get_room_types():
    room_types = await db.room_types.find({"active": True}, {"_id": 0}).to_list(1000)
    return room_types

@api_router.get("/room-types/{room_type_id}", response_model=RoomType)
async def get_room_type(room_type_id: str):
    room_type = await db.room_types.find_one({"id": room_type_id}, {"_id": 0})
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    return room_type

# Rooms
@api_router.post("/rooms", response_model=Room)
async def create_room(room_data: RoomCreate):
    # Check if room type exists
    room_type = await db.room_types.find_one({"id": room_data.room_type_id})
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    room = Room(**room_data.model_dump())
    await db.rooms.insert_one(room.model_dump())
    return room

@api_router.get("/rooms", response_model=List[Room])
async def get_rooms():
    rooms = await db.rooms.find({}, {"_id": 0}).to_list(1000)
    return rooms

@api_router.get("/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str):
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@api_router.put("/rooms/{room_id}/status")
async def update_room_status(room_id: str, status: RoomStatus):
    result = await db.rooms.update_one({"id": room_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room status updated"}

# Room Rates
@api_router.post("/room-rates", response_model=RoomRate)
async def create_room_rate(rate_data: RoomRateCreate):
    rate = RoomRate(**rate_data.model_dump())
    await db.room_rates.insert_one(rate.model_dump())
    return rate

@api_router.get("/room-rates")
async def get_room_rates(room_type_id: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if room_type_id:
        query["room_type_id"] = room_type_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    rates = await db.room_rates.find(query, {"_id": 0}).to_list(1000)
    return rates

# Reservations
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation_data: ReservationCreate):
    # Check guest exists
    guest = await db.guests.find_one({"id": reservation_data.guest_id})
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    
    # Check room type exists
    room_type = await db.room_types.find_one({"id": reservation_data.room_type_id})
    if not room_type:
        raise HTTPException(status_code=404, detail="Room type not found")
    
    # Find available room
    available_rooms = await get_available_rooms(
        reservation_data.room_type_id,
        reservation_data.check_in,
        reservation_data.check_out
    )
    
    if not available_rooms:
        raise HTTPException(status_code=400, detail="No available rooms for the selected dates")
    
    # Calculate total amount
    check_in_date = datetime.fromisoformat(reservation_data.check_in)
    check_out_date = datetime.fromisoformat(reservation_data.check_out)
    nights = (check_out_date - check_in_date).days
    total_amount = room_type["base_price"] * nights
    
    # Create reservation
    reservation = Reservation(
        **reservation_data.model_dump(),
        room_id=available_rooms[0],
        total_amount=total_amount
    )
    
    doc = reservation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reservations.insert_one(doc)
    
    return reservation

@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations(status: Optional[ReservationStatus] = None):
    query = {}
    if status:
        query["status"] = status
    
    reservations = await db.reservations.find(query, {"_id": 0}).to_list(1000)
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
        if res.get('checked_in_at') and isinstance(res['checked_in_at'], str):
            res['checked_in_at'] = datetime.fromisoformat(res['checked_in_at'])
        if res.get('checked_out_at') and isinstance(res['checked_out_at'], str):
            res['checked_out_at'] = datetime.fromisoformat(res['checked_out_at'])
    return reservations

@api_router.get("/reservations/{reservation_id}", response_model=Reservation)
async def get_reservation(reservation_id: str):
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if isinstance(reservation.get('created_at'), str):
        reservation['created_at'] = datetime.fromisoformat(reservation['created_at'])
    if reservation.get('checked_in_at') and isinstance(reservation['checked_in_at'], str):
        reservation['checked_in_at'] = datetime.fromisoformat(reservation['checked_in_at'])
    if reservation.get('checked_out_at') and isinstance(reservation['checked_out_at'], str):
        reservation['checked_out_at'] = datetime.fromisoformat(reservation['checked_out_at'])
    return reservation

@api_router.post("/reservations/{reservation_id}/check-in")
async def check_in_reservation(reservation_id: str):
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Can only check-in confirmed reservations")
    
    # Update reservation status
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": "checked_in", "checked_in_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update room status
    await db.rooms.update_one(
        {"id": reservation["room_id"]},
        {"$set": {"status": "occupied"}}
    )
    
    return {"message": "Check-in successful"}

@api_router.post("/reservations/{reservation_id}/check-out")
async def check_out_reservation(reservation_id: str):
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation["status"] != "checked_in":
        raise HTTPException(status_code=400, detail="Can only check-out checked-in reservations")
    
    # Update reservation status
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": "checked_out", "checked_out_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update room status
    await db.rooms.update_one(
        {"id": reservation["room_id"]},
        {"$set": {"status": "cleaning"}}
    )
    
    return {"message": "Check-out successful"}

@api_router.post("/reservations/{reservation_id}/change-room")
async def change_room(reservation_id: str, new_room_id: str):
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check new room is available
    new_room = await db.rooms.find_one({"id": new_room_id})
    if not new_room or new_room["status"] not in ["available", "cleaning"]:
        raise HTTPException(status_code=400, detail="Room not available")
    
    old_room_id = reservation["room_id"]
    
    # Update reservation
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"room_id": new_room_id}}
    )
    
    # Update old room status
    if reservation["status"] == "checked_in":
        await db.rooms.update_one({"id": old_room_id}, {"$set": {"status": "cleaning"}})
        await db.rooms.update_one({"id": new_room_id}, {"$set": {"status": "occupied"}})
    
    return {"message": "Room changed successfully"}

@api_router.post("/reservations/{reservation_id}/cancel")
async def cancel_reservation(reservation_id: str):
    reservation = await db.reservations.find_one({"id": reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation["status"] in ["checked_in", "checked_out", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel this reservation")
    
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Reservation cancelled"}

# Calendar/Availability
@api_router.get("/calendar/availability")
async def get_availability(start_date: str, end_date: str, room_type_id: Optional[str] = None):
    """Get room availability for calendar view"""
    # Get all room types or specific one
    query = {"active": True}
    if room_type_id:
        query["id"] = room_type_id
    
    room_types = await db.room_types.find(query, {"_id": 0}).to_list(1000)
    
    # Generate date range
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    dates = []
    current = start
    while current <= end:
        dates.append(current.date().isoformat())
        current += timedelta(days=1)
    
    result = []
    for room_type in room_types:
        availability_data = {
            "room_type_id": room_type["id"],
            "room_type_name": room_type["name"],
            "dates": []
        }
        
        for date_str in dates:
            # Get all rooms of this type
            rooms = await db.rooms.find({"room_type_id": room_type["id"]}, {"_id": 0}).to_list(1000)
            total_rooms = len(rooms)
            
            # Get reservations for this date
            next_date = (datetime.fromisoformat(date_str) + timedelta(days=1)).date().isoformat()
            reservations = await db.reservations.find({
                "room_type_id": room_type["id"],
                "status": {"$in": ["confirmed", "checked_in"]},
                "check_in": {"$lte": date_str},
                "check_out": {"$gt": date_str}
            }, {"_id": 0}).to_list(1000)
            
            occupied = len(reservations)
            available = total_rooms - occupied
            
            # Get rate for this date
            rate_doc = await db.room_rates.find_one({
                "room_type_id": room_type["id"],
                "date": date_str,
                "channel": "direct"
            })
            rate = rate_doc["rate"] if rate_doc else room_type["base_price"]
            
            availability_data["dates"].append({
                "date": date_str,
                "total": total_rooms,
                "available": available,
                "occupied": occupied,
                "rate": rate
            })
        
        result.append(availability_data)
    
    return result

# Folio (Guest Charges)
@api_router.post("/folios", response_model=FolioCharge)
async def add_folio_charge(charge_data: FolioChargeCreate):
    charge = FolioCharge(**charge_data.model_dump())
    doc = charge.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.folios.insert_one(doc)
    return charge

@api_router.get("/folios/{reservation_id}")
async def get_folio_charges(reservation_id: str):
    charges = await db.folios.find({"reservation_id": reservation_id}, {"_id": 0}).to_list(1000)
    for charge in charges:
        if isinstance(charge.get('date'), str):
            charge['date'] = datetime.fromisoformat(charge['date'])
    return charges

# Invoices
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate):
    # Get reservation
    reservation = await db.reservations.find_one({"id": invoice_data.reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Get all folio charges
    folio_charges = await db.folios.find({"reservation_id": invoice_data.reservation_id}, {"_id": 0}).to_list(1000)
    extra_charges = sum(charge["amount"] for charge in folio_charges)
    
    # Calculate amounts
    subtotal = reservation["total_amount"] + extra_charges
    tax_amount = subtotal * 0.1  # 10% tax
    final_amount = subtotal + tax_amount
    
    # Generate invoice number
    invoice_count = await db.invoices.count_documents({}) + 1
    invoice_number = f"INV-{datetime.now().year}-{invoice_count:05d}"
    
    invoice = Invoice(
        reservation_id=invoice_data.reservation_id,
        guest_id=reservation["guest_id"],
        invoice_number=invoice_number,
        total_amount=subtotal,
        tax_amount=tax_amount,
        final_amount=final_amount
    )
    
    doc = invoice.model_dump()
    doc['issued_at'] = doc['issued_at'].isoformat()
    await db.invoices.insert_one(doc)
    
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    for inv in invoices:
        if isinstance(inv.get('issued_at'), str):
            inv['issued_at'] = datetime.fromisoformat(inv['issued_at'])
        if inv.get('paid_at') and isinstance(inv['paid_at'], str):
            inv['paid_at'] = datetime.fromisoformat(inv['paid_at'])
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if isinstance(invoice.get('issued_at'), str):
        invoice['issued_at'] = datetime.fromisoformat(invoice['issued_at'])
    if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
        invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    return invoice

# Payments
@api_router.post("/payments/checkout")
async def create_checkout_session(checkout_req: CheckoutRequest, request: Request):
    # Get reservation
    reservation = await db.reservations.find_one({"id": checkout_req.reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Calculate amount to pay
    amount_to_pay = reservation["total_amount"] - reservation.get("paid_amount", 0)
    
    if amount_to_pay <= 0:
        raise HTTPException(status_code=400, detail="Reservation already paid")
    
    # Create Stripe checkout session
    stripe_client = get_stripe_client(request)
    
    success_url = f"{checkout_req.origin_url}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{checkout_req.origin_url}/reservations"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount_to_pay),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "reservation_id": checkout_req.reservation_id,
            "type": "reservation_payment"
        }
    )
    
    session = await stripe_client.create_checkout_session(checkout_request)
    
    # Store payment transaction
    transaction = PaymentTransaction(
        session_id=session.session_id,
        reservation_id=checkout_req.reservation_id,
        amount=amount_to_pay,
        currency="usd",
        payment_status="pending",
        metadata={"reservation_id": checkout_req.reservation_id}
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    stripe_client = get_stripe_client(request)
    
    try:
        status = await stripe_client.get_checkout_status(session_id)
        
        # Update transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction and transaction["payment_status"] != "paid":
            if status.payment_status == "paid":
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Update reservation
                reservation_id = transaction["reservation_id"]
                if reservation_id:
                    reservation = await db.reservations.find_one({"id": reservation_id})
                    if reservation:
                        new_paid_amount = reservation.get("paid_amount", 0) + transaction["amount"]
                        updates = {"paid_amount": new_paid_amount}
                        
                        if new_paid_amount >= reservation["total_amount"] and reservation["status"] == "pending":
                            updates["status"] = "confirmed"
                        
                        await db.reservations.update_one({"id": reservation_id}, {"$set": updates})
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_client = get_stripe_client(request)
    
    try:
        webhook_response = await stripe_client.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return {"received": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
