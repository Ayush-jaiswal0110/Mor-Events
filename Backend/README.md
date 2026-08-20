# Mor Events - Backend API

Django REST Framework + MongoDB backend for the Mor Events platform.

---

## Quick Start

### Prerequisites
- Python 3.11+
- pip
- MongoDB Atlas account

### Setup

`ash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # Edit with your credentials
python manage.py migrate
python manage.py runserver   # http://localhost:8000/api
`

### Run Tests

`ash
python manage.py test api
`

---

## Environment Variables

Copy .env.example to .env and fill in:

| Variable | Required | Description |
|---|---|---|
| MONGO_URI | Yes | MongoDB Atlas connection string |
| MONGO_DB_NAME | Yes | Database name (default: mor_events) |
| JWT_SECRET | Yes | Admin JWT signing secret |
| CLOUDINARY_URL | Yes | Cloudinary upload URL |
| GOOGLE_CLIENT_ID | Yes | Google OAuth client ID |
| RAZORPAY_KEY_ID | Yes | Razorpay public key |
| RAZORPAY_KEY_SECRET | Yes | Razorpay secret key |
| RESEND_API_KEY | Yes | Resend email API key |
| RESEND_FROM_EMAIL | Yes | From email address |
| FRONTEND_URL | Yes | CORS allowed origin |
| OPENAI_API_KEY | Optional | Trip Planner AI |
| GEMINI_API_KEY | Optional | Trip Planner AI (Gemini) |

---

## Architecture

**Database**: MongoDB Atlas via PyMongo directly. Django sqlite3 is a dummy kept only for Django internals.

**Auth**:
- Admin: JWT (morevents_token) via POST /api/auth/login
- Traveler: Google ID Token (morevents_user_token) via POST /api/google-auth/verify

**Emails**: All sent via background threading.Thread. Provider: Resend API.

**Media**: Cloudinary for all images and videos.

---

## MongoDB Collections

| Collection | Purpose |
|---|---|
| events | Trek/event listings |
| registrations | User event bookings |
| users | Traveler accounts (Google Sign-In) |
| reviews | Event reviews |
| admin_users | Admin accounts |
| trips | AI trip itineraries |

---

## API Endpoints

**Auth**
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/verify
- POST /api/google-auth/verify (Google Sign-In)
- GET /api/google-auth/me
- PATCH /api/google-auth/me

**Events**
- GET /api/events (public)
- POST /api/events (admin)
- GET /api/events/:id (public)
- PUT /api/events/:id (admin)
- DELETE /api/events/:id (admin)

**Registrations**
- GET /api/registrations (admin)
- POST /api/registrations (traveler)
- GET /api/registrations/:id (admin)
- DELETE /api/registrations/:id (admin)
- PATCH /api/registrations/:id/payment (admin)
- GET /api/registrations/export - CSV (admin)
- POST /api/registrations/invite-whatsapp (admin)
- GET /api/my/registrations - My bookings with eventDate and location (traveler)

**Reviews**
- GET /api/reviews (public)
- POST /api/reviews (public)
- PATCH /api/reviews/:id (admin)
- DELETE /api/reviews/:id (admin)

**Payments**
- POST /api/razorpay/create-order
- POST /api/razorpay/verify-payment

**Analytics**
- GET /api/analytics/overview (admin)
- GET /api/analytics/registrations-chart (admin)

**Other**
- POST /api/upload - Cloudinary upload (admin)
- POST /api/contact - Contact form (public)

---

## Docker

Build and run:

`ash
docker build -t mor-events-backend:latest .
docker run -p 8000:8000 --env-file .env mor-events-backend:latest
`

---

## Azure Deployment (ACR + Container App)

`ash
az login
az acr login --name moreventsacr

docker build -t moreventsacr.azurecr.io/mor-events-backend:latest .
docker push moreventsacr.azurecr.io/mor-events-backend:latest

az containerapp update \
  --name mor-events-backend \
  --resource-group mor-events-rg \
  --image moreventsacr.azurecr.io/mor-events-backend:latest
`

Set all .env variables as Container App secrets in Azure Portal.

See IMPLEMENTATION.md in project root for full CI/CD guide.

---

## Email Triggers

| Function | Trigger | Recipients |
|---|---|---|
| send_confirmation_email | Registration created | Participant |
| send_payment_failed_email | Payment failed | Participant |
| broadcast_event_notification | Event created/updated | All users |
| send_whatsapp_invite_email | Admin WA invite | Event attendees |
| send_contact_email | Contact form | Admin |

---

## Contact

- Email: moreventsofficial@gmail.com
- Phone: +91 7024896018
- Founder: Ayush Jaiswal, IIPS DAVV Indore

Copyright 2026 Mor Events. All rights reserved.
