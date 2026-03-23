# Mor Events Backend API Documentation

Complete API routes documentation for connecting the Mor Events frontend dashboards with Express.js/Node.js backend.

## Base URL
```
http://localhost:5000/api
```

---

## Table of Contents
1. [Authentication](#authentication)
2. [Events Management](#events-management)
3. [Registrations Management](#registrations-management)
4. [Reviews Management](#reviews-management)
5. [Analytics](#analytics)
6. [File Upload](#file-upload)
7. [Google Sheets Integration](#google-sheets-integration)

---

## Authentication

### 1. Admin Login
**POST** `/auth/login`

Authenticate admin user and get access token.

**Request Body:**
```json
{
  "email": "admin@morevents.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin_123",
    "email": "admin@morevents.com",
    "name": "Ayush Jaiswal",
    "role": "admin"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 2. Verify Token
**GET** `/auth/verify`

Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "admin_123",
    "email": "admin@morevents.com",
    "role": "admin"
  }
}
```

---

### 3. Logout
**POST** `/auth/logout`

Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Events Management

### 1. Get All Events
**GET** `/events`

Retrieve all events (public endpoint).

**Query Parameters:**
- `status` (optional): Filter by status (`upcoming`, `completed`, `all`)
- `limit` (optional): Number of results (default: 10)
- `page` (optional): Page number (default: 1)

**Example:**
```
GET /events?status=upcoming&limit=10&page=1
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_1",
      "name": "Himalayan Adventure 2026",
      "description": "7-day premium Himalayan adventure...",
      "shortDescription": "Epic 7-day journey through the Himalayas",
      "venue": "Himachal Pradesh",
      "date": "2026-09-15",
      "price": 12999,
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "videos": [],
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival & Acclimatization",
          "description": "Arrive in Manali..."
        }
      ],
      "status": "upcoming",
      "googleMapUrl": "https://maps.google.com/...",
      "registrationLink": "https://forms.gle/...",
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-02-20T14:45:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

---

### 2. Get Single Event
**GET** `/events/:id`

Retrieve details of a specific event.

**Example:**
```
GET /events/evt_1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "evt_1",
    "name": "Himalayan Adventure 2026",
    "description": "Full description...",
    "venue": "Himachal Pradesh",
    "date": "2026-09-15",
    "price": 12999,
    "images": [...],
    "itinerary": [...],
    "status": "upcoming",
    "registrationCount": 45,
    "availableSlots": 5
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Event not found"
}
```

---

### 3. Create Event (Admin)
**POST** `/events`

Create a new event.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Trek Event",
  "description": "Detailed description of the trek...",
  "shortDescription": "Brief description",
  "venue": "Location Name",
  "date": "2026-10-15",
  "price": 1999,
  "images": [
    "image_id_1",
    "image_id_2"
  ],
  "videos": [],
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "description": "Day 1 activities..."
    }
  ],
  "status": "upcoming",
  "googleMapUrl": "https://maps.google.com/...",
  "registrationLink": "https://forms.gle/...",
  "maxParticipants": 50
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "evt_new",
    "name": "New Trek Event",
    ...
  }
}
```

---

### 4. Update Event (Admin)
**PUT** `/events/:id`

Update an existing event.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Event Name",
  "price": 2499,
  "status": "completed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "id": "evt_1",
    "name": "Updated Event Name",
    ...
  }
}
```

---

### 5. Delete Event (Admin)
**DELETE** `/events/:id`

Delete an event.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

## Registrations Management

### 1. Get All Registrations (Admin)
**GET** `/registrations`

Retrieve all event registrations.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `eventId` (optional): Filter by event ID
- `paymentStatus` (optional): Filter by payment status (`paid`, `pending`, `failed`)
- `limit` (optional): Results per page
- `page` (optional): Page number

**Example:**
```
GET /registrations?eventId=evt_1&paymentStatus=paid&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "reg_1",
      "userId": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "eventId": "evt_1",
      "eventName": "Himalayan Adventure 2026",
      "paymentStatus": "paid",
      "paymentId": "pay_abc123",
      "amount": 12999,
      "registeredAt": "2026-03-01T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87
  }
}
```

---

### 2. Create Registration
**POST** `/registrations`

Register a user for an event.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+919876543210",
  "eventId": "evt_1",
  "emergencyContact": "+919876543211",
  "medicalConditions": "None",
  "dietaryRestrictions": "Vegetarian"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "reg_new",
    "registrationNumber": "MOR2026001",
    "paymentLink": "https://payment.gateway.com/...",
    "paymentStatus": "pending"
  }
}
```

---

### 3. Get Registration by ID
**GET** `/registrations/:id`

Get specific registration details.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "reg_1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "eventId": "evt_1",
    "eventName": "Himalayan Adventure 2026",
    "paymentStatus": "paid",
    "registeredAt": "2026-03-01T10:30:00Z"
  }
}
```

---

### 4. Update Payment Status (Admin)
**PATCH** `/registrations/:id/payment`

Update payment status of a registration.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paymentId": "pay_xyz789",
  "transactionDate": "2026-03-02T14:30:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment status updated successfully"
}
```

