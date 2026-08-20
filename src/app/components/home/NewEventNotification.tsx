import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, BellRing } from "lucide-react";
import { Link } from "react-router";
import { useEvents } from "../../context/EventsContext";

export function NewEventNotification() {
  const { upcomingEvents } = useEvents();
  const [isVisible, setIsVisible] = useState(false);
  const [latestEvent, setLatestEvent] = useState<any>(null);

  useEffect(() => {
    if (upcomingEvents && upcomingEvents.length > 0) {
      // Find the most recent upcoming event
      const sorted = [...upcomingEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const featured = sorted[0];
      setLatestEvent(featured);

      // Check if user dismissed this specific notification
      const dismissedId = sessionStorage.getItem("dismissed_event_notif");
      if (dismissedId !== featured.id) {
        setIsVisible(true);
      }
    }
  }, [upcomingEvents]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (latestEvent) {
      sessionStorage.setItem("dismissed_event_notif", latestEvent.id);
    }
  };

  if (!latestEvent || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gradient-to-r from-[#0F3057] via-[#008080] to-[#4B0082] text-white py-2.5 px-4 shadow-md sticky top-16 z-40"
      >
        <div className="container mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="bg-amber-400 text-black px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px] shrink-0 animate-bounce">
              <BellRing className="w-3 h-3 fill-black" /> NEW EVENT
            </span>
            <p className="truncate font-medium">
              <span className="font-semibold text-amber-200">{latestEvent.name}</span>
              <span className="hidden md:inline"> — {latestEvent.shortDescription}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={`/event/${latestEvent.id}`}
              className="inline-flex items-center gap-1 bg-white text-[#0F3057] hover:bg-gray-100 px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-sm"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
