# Pages — Component Dependency Trees

## / (Home Page)
Entry: `src/app/pages/HomePage.tsx`
Dependencies:
- `src/app/components/home/HeroSection.tsx`
  - `src/app/components/ui/button.tsx`
  - `motion/react`
- `src/app/components/home/AboutSection.tsx`
  - `src/assets/eed6de649ee2eaf43e252e2b9f2c3a7137b4cbb7.png` (founder image)
  - `motion/react`
- `src/app/components/home/EventsSection.tsx`
  - `src/app/components/ui/card.tsx`
  - `src/app/components/ui/button.tsx`
  - `src/app/components/ui/badge.tsx`
  - `src/app/context/EventsContext.tsx`
  - `motion/react`, `lucide-react`, `react-router`
- `src/app/components/home/WhyChooseSection.tsx`
  - `src/app/components/ui/card.tsx`
  - `motion/react`, `lucide-react`
- `src/app/components/home/GallerySection.tsx`
  - `src/app/context/EventsContext.tsx`
  - `src/app/data/mockData.ts`
  - `motion/react`, `lucide-react`
- `src/app/components/home/ReviewsSection.tsx`
  - `src/app/components/ui/card.tsx`
  - `src/app/components/home/AddReviewModal.tsx`
  - `src/api/client.ts`
  - `embla-carousel-react`, `embla-carousel-autoplay`
  - `motion/react`, `lucide-react`
- `src/app/components/home/RegistrationSection.tsx`
  - `src/app/components/ui/button.tsx`
  - `motion/react`, `lucide-react`
- `src/app/components/home/ContactSection.tsx`
  - `src/app/components/ui/button.tsx`
  - `src/app/components/ui/input.tsx`
  - `src/app/components/ui/textarea.tsx`
  - `src/app/components/ui/card.tsx`
  - `motion/react`, `lucide-react`, `sonner`
- `src/app/components/home/Footer.tsx`
  - `src/assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png` (logo)
  - `react-router`

## /event/:id (Event Detail Page)
Entry: `src/app/pages/EventDetailPage.tsx`
Dependencies:
- `src/app/context/EventsContext.tsx`
- `src/app/components/ui/button.tsx`
- `src/app/components/ui/badge.tsx`
- `src/app/components/ui/card.tsx`
- `src/app/components/events/RegistrationModal.tsx`
- `motion/react`, `lucide-react`, `react-router`

## /terms (Terms Page)
Entry: `src/app/pages/TermsPage.tsx`
Dependencies:
- `react-router`

## /admin (Admin Login)
Entry: `src/app/pages/admin/AdminLogin.tsx`

## /admin/dashboard (Admin Dashboard)
Entry: `src/app/pages/admin/AdminDashboard.tsx`

## /admin/dashboard/events (Manage Events)
Entry: `src/app/pages/admin/ManageEvents.tsx`

## /admin/dashboard/registrations (Registrations)
Entry: `src/app/pages/admin/Registrations.tsx`

## /admin/dashboard/reviews (Manage Reviews)
Entry: `src/app/pages/admin/ManageReviews.tsx`
