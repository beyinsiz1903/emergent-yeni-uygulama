"""
Seed data script for Hotel PMS
Run with: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding database...")
    
    # Clear existing data
    print("Clearing existing data...")
    await db.users.delete_many({})
    await db.guests.delete_many({})
    await db.room_types.delete_many({})
    await db.rooms.delete_many({})
    await db.reservations.delete_many({})
    await db.room_rates.delete_many({})
    await db.folios.delete_many({})
    await db.invoices.delete_many({})
    await db.payment_transactions.delete_many({})
    
    # Create users
    print("Creating users...")
    users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@hotel.com",
            "name": "Admin User",
            "role": "admin",
            "department": "Management",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "frontdesk@hotel.com",
            "name": "Resepsiyon Görevlisi",
            "role": "front_desk",
            "department": "Front Desk",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"✓ Created {len(users)} users")
    
    # Create room types
    print("Creating room types...")
    room_types = [
        {
            "id": str(uuid.uuid4()),
            "name": "Standard Room",
            "description": "Konforlu standart oda, şehir manzaralı",
            "base_price": 150.0,
            "max_occupancy": 2,
            "amenities": ["WiFi", "Klima", "TV", "Mini Bar"],
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Deluxe Room",
            "description": "Geniş ve lüks oda, deniz manzaralı",
            "base_price": 250.0,
            "max_occupancy": 3,
            "amenities": ["WiFi", "Klima", "TV", "Mini Bar", "Balkon", "Deniz Manzarası"],
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Suite",
            "description": "Premium suit, ayrı oturma alanı ve jakuzi",
            "base_price": 400.0,
            "max_occupancy": 4,
            "amenities": ["WiFi", "Klima", "TV", "Mini Bar", "Balkon", "Deniz Manzarası", "Jakuzi", "Oturma Alanı"],
            "active": True
        }
    ]
    await db.room_types.insert_many(room_types)
    print(f"✓ Created {len(room_types)} room types")
    
    # Create rooms
    print("Creating rooms...")
    rooms = []
    floor = 1
    room_num = 101
    
    # Standard rooms (10 rooms)
    for i in range(10):
        rooms.append({
            "id": str(uuid.uuid4()),
            "room_number": str(room_num),
            "room_type_id": room_types[0]["id"],
            "floor": floor,
            "status": "available",
            "notes": None
        })
        room_num += 1
        if room_num % 10 == 1:
            floor += 1
            room_num = floor * 100 + 1
    
    # Deluxe rooms (10 rooms)
    for i in range(10):
        rooms.append({
            "id": str(uuid.uuid4()),
            "room_number": str(room_num),
            "room_type_id": room_types[1]["id"],
            "floor": floor,
            "status": "available" if i < 7 else "occupied",
            "notes": None
        })
        room_num += 1
        if room_num % 10 == 1:
            floor += 1
            room_num = floor * 100 + 1
    
    # Suite rooms (5 rooms)
    for i in range(5):
        rooms.append({
            "id": str(uuid.uuid4()),
            "room_number": str(room_num),
            "room_type_id": room_types[2]["id"],
            "floor": floor,
            "status": "available" if i < 3 else "occupied",
            "notes": None
        })
        room_num += 1
    
    await db.rooms.insert_many(rooms)
    print(f"✓ Created {len(rooms)} rooms")
    
    # Create guests
    print("Creating guests...")
    guests = [
        {
            "id": str(uuid.uuid4()),
            "first_name": "Ahmet",
            "last_name": "Yılmaz",
            "email": "ahmet.yilmaz@email.com",
            "phone": "+90 555 123 4567",
            "nationality": "Turkish",
            "id_number": "12345678901",
            "loyalty_member": True,
            "loyalty_points": 250,
            "notes": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Ayşe",
            "last_name": "Demir",
            "email": "ayse.demir@email.com",
            "phone": "+90 555 234 5678",
            "nationality": "Turkish",
            "id_number": "23456789012",
            "loyalty_member": False,
            "loyalty_points": 0,
            "notes": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@email.com",
            "phone": "+44 7700 900123",
            "nationality": "British",
            "id_number": "AB123456",
            "loyalty_member": True,
            "loyalty_points": 500,
            "notes": "VIP Guest",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Maria",
            "last_name": "Garcia",
            "email": "maria.garcia@email.com",
            "phone": "+34 600 123 456",
            "nationality": "Spanish",
            "id_number": "ES987654",
            "loyalty_member": False,
            "loyalty_points": 0,
            "notes": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.guests.insert_many(guests)
    print(f"✓ Created {len(guests)} guests")
    
    # Create reservations
    print("Creating reservations...")
    today = datetime.now(timezone.utc).date()
    
    # Get occupied rooms
    occupied_rooms = [r for r in rooms if r["status"] == "occupied"]
    
    reservations = [
        # Current reservation (checked in)
        {
            "id": str(uuid.uuid4()),
            "guest_id": guests[0]["id"],
            "room_id": occupied_rooms[0]["id"],
            "room_type_id": occupied_rooms[0]["room_type_id"],
            "check_in": (today - timedelta(days=2)).isoformat(),
            "check_out": (today + timedelta(days=2)).isoformat(),
            "adults": 2,
            "children": 0,
            "status": "checked_in",
            "total_amount": 600.0,
            "paid_amount": 600.0,
            "channel": "direct",
            "special_requests": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "checked_in_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "checked_out_at": None
        },
        # Upcoming reservation (confirmed)
        {
            "id": str(uuid.uuid4()),
            "guest_id": guests[1]["id"],
            "room_id": rooms[0]["id"],
            "room_type_id": rooms[0]["room_type_id"],
            "check_in": (today + timedelta(days=3)).isoformat(),
            "check_out": (today + timedelta(days=7)).isoformat(),
            "adults": 2,
            "children": 1,
            "status": "confirmed",
            "total_amount": 600.0,
            "paid_amount": 150.0,
            "channel": "booking.com",
            "special_requests": "Üst kat tercihi",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "checked_in_at": None,
            "checked_out_at": None
        },
        # Suite reservation (checked in)
        {
            "id": str(uuid.uuid4()),
            "guest_id": guests[2]["id"],
            "room_id": occupied_rooms[-1]["id"],
            "room_type_id": occupied_rooms[-1]["room_type_id"],
            "check_in": (today - timedelta(days=1)).isoformat(),
            "check_out": (today + timedelta(days=5)).isoformat(),
            "adults": 2,
            "children": 0,
            "status": "checked_in",
            "total_amount": 2400.0,
            "paid_amount": 2400.0,
            "channel": "direct",
            "special_requests": "Late check-out",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "checked_in_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "checked_out_at": None
        },
        # Pending reservation
        {
            "id": str(uuid.uuid4()),
            "guest_id": guests[3]["id"],
            "room_id": rooms[1]["id"],
            "room_type_id": rooms[1]["room_type_id"],
            "check_in": (today + timedelta(days=10)).isoformat(),
            "check_out": (today + timedelta(days=14)).isoformat(),
            "adults": 2,
            "children": 2,
            "status": "pending",
            "total_amount": 600.0,
            "paid_amount": 0.0,
            "channel": "expedia",
            "special_requests": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "checked_in_at": None,
            "checked_out_at": None
        }
    ]
    await db.reservations.insert_many(reservations)
    print(f"✓ Created {len(reservations)} reservations")
    
    # Create room rates for next 30 days
    print("Creating room rates...")
    rates = []
    for room_type in room_types:
        for i in range(30):
            date = (today + timedelta(days=i)).isoformat()
            # Weekend pricing
            day_of_week = (today + timedelta(days=i)).weekday()
            multiplier = 1.3 if day_of_week in [4, 5] else 1.0  # Friday, Saturday
            
            rates.append({
                "id": str(uuid.uuid4()),
                "room_type_id": room_type["id"],
                "date": date,
                "rate": room_type["base_price"] * multiplier,
                "channel": "direct"
            })
    
    await db.room_rates.insert_many(rates)
    print(f"✓ Created {len(rates)} room rates")
    
    print("\n✅ Database seeded successfully!")
    print(f"   • {len(users)} users")
    print(f"   • {len(guests)} guests")
    print(f"   • {len(room_types)} room types")
    print(f"   • {len(rooms)} rooms")
    print(f"   • {len(reservations)} reservations")
    print(f"   • {len(rates)} room rates")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
