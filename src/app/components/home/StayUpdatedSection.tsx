import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Bell, Sparkles, CheckCircle2, UserPlus, ShieldCheck, Ticket } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router";

export function StayUpdatedSection() {
  const { isAuthenticated, user } = useAuth();

  return (
    <section
      id="stay-updated"
      className="py-20 bg-gradient-to-br from-[#0F3057] via-[#008080] to-[#4B0082] text-white relative overflow-hidden"
    >
      {/* Decorative ambient blurred circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
            Join Mor Events Community
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Never Miss an Upcoming Adventure! 🎒
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Register on Mor Events to stay automatically notified about every new trek, trip, and event update. Get access to your personalized profile and tickets anytime!
          </p>

          {/* Value Propositions Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-left mb-12">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-400/20 border border-teal-300/30 flex items-center justify-center text-teal-300 mb-4">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Instant Event Emails</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Be the first to know whenever an admin plans a new trip or updates an itinerary.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-400/20 border border-purple-300/30 flex items-center justify-center text-purple-300 mb-4">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">My Tickets & Profile</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Access all your event tickets, booking statuses, and traveler profile in one dashboard.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/15 transition-all sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Priority Registration</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Lock your seats early for high-demand adventure trips with seamless verified checkouts.
              </p>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-xl mx-auto shadow-2xl">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="w-14 h-14 bg-teal-500/30 rounded-full flex items-center justify-center mx-auto text-teal-300 border border-teal-300/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">You're Registered & Connected!</h3>
                <p className="text-white/80 text-sm">
                  Logged in as <span className="font-semibold text-teal-200">{user?.email}</span>. You will receive email notifications whenever a new trip is launched.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link to="/dashboard">
                    <Button className="w-full sm:w-auto bg-white text-[#0F3057] hover:bg-gray-100 font-bold px-6 py-5">
                      Go to Dashboard & Tickets
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-5">
                      My Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <h3 className="text-2xl font-bold">Register Today to Stay Updated</h3>
                <p className="text-white/80 text-sm">
                  Join hundreds of adventurers! Sign up in 5 seconds with Google to get event notifications and ticket management.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Link to="/login" className="flex-1">
                    <Button
                      size="lg"
                      className="w-full bg-white text-[#0F3057] hover:bg-teal-50 font-extrabold text-sm py-6 shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4 text-[#008080]" />
                      Sign Up with Google
                    </Button>
                  </Link>

                  <a
                    href="https://chat.whatsapp.com/KnDHLWgMgF7DChf6RV7fR3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      size="lg"
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-sm py-6 shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      💬 Join WhatsApp Group
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
