# Mor Events - Complete Implementation Guide

> Last updated: August 2026  
> Version: 2.0 (Production)

## 1. Project Overview

Mor Events is a full-stack event management and travel platform.

### Core Features
- Event Listing and Detail Pages
- Google Sign-In (Traveler Auth)
- Admin Login (JWT)
- 3-Step Event Registration
- Razorpay / UPI QR Payment
- Digital E-Ticket with QR Code
- Explorer Badges and Loyalty Points
- Live Weather Widget on Event Pages
- Email Confirmation on Registration
- Admin Email Broadcast
- WhatsApp Community Integration

## 2. System Architecture

Frontend: React 18 SPA (Azure Static Web App)
Backend: Django + DRF + Gunicorn (Azure Container App via ACR)
Database: MongoDB Atlas
Media: Cloudinary
Payments: Razorpay
Auth: Google OAuth 2.0 + PyJWT

## 3. Tech Stack

Frontend: React 18.3.1, TypeScript, Tailwind CSS 4.1.12, React Router 7.13.0, Motion 12.23.24, Radix UI, Lucide React, Recharts, Embla Carousel, Sonner, Vite 6.4.1
Backend: Django 5.2.12, Django REST Framework 3.17.0, PyMongo 4.16.0, Gunicorn, Cloudinary, PyJWT, Razorpay, Resend

## 4. Routes

/ - HomePage
/event/:id - EventDetailPage
/event/:id/register - EventRegistrationPage (Google Sign-In required)
/login - LoginPage
/dashboard - DashboardPage (Google Sign-In required)
/profile - ProfilePage (Google Sign-In required)
/my-trips - ComingSoonPage
/admin - AdminLogin
/admin/dashboard - AdminDashboard (Admin JWT required)
/admin/dashboard/events - ManageEvents (Admin JWT required)
/admin/dashboard/registrations - Registrations (Admin JWT required)

## 5. Home Page Section Order

1. HeroSection
2. StayUpdatedSection (email sign-up + WhatsApp community CTA)
3. EventsSection (upcoming first, NEW badge)
4. WhyChooseSection
5. GallerySection
6. ReviewsSection
7. AboutSection
8. ContactSection
9. Footer

## 6. Database Schema (MongoDB)

### events collection
_id: evt_<8hex>
name, description, date, location, price, maxParticipants
status: upcoming | completed
images: [cloudinary_url]
video: cloudinary_url
itinerary: [{day, title, description}]
inclusions, exclusions, difficulty, createdAt

### registrations collection
_id: reg_<8hex>
registrationNumber: MOR2026001 (sequential)
userId, name, email, phone, age, gender, city
eventId, eventName
paymentStatus: pending | paid | failed
paymentId, paymentMethod, paymentScreenshot, amount
emergencyContact, medicalConditions, registeredAt

### users collection
_id: user_<8hex>
googleId, name, email, picture, phone, createdAt

### reviews collection
_id: rev_<8hex>
name, rating, comment, eventId, approved, createdAt

### admin_users collection
_id: admin_<8hex>
username, password (bcrypt), role

## 7. Authentication

Admin: POST /api/auth/login -> morevents_token (JWT 7-day)
       All admin endpoints use @login_required checking Authorization header
       Stored in localStorage as morevents_token

Traveler: Google Identity Services frontend
          POST /api/google-auth/verify { credential: <google_id_token> }
          Backend verifies via google.oauth2.id_token.verify_oauth2_token
          Returns morevents_user_token (JWT)
          Stored in localStorage as morevents_user_token

## 8. Email System (email_utils.py)

send_confirmation_email() - Registration confirmed -> Participant
send_payment_failed_email() - Payment failed -> Participant  
broadcast_event_notification() - New/updated event -> All users
send_whatsapp_invite_email() - WA group invite -> Event attendees
send_contact_email() - Contact form -> Admin

All sent via threading.Thread to avoid blocking API responses.
Provider: Resend API (SMTP fallback available).

## 9. Payment Flow (Razorpay)

POST /api/razorpay/create-order -> Razorpay order_id
Razorpay checkout opens in browser
POST /api/razorpay/verify-payment -> signature verified
Registration paymentStatus set to paid
Confirmation email sent async

UPI QR Fallback: Static QR shown, user uploads screenshot, admin marks paid.

## 10. QR Code E-Ticket System

1. User registers -> registrationNumber MOR2026001
2. Dashboard -> View E-Ticket & Entry QR -> ETicketModal
3. QR generated via api.qrserver.com with JSON:
   { ticketId, eventId, eventName, eventDate, name, status }
4. Ticket shows: Event Name, Date, Location, Participant Name, QR Code
5. User prints or downloads ticket

Admin check-in (current): Admin Panel -> Registrations -> search name/reg number
Admin check-in (planned v3): Mobile browser QR scanner -> PATCH /api/registrations/:id/checkin

## 11. Explorer Badges & Loyalty Rewards

