# Booking API Testing Instructions

This document provides instructions for testing the booking session APIs using Postman or any API testing tool.

## Base URL
```
http://localhost:8081/api/bookings
```

## Endpoints

### 1. Create a Booking (POST /api/bookings)
- **URL:** `/api/bookings`
- **Method:** POST
- **Headers:**
  - Content-Type: application/json
  - Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "expert_id": "expert-user-id",
  "seeker_id": "seeker-user-id",
  "date": "YYYY-MM-DD",
  "start_time": "HH:mm",
  "end_time": "HH:mm",
  "session_type": "video|audio|chat",
  "amount": 100.00
}
```
- **Success Response:**
  - Status: 201 Created
  - Body:
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": {
      "id": "booking-id",
      "expert_id": "expert-user-id",
      "seeker_id": "seeker-user-id",
      "date": "YYYY-MM-DD",
      "start_time": "HH:mm",
      "end_time": "HH:mm",
      "session_type": "video",
      "status": "pending",
      "amount": 100.00,
      "created_at": "timestamp"
    }
  }
  ```

### 2. Get Bookings for Expert (GET /api/bookings/expert/:id)
- **URL:** `/api/bookings/expert/{expert_id}`
- **Method:** GET
- **Headers:**
  - Authorization: Bearer <token>
- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "booking-id",
        "expert_id": "expert-user-id",
        "seeker_id": "seeker-user-id",
        "seeker_name": "Seeker Name",
        "date": "YYYY-MM-DD",
        "start_time": "HH:mm",
        "end_time": "HH:mm",
        "session_type": "video",
        "status": "pending",
        "amount": 100.00,
        "created_at": "timestamp"
      },
      ...
    ]
  }
  ```

### 3. Get Bookings for Seeker (GET /api/bookings/seeker/:id)
- **URL:** `/api/bookings/seeker/{seeker_id}`
- **Method:** GET
- **Headers:**
  - Authorization: Bearer <token>
- **Success Response:** Similar to expert bookings.

### 4. Update Booking Status (PUT /api/bookings/:id/status)
- **URL:** `/api/bookings/{booking_id}/status`
- **Method:** PUT
- **Headers:**
  - Content-Type: application/json
  - Authorization: Bearer <token>
- **Body (JSON):**
```json
{
  "status": "pending|confirmed|rejected|completed"
}
```
- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "success": true,
    "message": "Booking status updated successfully",
    "data": {
      "id": "booking-id",
      "status": "confirmed",
      "updated_at": "timestamp"
    }
  }
  ```

## Notes
- Replace `{expert_id}`, `{seeker_id}`, and `{booking_id}` with actual IDs.
- Use a valid JWT token in the Authorization header.
- Time format must be 24-hour "HH:mm".
- Amount is a decimal number representing the price.

## Testing Steps
1. Obtain a valid JWT token by logging in.
2. Use the token in Authorization header for all requests.
3. Create a booking with valid data.
4. Fetch bookings for expert and seeker to verify creation.
5. Update booking status and verify changes.
6. Check notifications for the expert user.

This guide should help you test all booking session related APIs effectively.
