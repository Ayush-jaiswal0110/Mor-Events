# Layouts

## MainLayout
- Path: `src/app/layouts/MainLayout.tsx`
- Description: Main public-facing layout with sticky top navigation, smooth scroll nav, light/dark theme toggle, mobile hamburger menu, and floating WhatsApp button. Renders `<Outlet />` for child routes.

```tsx
import { Outlet, Link } from "react-router";
import { Button } from "../components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import logoImg from "../../assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";

export function MainLayout() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      window.location.href = "/#" + sectionId;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation - fixed top, glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img src={logoImg} alt="Mor Events" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0F3057] dark:text-white">Mor Events</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Travel. Explore. Experience.</p>
              </div>
            </Link>

            {/* Desktop Navigation - nav items: Home, About, Events, Gallery, Reviews, Contact, Terms */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Section scroll buttons + Terms link + Theme toggle + Admin link */}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Theme toggle + hamburger */}
            </div>
          </div>
          {/* Mobile menu dropdown */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/917024896018" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110">
        {/* WhatsApp SVG icon */}
      </a>
    </div>
  );
}
```

## AdminLayout
- Path: `src/app/layouts/AdminLayout.tsx`
- Description: Dark-themed admin dashboard layout with sidebar navigation, top header bar, and protected route with auth check. Contains links to Dashboard, Events, Registrations, and Reviews management.

```tsx
// Admin layout with sidebar and auth-protected <Outlet />
// Dark mode professional dashboard look
// Sidebar links: Dashboard, Manage Events, Registrations, Reviews
// Top bar: Admin title, Logout button
```