Badges (computed on DashboardPage):
- Mandu Heritage Explorer: Default (all users)
- Summit Conqueror: 1+ booking
- Pioneer Explorer: Default (all users)  
- Monsoon Adventurer: 2+ bookings

Loyalty Points: (bookings + 1) * 100
Shown as gold chip on Dashboard header.
Roadmap: Persist to MongoDB users collection, redemption for discounts.

## 12. Weather Widget

WeatherWidget.tsx embedded on EventDetailPage.
Shows temperature, rain probability, terrain alerts, safety tips.
Currently seeded data per destination keyword.
Roadmap: Live OpenWeatherMap API using event location field.

## 13. Admin Dashboard Features

Overview: Stats (registrations, revenue, events, reviews), monthly chart, activity feed
Manage Events: Create/Edit/Delete, Cloudinary upload, status toggle
Registrations: Table, search, filter, mark paid/failed, CSV export, WhatsApp invite

## 14. Azure Deployment

### Resources
Resource Group: mor-events-rg
ACR: moreventsacr
Backend Container App: mor-events-backend  
Frontend: Azure Static Web App (mor-events-frontend)
Database: MongoDB Atlas (external)

### Backend - Build & Push to ACR
az login
az acr login --name moreventsacr
docker build -t moreventsacr.azurecr.io/mor-events-backend:latest ./Backend
docker push moreventsacr.azurecr.io/mor-events-backend:latest
az containerapp update --name mor-events-backend --resource-group mor-events-rg --image moreventsacr.azurecr.io/mor-events-backend:latest

### Frontend - Build & Deploy
npm run build
az staticwebapp deploy --name mor-events-frontend --resource-group mor-events-rg --source ./dist

### Container App Env Vars (set as secrets in Azure Portal)
MONGO_URI=mongodb+srv://...
MONGO_DB_NAME=mor_events
JWT_SECRET=<strong-secret>
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
GOOGLE_CLIENT_ID=<google-oauth-client-id>
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@morevents.in
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=<razorpay-secret>
FRONTEND_URL=https://mor-events-frontend.azurestaticapps.net

## 15. Frontend Env Vars (.env at project root)

VITE_API_URL=https://mor-events-backend.<region>.azurecontainerapps.io/api
VITE_GOOGLE_CLIENT_ID=<same as GOOGLE_CLIENT_ID in backend>

## 16. CI/CD (GitHub Actions) - .github/workflows/deploy.yml

Trigger: push to main branch

Backend job:
  az acr login
  docker build + push with github.sha tag
  az containerapp update with new image

Frontend job:
  npm ci
  npm run build (with VITE_API_URL and VITE_GOOGLE_CLIENT_ID secrets)
  Azure Static Web Apps deploy action

## 17. API Endpoints Reference

Auth:
  POST /api/auth/login - Admin login
  POST /api/auth/logout - Admin logout
  GET  /api/auth/verify - Verify token
  POST /api/google-auth/verify - Google Sign-In
  GET  /api/google-auth/me - Get user profile
  PATCH /api/google-auth/me - Update profile

Events:
  GET    /api/events - List all events
  POST   /api/events - Create event (admin)
  GET    /api/events/:id - Get single event
  PUT    /api/events/:id - Update event (admin)
  DELETE /api/events/:id - Delete event (admin)

Registrations:
  GET    /api/registrations - List all (admin)
  POST   /api/registrations - Create (traveler)
  GET    /api/registrations/:id - Get single (admin)
  DELETE /api/registrations/:id - Cancel (admin)
  PATCH  /api/registrations/:id/payment - Update payment (admin)
  GET    /api/registrations/export - CSV export (admin)
  POST   /api/registrations/invite-whatsapp - WA invite (admin)
  GET    /api/my/registrations - My bookings (traveler)

Reviews:
  GET    /api/reviews - List approved
  POST   /api/reviews - Submit review
  PATCH  /api/reviews/:id - Approve/reject (admin)
  DELETE /api/reviews/:id - Delete (admin)

Payments:
  POST /api/razorpay/create-order - Create Razorpay order
  POST /api/razorpay/verify-payment - Verify signature

Analytics:
  GET /api/analytics/overview - Dashboard stats (admin)
  GET /api/analytics/registrations-chart - Monthly chart (admin)

Media:
  POST /api/upload - Upload to Cloudinary (admin)

Contact:
  POST /api/contact - Contact form

## 18. Brand Colors

Navy:   #0F3057  (Peacock Blue - primary)
Teal:   #008080  (accent / CTA buttons)
Purple: #4B0082  (gradient accent)

## 19. Contact

Email: moreventsofficial@gmail.com
Phone: +91 7024896018
WhatsApp: https://chat.whatsapp.com/KnDHLWgMgF7DChf6RV7fR3
Founder: Ayush Jaiswal, IIPS DAVV Indore

Built with love by Mor Events Development Team - August 2026