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
import { ManageWhatsApp } from "./pages/admin/ManageWhatsApp";
import { LoginPage } from "./pages/LoginPage";
import { TripPlannerPage } from "./pages/TripPlannerPage";
import { MyTripsPage } from "./pages/MyTripsPage";
import { TripDetailPage } from "./pages/TripDetailPage";
import { SharedTripPage } from "./pages/SharedTripPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RequireAuth } from "./components/common/RequireAuth";


import { ComingSoonPage } from "./pages/ComingSoonPage";
import { EventRegistrationPage } from "./pages/EventRegistrationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "event/:id", element: <EventDetailPage /> },
      { path: "event/:id/register", element: <EventRegistrationPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "shared-trip/:token", element: <SharedTripPage /> },
      { path: "plan-trip", element: <ComingSoonPage /> },
      { path: "my-trips", element: <ComingSoonPage /> },
      { path: "trip/:id", element: <ComingSoonPage /> },
      {
        path: "dashboard",
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "profile",
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
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
          { path: "whatsapp", element: <ManageWhatsApp /> },
        ],

      },
    ],
  },
]);
