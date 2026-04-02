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
