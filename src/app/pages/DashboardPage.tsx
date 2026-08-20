import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Ticket, MapPinned, UserCircle, Calendar, Award, Sparkles, QrCode, Coins, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { getMyBookings, MyBooking } from "../../api/registrationsApi";
import { ETicketModal } from "../components/events/ETicketModal";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<MyBooking | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch((err) => toast.error(err.message || "Couldn't load your bookings."))
      .finally(() => setIsLoading(false));
  }, []);

  const openTicket = (booking: MyBooking) => {
    setSelectedBooking(booking);
    setTicketModalOpen(true);
  };

  // Calculate Loyalty Points (100 pts per booking)
  const loyaltyPoints = (bookings.length + 1) * 100;

  // Calculate Badges based on participation
  const badges = [
    {
      id: "mandu",
      title: "Mandu Heritage Explorer 🏰",
      desc: "Mandu & Historic Fortress Treks",
      earned: true, // Default earned for active members / Mandu attendees!
    },
    {
      id: "summit",
      title: "Summit Conqueror 🏔️",
      desc: "Conquered Ralamandal & Hill Peaks",
      earned: bookings.length > 0,
    },
    {
      id: "pioneer",
      title: "Pioneer Explorer 🌟",
      desc: "Official Mor Events Explorer",
      earned: true,
    },
    {
      id: "monsoon",
      title: "Monsoon Adventurer 🌧️",
      desc: "Completed Waterfall & Rain Treks",
      earned: bookings.length > 1,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F3057] dark:text-white">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-500 mt-1">Here's your Mor Events explorer dashboard.</p>
        </div>

        {/* Loyalty Points Counter */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-sm shrink-0">
          <Coins className="w-5 h-5 text-amber-200" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-90">Loyalty Rewards</span>
            <span className="font-extrabold text-base">{loyaltyPoints} Points</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <Link to="/my-trips">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="pt-6 flex items-center gap-3">
              <MapPinned className="h-8 w-8 text-[#008080]" />
              <div>
                <p className="font-semibold text-[#0F3057] dark:text-white">Plan My Trip</p>
                <p className="text-sm text-gray-500">View or create AI itineraries</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/profile">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="pt-6 flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-[#0F3057] dark:text-teal-400" />
              <div>
                <p className="font-semibold text-[#0F3057] dark:text-white">Profile Settings</p>
                <p className="text-sm text-gray-500">Update your name and phone number</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 🏆 Mor Explorer Badges Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#0F3057] dark:text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" /> My Explorer Badges & Achievements
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all ${
                b.earned
                  ? "bg-gradient-to-b from-teal-50 to-white dark:from-teal-950/40 dark:to-gray-900 border-teal-300 dark:border-teal-700 shadow-sm"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{b.title.split(" ").slice(-1)[0]}</span>
                {b.earned ? (
                  <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-gray-400">Locked</span>
                )}
              </div>
              <h3 className="font-bold text-sm text-[#0F3057] dark:text-white leading-tight mb-1">
                {b.title.split(" ").slice(0, -1).join(" ")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🎟️ My Tickets Section */}
      <h2 className="text-xl font-bold text-[#0F3057] dark:text-white mb-4 flex items-center gap-2">
        <Ticket className="h-5 w-5 text-[#008080]" /> My Event Tickets & Pass
      </h2>

      {isLoading ? (
        <p className="text-gray-500 text-center py-12">Loading your bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border p-8">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">You haven't booked any events yet.</p>
          <p className="text-sm text-gray-500 mb-4">Register for upcoming treks to unlock E-Tickets & Explorer Badges!</p>
          <Link to="/#events">
            <Button className="bg-[#0F3057] hover:bg-[#008080] text-white">
              Browse Upcoming Events
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-[#0F3057] dark:text-white">{booking.eventName}</p>
                  <Badge className={PAYMENT_STATUS_COLORS[booking.paymentStatus] || ""} variant="outline">
                    {booking.paymentStatus}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                  <Calendar className="h-3.5 w-3.5" /> Booked {new Date(booking.registeredAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400 font-mono mb-3">Ticket ID: {booking.registrationNumber}</p>

                <Button
                  onClick={() => openTicket(booking)}
                  className="w-full bg-[#0F3057] hover:bg-[#008080] text-white text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" /> View E-Ticket & Entry QR
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* E-Ticket QR Modal */}
      <ETicketModal
        booking={selectedBooking}
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
      />
    </div>
  );
}
