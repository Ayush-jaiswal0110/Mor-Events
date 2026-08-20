import { Button } from "../ui/button";
import { motion } from "motion/react";

interface HeroSectionProps {
  triggerAnimations?: boolean;
}

export function HeroSection({ triggerAnimations = true }: HeroSectionProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHRyZWtraW5nJTIwYWR2ZW50dXJlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc3MjQzMzg0Nnww&ixlib=rb-4.1.0&q=80&w=1080')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F3057]/90 to-[#4B0082]/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={triggerAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          Welcome to Mor Events
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={triggerAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-3xl text-white/90 mb-4"
        >
          India's Premium Travel & Trekking Event Organizer
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={triggerAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-white/80 mb-10"
        >
          Travel. Explore. Experience.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={triggerAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="bg-white text-[#0F3057] hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-lg"
            onClick={() => scrollToSection("events")}
          >
            View Upcoming Events
          </Button>
          <Button
            size="lg"
            className="bg-[#008080] hover:bg-[#006666] text-white font-bold text-lg px-8 py-6 shadow-lg border-2 border-teal-300/30"
            onClick={() => scrollToSection("stay-updated")}
          >
            Register / Join Community
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={triggerAnimations ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}

