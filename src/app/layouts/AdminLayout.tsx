import { Outlet, Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  LayoutDashboard,
  Calendar,
  Users,
  Star,
  LogOut,
} from "lucide-react";
import logoImg from "../../assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";
import { useEffect, useState } from "react";

export function AdminLayout() {
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const handleLogout = () => {
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0F3057] dark:bg-gray-950 text-white p-6 z-40 flex flex-col">
        <div className="flex items-center space-x-3 mb-8">
          <img src={logoImg} alt="Mor Events" className="h-10 w-10" />
          <div>
            <h1 className="font-bold">Mor Events</h1>
            <p className="text-xs text-gray-300">Admin Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <Link
            to="/admin/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin/dashboard/events"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>Manage Events</span>
          </Link>
          <Link
            to="/admin/dashboard/registrations"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Registrations</span>
          </Link>
          <Link
            to="/admin/dashboard/reviews"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Star className="h-5 w-5" />
            <span>Reviews</span>
          </Link>
        </nav>

        <div className="space-y-2 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <Sun className="h-5 w-5 mr-3 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 mr-3" />
            )}
            {isDark ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
}
