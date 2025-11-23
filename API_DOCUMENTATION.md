# 📖 Hotel PMS API Documentation

## Base URL
```
Production: https://api.hotelpm s.com/api
Development: http://localhost:8001/api
```

## Authentication
All API requests require JWT authentication token in the header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### POST /auth/login
Login and get JWT token

**Request:**
```json
{
  "email": "admin@hotel.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "user_id": "uuid",
    "email": "admin@hotel.com",
    "role": "admin",
    "tenant_id": "tenant-uuid"
  }
}
```

---

## 📊 Dashboard Endpoints

### GET /pms/dashboard
Get main PMS dashboard data

**Cache**: 5 minutes

**Response:**
```json
{
  "total_rooms": 550,
  "occupied_rooms": 412,
  "available_rooms": 138,
  "occupancy_rate": 74.9,
  "today_checkins": 45,
  "total_guests": 1250
}
```

### GET /housekeeping/room-status
Get housekeeping room status board

**Cache**: 1 minute

**Response:**
```json
{
  "rooms": [
    {
      "room_id": "uuid",
      "room_number": "101",
      "status": "dirty",
      "floor": 1,
      "room_type": "deluxe"
    }
  ],
  "status_counts": {
    "available": 138,
    "occupied": 412,
    "dirty": 45,
    "cleaning": 12
  },
  "total_rooms": 550
}
```

### GET /dashboard/employee-performance
Get employee performance metrics

**Cache**: 10 minutes

**Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `department` (optional): Department filter

**Response:**
```json
{
  "housekeeping": {
    "staff": [
      {
        "staff_id": "uuid",
        "name": "John Doe",
        "rooms_cleaned": 145,
        "avg_time_minutes": 28,
        "rating": 4.5
      }
    ]
  },
  "front_desk": {
    "avg_checkin_duration_minutes": 12
  }
}
```

---

## 🏨 Booking Endpoints

### GET /pms/bookings
List all bookings with pagination

**Parameters:**
- `page` (default: 1)
- `page_size` (default: 50)
- `status` (optional): confirmed, checked_in, checked_out, cancelled
- `check_in_start` (optional)
- `check_in_end` (optional)

**Response:**
```json
{
  "items": [
    {
      "booking_id": "uuid",
      "guest_name": "John Smith",
      "room_number": "101",
      "check_in": "2025-01-20",
      "check_out": "2025-01-25",
      "status": "confirmed",
      "total_amount": 1250.00
    }
  ],
  "total": 1245,
  "page": 1,
  "page_size": 50,
  "total_pages": 25,
  "has_next": true,
  "has_prev": false
}
```

### POST /pms/bookings
Create new booking

**Request:**
```json
{
  "guest_id": "uuid",
  "room_id": "uuid",
  "check_in": "2025-01-20",
  "check_out": "2025-01-25",
  "adults": 2,
  "children": 1,
  "rate_per_night": 250.00,
  "channel": "direct"
}
```

**Response:**
```json
{
  "booking_id": "uuid",
  "confirmation_number": "BK-20250120-001",
  "status": "confirmed",
  "total_amount": 1250.00
}
```

---

## 📊 Monitoring Endpoints

### GET /monitoring/health
System health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "components": {
    "database": {"status": "healthy", "type": "MongoDB"},
    "cache": {
      "status": "healthy",
      "connected_clients": 5,
      "used_memory_human": "45.2MB",
      "total_keys": 342
    },
    "system": {
      "status": "healthy",
      "cpu_usage": 15.3,
      "memory_usage": 42.7,
      "disk_usage": 38.2
    }
  }
}
```

### GET /monitoring/metrics
Prometheus metrics

**Response:** Plain text Prometheus metrics

---

## 🚨 Rate Limits

| Endpoint Type | Rate Limit |
|--------------|------------|
| Authentication | 10 req/min |
| Read Operations | 100 req/min |
| Write Operations | 50 req/min |
| Reports/Exports | 10 req/min |
| Admin | 500 req/min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705750200
Retry-After: 45
```

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (not in localStorage for sensitive data)
3. **Implement token refresh** before expiration
4. **Use strong passwords** (min 8 chars, mixed case, numbers)
5. **Log out on inactivity**
6. **Validate all inputs** on client side
7. **Handle errors gracefully** without exposing sensitive info

---

## 📦 Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Hotel PMS API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {"key": "token", "value": "{{jwt_token}}", "type": "string"}
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\"email\": \"admin@hotel.com\", \"password\": \"admin123\"}"
            },
            "url": {"raw": "{{base_url}}/auth/login"}
          }
        }
      ]
    },
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Get PMS Dashboard",
          "request": {
            "method": "GET",
            "url": {"raw": "{{base_url}}/pms/dashboard"}
          }
        },
        {
          "name": "Get Room Status",
          "request": {
            "method": "GET",
            "url": {"raw": "{{base_url}}/housekeeping/room-status"}
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8001/api"
    },
    {
      "key": "jwt_token",
      "value": "your_token_here"
    }
  ]
}
```

---

## 🐛 Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-20
