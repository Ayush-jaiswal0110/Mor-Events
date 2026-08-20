import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { apiFetch } from "../../../api/client";
import { CheckCircle2, MessageSquare, ShieldCheck, Sparkles, Send, Loader2 } from "lucide-react";

export function MembershipSection() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Name and Phone number are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await apiFetch("/members/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="whatsapp-membership"
      className="py-24 bg-gradient-to-br from-[#020514] via-[#0F3057] to-[#120422] text-white relative overflow-hidden"
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Info & Copy */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-semibold tracking-wide">
                <Sparkles className="w-4 h-4" /> Lifetime Member Access
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Join the Mor Events <br />
                <span className="bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  WhatsApp Circle
                </span>
              </h2>
              <p className="text-lg text-gray-350 max-w-xl">
                Become a lifetime member for free. Get early access to itineraries, receive stunning trip photos, and book your next adventure directly from your WhatsApp chat.
              </p>
            </motion.div>

            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">100% Free Lifetime</h4>
                  <p className="text-gray-405 text-sm">No renewal fees. Enjoy member perks forever.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Interactive Booking</h4>
                  <p className="text-gray-405 text-sm">Explore past and upcoming tours dynamically on chat.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Instant Notifications</h4>
                  <p className="text-gray-405 text-sm">Receive instant updates, trip guides, and announcements.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Exclusive Invites</h4>
                  <p className="text-gray-405 text-sm">Be the first to secure seats on limited-capacity tours.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Glassmorphic Form Card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
              className="bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {!success ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Register for Free</h3>
                      <p className="text-sm text-gray-400">Join 1,000+ happy explorers today.</p>
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Your Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Email Address (Optional)</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">WhatsApp Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="E.g., +91 7024896018"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                          required
                        />
                        <span className="text-[11px] text-gray-500 mt-1 block">Include country code for seamless integration.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="optin"
                        className="mt-1 accent-teal-500 cursor-pointer rounded"
                        defaultChecked
                        required
                      />
                      <label htmlFor="optin" className="text-xs text-gray-400 cursor-pointer select-none leading-relaxed">
                        I agree to receive trip brochures, event announcements, and invitations on WhatsApp.
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-base transition-all flex items-center justify-center gap-2 border-0 shadow-lg shadow-teal-500/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Normalizing Data...
                        </>
                      ) : (
                        <>
                          Get WhatsApp Invites <Send className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-6"
                  >
                    <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto text-teal-400 animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">Awesome, {formData.name}!</h3>
                      <p className="text-teal-400 font-semibold text-sm">Lifetime Membership Confirmed</p>
                      <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">
                        We have stored your registration in our system. You will receive the welcome greeting on WhatsApp shortly. Please make sure to save our contact!
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setSuccess(false);
                        setFormData({ name: "", email: "", phone: "" });
                      }}
                      className="py-5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10"
                    >
                      Register Another Account
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
