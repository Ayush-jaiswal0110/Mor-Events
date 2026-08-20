# Mor Events — Frontend

India's Premium Travel and Adventure Event Platform.

Built with **React 18**, **TypeScript**, **Tailwind CSS**, **Vite**, and **React Router 7**.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

`ash
npm install
`

### Development

`ash
npm run dev
# Opens at http://localhost:5173
`

### Production Build

`ash
npm run build
# Output: dist/
`

---

## Environment Variables

Copy .env.example to .env and fill in your values:

`env
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
`

---

## Tech Stack

| Tech | Version |
|---|---|
| React | 18.3.1 |
| TypeScript | latest |
| Tailwind CSS | 4.1.12 |
| React Router | 7.13.0 |
| Motion (Framer) | 12.23.24 |
| Radix UI | various |
| Lucide React | 0.487.0 |
| Recharts | 2.15.2 |
| React Hook Form | 7.55.0 |
| next-themes | 0.4.6 |
| Embla Carousel | 8.6.0 |
| Sonner | 2.0.3 |
| Vite | 6.4.1 |

---

## Project Structure

`
src/
├── app/
│   ├── components/
│   │   ├── home/         # HomePage sections (Hero, Events, Gallery, etc.)
│   │   ├── events/       # ETicketModal, WeatherWidget
│   │   └── ui/           # Radix UI wrappers (shadcn style)
│   ├── context/
│   │   ├── AuthContext.tsx       # Google Sign-In traveler auth
│   │   └── EventsContext.tsx     # Global events state
│   ├── layouts/
│   │   ├── MainLayout.tsx        # Public layout + floating WhatsApp button
│   │   └── AdminLayout.tsx       # Admin sidebar layout
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── EventRegistrationPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ComingSoonPage.tsx
│   │   └── admin/
│   │       ├── AdminLogin.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ManageEvents.tsx
│   │       └── Registrations.tsx
│   ├── App.tsx
│   └── routes.tsx
├── api/
│   ├── client.ts             # Admin API (JWT)
│   ├── userClient.ts         # Traveler API (Google token)
│   └── registrationsApi.ts  # My bookings helpers
└── assets/
`

---

## Routes

| Path | Page | Auth |
|---|---|---|
| / | HomePage | Public |
| /event/:id | EventDetailPage | Public |
| /event/:id/register | EventRegistrationPage | Google Sign-In |
| /login | LoginPage | Public |
| /dashboard | DashboardPage | Google Sign-In |
| /profile | ProfilePage | Google Sign-In |
| /my-trips | ComingSoonPage | Google Sign-In |
| /admin | AdminLogin | Public |
| /admin/dashboard | AdminDashboard | Admin JWT |
| /admin/dashboard/events | ManageEvents | Admin JWT |
| /admin/dashboard/registrations | Registrations | Admin JWT |

---

## Key Features

### For Travelers
- Browse upcoming treks and adventure events
- Google Sign-In for secure, frictionless registration
- 3-step event registration (Details -> Terms -> Payment)
- Razorpay payment or UPI QR fallback
- Digital E-Ticket with unique QR Code (Dashboard)
- Explorer Badges (Mandu Heritage Explorer, Summit Conqueror, etc.)
- Loyalty Points counter
- Live weather and trail safety widget on event pages

### For Admins
- Full event management (create, edit, delete, media upload)
- Registration table with search, filter, CSV export
- Mark payments as paid/failed
- WhatsApp group invite to all attendees
- Automatic email broadcast to all users on event create/update

---

## Brand Colors

`
Navy:   #0F3057   (Peacock Blue - primary)
Teal:   #008080   (accent / CTA)
Purple: #4B0082   (gradient accent)
`

---

## Deployment (Azure Static Web App)

`ash
npm run build
az staticwebapp deploy \
  --name mor-events-frontend \
  --resource-group mor-events-rg \
  --source ./dist
`

For full deployment guide including Docker and CI/CD, see [IMPLEMENTATION.md](./IMPLEMENTATION.md).

---

## Documentation

| File | Description |
|---|---|
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Complete technical implementation guide |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API endpoints reference |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Local setup instructions |
| [TRIP_PLANNER_IMPLEMENTATION.md](./TRIP_PLANNER_IMPLEMENTATION.md) | AI Trip Planner details |
| [ACCOUNT_DASHBOARD_PROFILE.md](./ACCOUNT_DASHBOARD_PROFILE.md) | User account system |

---

## Contact

- Email: moreventsofficial@gmail.com
- Phone: +91 7024896018
- WhatsApp Community: https://chat.whatsapp.com/KnDHLWgMgF7DChf6RV7fR3

Copyright 2026 Mor Events. All rights reserved.
