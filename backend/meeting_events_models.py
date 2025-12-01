"""
Meeting & Events Management Models
Meeting room booking, event coordination, BEO
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SetupType(str, Enum):
    THEATER = "theater"
    CLASSROOM = "classroom"
    BOARDROOM = "boardroom"
    U_SHAPE = "u_shape"
    BANQUET = "banquet"
    COCKTAIL = "cocktail"


class MeetingRoomStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class MeetingRoomBase(BaseModel):
    room_name: str
    capacity: int
    hourly_rate: float
    full_day_rate: float
    equipment: List[str] = []
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    description: Optional[str] = None


class MeetingRoom(MeetingRoomBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    status: MeetingRoomStatus = MeetingRoomStatus.ACTIVE
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class MeetingRoomCreate(MeetingRoomBase):
    status: MeetingRoomStatus = MeetingRoomStatus.ACTIVE


class MeetingRoomUpdate(MeetingRoomBase):
    status: Optional[MeetingRoomStatus] = None


class MeetingRoomBookingStatus(str, Enum):
    TENTATIVE = "tentative"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class MeetingRoomBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    room_id: str
    event_name: str
    organizer: str
    event_date: str
    start_datetime: datetime
    end_datetime: datetime
    expected_attendees: int
    booking_source: str = "pms"
    event_id: Optional[str] = None
    notes: Optional[str] = None
    status: MeetingRoomBookingStatus = MeetingRoomBookingStatus.CONFIRMED
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    @field_validator("end_datetime")
    @classmethod
    def validate_time_range(cls, value, info):
        start = info.data.get("start_datetime")
        if start and value <= start:
            raise ValueError("End time must be after start time")
        return value


class MeetingRoomBookingCreate(BaseModel):
    event_name: str
    organizer: str
    event_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    expected_attendees: int
    notes: Optional[str] = None
    event_id: Optional[str] = None
    status: MeetingRoomBookingStatus = MeetingRoomBookingStatus.CONFIRMED


class CateringServiceType(str, Enum):
    BUFFET = "buffet"
    PLATED = "plated"
    COCKTAIL = "cocktail"
    BREAK = "coffee_break"


class CateringOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    event_id: str
    menu_items: List[Dict[str, Any]] = []
    guest_count: int
    total_amount: float
    service_type: CateringServiceType
    special_requirements: Optional[str] = None
    status: str = "confirmed"
    created_at: datetime = Field(default_factory=_utcnow)


class CateringOrderCreate(BaseModel):
    event_id: str
    guest_count: int
    menu_items: List[Dict[str, Any]] = []
    service_type: CateringServiceType = CateringServiceType.BUFFET
    special_requirements: Optional[str] = None
    total_amount: Optional[float] = None


class BEOStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    CANCELLED = "cancelled"


class BanquetEventOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    event_name: str
    event_date: str
    start_time: str
    end_time: str
    expected_guests: int
    meeting_room_id: str
    catering_order_id: Optional[str] = None
    setup_style: SetupType
    av_requirements: List[str] = []
    total_cost: float
    status: BEOStatus = BEOStatus.DRAFT
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class BanquetEventOrderCreate(BaseModel):
    event_name: str
    event_date: str
    start_time: str
    end_time: str
    expected_guests: int
    meeting_room_id: str
    setup_style: SetupType
    av_requirements: List[str] = []
    total_cost: float
    catering_order_id: Optional[str] = None
    notes: Optional[str] = None
    status: BEOStatus = BEOStatus.PENDING
