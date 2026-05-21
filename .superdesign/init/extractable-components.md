# Extractable Components

## Layout Components

### MainLayout
- Source: `src/app/layouts/MainLayout.tsx`
- Category: layout
- Description: Sticky top nav with logo, section scroll links, dark/light toggle, mobile menu, WhatsApp FAB
- Extractable props: mobileMenuOpen (boolean), isDark (boolean)
- Hardcoded: Logo image, nav link text, WhatsApp SVG, all CSS

### Footer
- Source: `src/app/components/home/Footer.tsx`
- Category: layout
- Description: 4-column footer with logo, quick links, contact info, legal links
- Extractable props: none
- Hardcoded: Logo image, all text, links, CSS

### AdminLayout
- Source: `src/app/layouts/AdminLayout.tsx`
- Category: layout
- Description: Dark sidebar admin layout with nav links and header
- Extractable props: none
- Hardcoded: All text, sidebar items, CSS

## Page Section Components

### HeroSection
- Source: `src/app/components/home/HeroSection.tsx`
- Category: basic
- Description: Full-screen hero with bg image, gradient overlay, heading, tagline, CTA buttons, scroll indicator
- Extractable props: none
- Hardcoded: Background image URL, all text, gradient colors

### AboutSection
- Source: `src/app/components/home/AboutSection.tsx`
- Category: basic
- Description: Two-column about section with founder image, bio text, quote
- Extractable props: none
- Hardcoded: Founder image, all text, gradient glow

### EventsSection
- Source: `src/app/components/home/EventsSection.tsx`
- Category: basic
- Description: Grid of event cards with image, details, CTA — data-driven from EventsContext
- Extractable props: none (data from context)
- Hardcoded: Section heading, description, button text, CSS

### WhyChooseSection
- Source: `src/app/components/home/WhyChooseSection.tsx`
- Category: basic
- Description: 5 feature cards on gradient bg with icons and descriptions
- Extractable props: none
- Hardcoded: Feature data, icons, gradient background

### GallerySection
- Source: `src/app/components/home/GallerySection.tsx`
- Category: basic
- Description: Auto-playing media carousel with thumbnails, lightbox, supports images/video/YouTube/Instagram
- Extractable props: none (data from context)

### ReviewsSection
- Source: `src/app/components/home/ReviewsSection.tsx`
- Category: basic
- Description: Embla carousel of review cards with star ratings, fetched from API
- Extractable props: none

### RegistrationSection
- Source: `src/app/components/home/RegistrationSection.tsx`
- Category: basic
- Description: CTA section with stats counters and Google Form registration link
- Extractable props: none

### ContactSection
- Source: `src/app/components/home/ContactSection.tsx`
- Category: basic
- Description: Two-column contact with info card, Google Map, and contact form
- Extractable props: none

## Basic UI Components

### Button
- Source: `src/app/components/ui/button.tsx`
- Category: basic
- Description: CVA-based button with 6 variants and 4 sizes
- Extractable props: variant, size, asChild

### Card
- Source: `src/app/components/ui/card.tsx`
- Category: basic
- Description: Compound card component with header, title, description, content, footer
- Extractable props: none (className-based customization)

### Badge
- Source: `src/app/components/ui/badge.tsx`
- Category: basic
- Description: CVA-based badge with 4 variants
- Extractable props: variant, asChild
