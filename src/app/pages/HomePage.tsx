import { HeroSection } from "../components/home/HeroSection";
import { AboutSection } from "../components/home/AboutSection";
import { EventsSection } from "../components/home/EventsSection";
import { GallerySection } from "../components/home/GallerySection";
import { ReviewsSection } from "../components/home/ReviewsSection";
import { RegistrationSection } from "../components/home/RegistrationSection";
import { WhyChooseSection } from "../components/home/WhyChooseSection";
import { ContactSection } from "../components/home/ContactSection";
import { Footer } from "../components/home/Footer";

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <AboutSection />
      <EventsSection />
      <WhyChooseSection />
      <GallerySection />
      <ReviewsSection />
      <RegistrationSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
