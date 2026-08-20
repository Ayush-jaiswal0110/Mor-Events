import { motion } from "motion/react";
import { Link } from "react-router";
import { Compass, Sparkles, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsSubscribed(true);
    toast.success("Thank you! We'll notify you as soon as Plan Trip launches.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0F3057] to-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl text-center z-10 space-y-8">
        {/* Animated Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: "8s" }} />
          Coming Soon • AI Trip Planner
        </motion.div>

        {/* Hero Icon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-24 h-24 bg-gradient-to-tr from-[#008080] to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-teal-500/20 border border-white/20"
        >
          <Compass className="w-12 h-12 text-white animate-pulse" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-3"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Plan My Trip is <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              Coming Soon!
            </span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-lg mx-auto font-light leading-relaxed">
            We are building an intelligent, AI-powered custom trip planner tailored for Mor Events adventurers. Get customized day-wise itineraries, rest stops, and hidden gem recommendations.
          </p>
        </motion.div>

        {/* Subscription / Notify me box */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl max-w-md mx-auto shadow-xl"
        >
          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 text-teal-300 font-semibold py-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <span>You're on the early access VIP list!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-3">
              <p className="text-xs text-gray-300 font-medium uppercase tracking-wider">
                Get notified when it launches
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-sm focus-visible:ring-teal-400"
                />
                <Button type="submit" className="bg-[#008080] hover:bg-teal-600 text-white px-5 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home & Events
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
