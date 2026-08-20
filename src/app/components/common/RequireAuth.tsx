import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

/**
 * Route guard for consumer-facing pages (Trip Planner, My Trips, trip
 * detail). Redirects an unauthenticated visitor to /login and, once they
 * sign in, LoginPage sends them back to the page they originally wanted
 * (Phase 3: "redirect to login, then return to the Trip Planner").
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
