import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { VideoIntro } from "../components/home/VideoIntro";
import { HeroSection } from "../components/home/HeroSection";
import { AboutSection } from "../components/home/AboutSection";
import { EventsSection } from "../components/home/EventsSection";
import { GallerySection } from "../components/home/GallerySection";
import { ReviewsSection } from "../components/home/ReviewsSection";
import { RegistrationSection } from "../components/home/RegistrationSection";
import { MembershipSection } from "../components/home/MembershipSection";
import { WhyChooseSection } from "../components/home/WhyChooseSection";

import { NewEventNotification } from "../components/home/NewEventNotification";
import { StayUpdatedSection } from "../components/home/StayUpdatedSection";
import { ContactSection } from "../components/home/ContactSection";
import { Footer } from "../components/home/Footer";

export function HomePage() {
  const [showIntro, setShowIntro] = useState(true);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the intro in the current session
    const hasSeenIntro = sessionStorage.getItem("mor_events_intro_seen");
    if (hasSeenIntro === "true") {
      setShowIntro(false);
      setIntroFinished(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    // Add a tiny delay to start content animations for pure cinematic feel
    setTimeout(() => {
      setIntroFinished(true);
    }, 200);
    sessionStorage.setItem("mor_events_intro_seen", "true");
  };

  return (
    <div className="relative">
      {showIntro && <VideoIntro onComplete={handleIntroComplete} />}
      
      <motion.div
        initial={showIntro ? { opacity: 0 } : { opacity: 1 }}
        animate={introFinished ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <NewEventNotification />
        <HeroSection triggerAnimations={introFinished} />
        <StayUpdatedSection />
        <EventsSection />
        <WhyChooseSection />
        <GallerySection />
        <ReviewsSection />
        <AboutSection />
        <ContactSection />

        <Footer />
      </motion.div>
    </div>
  );
}

