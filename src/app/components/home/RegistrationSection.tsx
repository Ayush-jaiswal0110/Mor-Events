import { motion } from "motion/react";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";

export function RegistrationSection() {
  return (
    <section
      id="registration"
      className="py-20 bg-gradient-to-br from-[#0F3057] to-[#4B0082] text-white"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join Our Next Adventure
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Ready to embark on an unforgettable journey? Register now and secure
            your spot for the adventure of a lifetime.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-white mx-auto mb-12" />

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4">Quick Registration</h3>
            <p className="text-white/80 mb-6">
              Fill out our simple registration form to get started. Our team will
              contact you with all the details.
            </p>
            <a
              href="https://forms.gle/morevents"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-white text-[#0F3057] hover:bg-gray-100 text-lg px-8 py-6"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Register Now
              </Button>
            </a>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-white/80">Happy Travelers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-white/80">Events Organized</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-white/80">Satisfaction Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