---

### 5. Delete Registration (Admin)
**DELETE** `/registrations/:id`

Cancel/delete a registration.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

---

### 6. Export Registrations (Admin)
**GET** `/registrations/export`

Export registrations to CSV/Excel.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `eventId` (optional): Filter by event
- `format` (optional): `csv` or `excel` (default: csv)

**Response:**
Returns a downloadable file with registrations data.

---

## Reviews Management

### 1. Get All Reviews
**GET** `/reviews`

Retrieve all reviews (public endpoint).

**Query Parameters:**
- `eventId` (optional): Filter by event ID
- `limit` (optional): Results per page
- `page` (optional): Page number

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rev_1",
      "userId": "user_123",
      "userName": "Priya Sharma",
      "eventId": "evt_1",
      "eventName": "Ralamandal Trek",
      "rating": 5,
      "text": "Amazing experience! Highly recommended.",
      "image": "https://example.com/review-image.jpg",
      "verified": true,
      "createdAt": "2026-02-10T16:20:00Z"
    }
  ],
  "averageRating": 4.8,
  "totalReviews": 127
}
```

---

### 2. Create Review
**POST** `/reviews`

Submit a new review.

**Request Body:**
```json
{
  "eventId": "evt_1",
  "registrationId": "reg_1",
  "name": "Amit Kumar",
  "email": "amit@example.com",
  "rating": 5,
  "text": "Incredible adventure! Worth every penny.",
  "image": "image_id_optional"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "rev_new",
    "status": "pending_approval"
  }
}
```

---

### 3. Update Review Status (Admin)
**PATCH** `/reviews/:id/status`

Approve or reject a review.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review status updated"
}
```

---

### 4. Delete Review (Admin)
**DELETE** `/reviews/:id`

Delete a review.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## Analytics

### 1. Get Dashboard Stats (Admin)
**GET** `/analytics/dashboard`

Get overview statistics for admin dashboard.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRegistrations": 287,
    "upcomingEvents": 4,
    "completedEvents": 15,
    "totalRevenue": 3456789,
    "pendingPayments": 12,
    "averageRating": 4.8,
    "totalReviews": 127,
    "monthlyGrowth": 15.5
  }
}
```

---

### 2. Get Monthly Registrations (Admin)
**GET** `/analytics/registrations/monthly`

Get month-wise registration data for charts.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `year` (optional): Filter by year (default: current year)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "month": "January",
      "monthNumber": 1,
      "registrations": 45,
      "revenue": 234567
    },
    {
      "month": "February",
      "monthNumber": 2,
      "registrations": 52,
      "revenue": 289450
    }
  ]
}
```

---

### 3. Get Event Participation Stats (Admin)
**GET** `/analytics/events/participation`

Get participation statistics for each event.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "eventId": "evt_1",
      "eventName": "Ralamandal Trek",
      "totalRegistrations": 56,
      "paidRegistrations": 52,
      "revenue": 31148,
      "averageRating": 4.9
    }
  ]
}
```

---

## File Upload

### 1. Upload Image
**POST** `/upload/image`

Upload event or review images.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `file`: Image file (JPG, PNG, max 5MB)
- `type`: `event` or `review`

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageId": "img_abc123",
    "url": "https://cdn.morevents.com/images/img_abc123.jpg",
    "thumbnailUrl": "https://cdn.morevents.com/images/thumb_img_abc123.jpg"
  }
}
```

---

### 2. Upload Video
**POST** `/upload/video`

Upload event videos.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `file`: Video file (MP4, max 50MB)
- `eventId`: Associated event ID

