# Routes

Router: React Router v7 (`react-router` with `createBrowserRouter`)

## Full Router Config

```tsx
// src/app/routes.tsx
import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { TermsPage } from "./pages/TermsPage";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ManageEvents } from "./pages/admin/ManageEvents";
import { Registrations } from "./pages/admin/Registrations";
import { ManageReviews } from "./pages/admin/ManageReviews";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "event/:id", element: <EventDetailPage /> },
      { path: "terms", element: <TermsPage /> },
    ],
  },
  {
    path: "/admin",
    children: [
      { index: true, element: <AdminLogin /> },
      {
        path: "dashboard",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "events", element: <ManageEvents /> },
          { path: "registrations", element: <Registrations /> },
          { path: "reviews", element: <ManageReviews /> },
        ],
      },
    ],
  },
]);
```

## Route Map

| URL Path | Component | Layout | Description |
|---|---|---|---|
| `/` | `HomePage` | `MainLayout` | Landing page with all sections (Hero, About, Events, Gallery, Reviews, Registration, Contact, Footer) |
| `/event/:id` | `EventDetailPage` | `MainLayout` | Individual event details with gallery, itinerary, map |
| `/terms` | `TermsPage` | `MainLayout` | Terms of service, privacy policy, cancellation policy |
| `/admin` | `AdminLogin` | None | Admin login form |
| `/admin/dashboard` | `AdminDashboard` | `AdminLayout` | Dashboard overview with stats and charts |
| `/admin/dashboard/events` | `ManageEvents` | `AdminLayout` | CRUD for events |
| `/admin/dashboard/registrations` | `Registrations` | `AdminLayout` | View Google Sheets registrations |
| `/admin/dashboard/reviews` | `ManageReviews` | `AdminLayout` | Approve/reject user reviews |