**Response (200):**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "videoId": "vid_xyz789",
    "url": "https://cdn.morevents.com/videos/vid_xyz789.mp4",
    "thumbnailUrl": "https://cdn.morevents.com/videos/thumb_vid_xyz789.jpg"
  }
}
```

---

### 3. Delete File (Admin)
**DELETE** `/upload/:fileId`

Delete an uploaded file.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Google Sheets Integration

### 1. Connect Google Sheets (Admin)
**POST** `/integrations/google-sheets/connect`

Connect Google Sheets for automatic registration sync.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheetName": "Registrations",
  "refreshToken": "google_oauth_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google Sheets connected successfully",
  "data": {
    "connectionId": "conn_123",
    "status": "active"
  }
}
```

---

### 2. Sync Registrations from Google Sheets (Admin)
**POST** `/integrations/google-sheets/sync`

Manually trigger sync from Google Sheets.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "data": {
    "newRegistrations": 5,
    "updatedRegistrations": 2,
    "lastSyncAt": "2026-03-02T10:30:00Z"
  }
}
```

---

### 3. Get Sync Status (Admin)
**GET** `/integrations/google-sheets/status`

Check current sync status.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "lastSyncAt": "2026-03-02T10:30:00Z",
    "nextScheduledSync": "2026-03-02T11:30:00Z",
    "totalSynced": 287,
    "errors": []
  }
}
```

---

## Contact Form

### 1. Submit Contact Form
**POST** `/contact`

Submit contact form from website.

**Request Body:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "+919876543210",
  "message": "I want to know more about upcoming treks."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully. We'll get back to you soon!"
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized. Please login."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
```

---

## Rate Limiting

All API endpoints are rate-limited:
- Public endpoints: 100 requests per 15 minutes per IP
- Authenticated endpoints: 1000 requests per 15 minutes per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Webhooks (Optional)

### Payment Webhook
**POST** `/webhooks/payment`

Webhook endpoint for payment gateway notifications.

**Request Body:**
```json
{
  "eventType": "payment.success",
  "registrationId": "reg_123",
  "paymentId": "pay_abc123",
  "amount": 12999,
  "timestamp": "2026-03-02T10:30:00Z"
}
```

---

## Database Schema Recommendations

### Events Table
```sql
CREATE TABLE events (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  venue VARCHAR(255),
  date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  images JSON,
  videos JSON,
  itinerary JSON,
  status ENUM('upcoming', 'completed') DEFAULT 'upcoming',
  google_map_url TEXT,
  registration_link TEXT,
  max_participants INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Registrations Table
```sql
CREATE TABLE registrations (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  event_id VARCHAR(50) NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  payment_id VARCHAR(100),
  amount DECIMAL(10, 2),
  emergency_contact VARCHAR(20),
  medical_conditions TEXT,
  dietary_restrictions VARCHAR(255),
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

### Reviews Table
```sql
CREATE TABLE reviews (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  user_name VARCHAR(255) NOT NULL,
  event_id VARCHAR(50) NOT NULL,
  registration_id VARCHAR(50),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  image VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
```

### Admin Users Table
```sql
CREATE TABLE admin_users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role ENUM('admin', 'super_admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

---

## Environment Variables

Required environment variables for backend:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mor_events
DB_USER=root
DB_PASSWORD=your_password

# JWT Authentication
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
ALLOWED_VIDEO_TYPES=mp4,mov,avi

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=moreventsofficial@gmail.com
SMTP_PASSWORD=your_email_password

# Google Sheets Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback

# Payment Gateway (Razorpay/Paytm)
PAYMENT_KEY_ID=your_payment_key
PAYMENT_KEY_SECRET=your_payment_secret
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Security Recommendations

1. **Authentication**: Use JWT tokens with secure secret keys
2. **Password Hashing**: Use bcrypt with minimum 10 salt rounds
3. **CORS**: Configure CORS to allow only your frontend domain
4. **Input Validation**: Validate all inputs using express-validator or Joi
5. **SQL Injection**: Use parameterized queries or ORM (Sequelize/Prisma)
6. **File Upload**: Validate file types, sizes, and sanitize filenames
7. **Rate Limiting**: Implement rate limiting using express-rate-limit
8. **HTTPS**: Always use HTTPS in production
9. **Environment Variables**: Never commit .env files to version control

---

## Testing Endpoints

Use the following tools for testing:
- **Postman**: Import collection for all endpoints
- **Thunder Client**: VS Code extension for API testing
- **curl**: Command-line testing

Example curl command:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@morevents.com","password":"password123"}'
```

---

## Support

For API support and questions:
- Email: moreventsofficial@gmail.com
- Phone: +91 7024896018
- Documentation: https://api.morevents.com/docs

---

**Last Updated:** March 2, 2026  
**Version:** 1.0.0  
**Maintained by:** Mor Events Development Team
