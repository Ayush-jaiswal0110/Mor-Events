# Mor Events - Travel & Event Management Platform

A complete, modern event management website for **Mor Events**, India's Premium Travel & Trekking Event Organizer. Built with React, TypeScript, Tailwind CSS, and featuring both a user-facing website and an admin dashboard.

## 🌟 Features

### User-Facing Website
- **Hero Section**: Full-screen landing with mountain background
- **About Section**: Founder introduction with Ayush Jaiswal's profile
- **Events Section**: Display of upcoming and completed events with detailed cards
- **Why Choose Us**: Feature highlights with icons
- **Gallery Section**: Instagram-style grid layout with modal view
- **Reviews Section**: Auto-rotating testimonial carousel
- **Registration Section**: Call-to-action for event registration
- **Contact Section**: Contact form with Google Maps integration
- **WhatsApp Button**: Floating quick contact button
- **Dark/Light Mode**: Theme toggle support

### Admin Dashboard
- **Dashboard Overview**: 
  - Real-time statistics (registrations, events, revenue, reviews)
  - Monthly registration chart
  - Event participation chart
  - Recent activity feed
  
- **Event Management**:
  - Create, edit, and delete events
  - Upload images and videos
  - Add detailed itineraries
  - Set pricing and availability
  - Toggle event status (upcoming/completed)
  
- **Registrations**:
  - View all registrations in table format
  - Filter by payment status and event
  - Search functionality
  - Export to CSV
  - Google Sheets integration ready
  
- **Authentication**:
  - Secure admin login
  - JWT token-based authentication (ready for backend)
  - Protected routes

## 🎨 Design System

### Brand Colors
- **Peacock Blue**: `#0F3057` - Primary brand color
- **Teal**: `#008080` - Accent color
- **Royal Purple**: `#4B0082` - Secondary accent
- **White**: Background and text

### Design Principles
- Glassmorphism effects
- Soft shadows and rounded cards
- Smooth animations using Motion (Framer Motion)
- Responsive design (mobile-first)
- Accessibility focused

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mor-events
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## 📁 Project Structure

```
mor-events/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/              # Homepage sections
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── AboutSection.tsx
│   │   │   │   ├── EventsSection.tsx
│   │   │   │   ├── WhyChooseSection.tsx
│   │   │   │   ├── GallerySection.tsx
│   │   │   │   ├── ReviewsSection.tsx
│   │   │   │   ├── RegistrationSection.tsx
│   │   │   │   ├── ContactSection.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── ui/                # Reusable UI components
│   │   ├── data/
│   │   │   └── mockData.ts        # Mock data (events, reviews, registrations)
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx     # Public website layout
│   │   │   └── AdminLayout.tsx    # Admin dashboard layout
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── EventDetailPage.tsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.tsx
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── ManageEvents.tsx
│   │   │       └── Registrations.tsx
│   │   ├── App.tsx                # Root component
│   │   └── routes.tsx             # React Router configuration
│   ├── styles/
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   ├── theme.css
│   │   └── fonts.css
│   └── imports/
│       └── mor-events-design-spec.md
├── API_DOCUMENTATION.md           # Complete backend API docs
├── package.json
└── vite.config.ts
```

## 🔑 Key Pages & Routes

### Public Routes
- `/` - Homepage with all sections
- `/event/:id` - Event detail page with full information

### Admin Routes
- `/admin` - Admin login page
- `/admin/dashboard` - Dashboard overview
- `/admin/dashboard/events` - Manage events
- `/admin/dashboard/registrations` - View registrations

## 🎯 Mock Data

The application includes comprehensive mock data for demonstration:

### Events
- **Trekking to Ralamandal** (Completed)
- **Janapav Kutti Trek** (Completed)
- **Dhawalgiri Trek** (Completed)
- **Himalayan Adventure 2026** (Upcoming)

Each event includes:
- Name, description, venue, date, price
- Multiple images
- Day-wise itinerary
- Google Maps location
- Registration link

### Reviews
5 sample reviews with 5-star ratings

### Registrations
3 sample registrations with different payment statuses

## 🔌 Backend Integration

A complete **API Documentation** is provided in `API_DOCUMENTATION.md` for connecting with an Express.js/Node.js backend.

### Key API Endpoints Documented:
- **Authentication**: Login, logout, token verification
- **Events**: CRUD operations for events
- **Registrations**: Manage registrations and payments
- **Reviews**: Submit and moderate reviews
- **Analytics**: Dashboard statistics and charts
- **File Upload**: Image and video uploads
- **Google Sheets**: Integration for auto-syncing registrations

### Database Schema
Complete SQL schemas provided for:
- Events table
- Registrations table
- Reviews table
- Admin users table

## 🎨 Customization

### Update Brand Logo
Replace the logo import in layouts:
```tsx
import logoImg from "figma:asset/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";
```

### Update Founder Image
Replace in `AboutSection.tsx`:
```tsx
import founderImg from "figma:asset/eed6de649ee2eaf43e252e2b9f2c3a7137b4cbb7.png";
```

### Modify Colors
Update in `/src/styles/theme.css` or use Tailwind classes with brand colors:
- `text-[#0F3057]` - Peacock Blue
- `text-[#008080]` - Teal
- `text-[#4B0082]` - Royal Purple

### Add New Events
Edit `/src/app/data/mockData.ts` and add to `eventsData` array.

## 📱 Responsive Design

The website is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🌙 Dark Mode

Toggle between light and dark modes using the theme switcher in the navigation bar. The app uses `next-themes` for theme management.

## 🔒 Security Notes

For production deployment:
1. Replace mock authentication with real JWT authentication
2. Implement proper backend API calls
3. Secure admin routes with authentication middleware
4. Use environment variables for sensitive data
5. Enable HTTPS
6. Implement rate limiting
7. Add CSRF protection

## 📧 Contact Information

- **Email**: moreventsofficial@gmail.com
- **Phone**: +91 7024896018
- **Address**: 41-Shree Krishna Avenue Phase-2, Limbodi, Indore – 452001
- **Founder**: Ayush Jaiswal (OC Head - Yoga and Fitness Club, IIPS DAVV)

## 🛠️ Technology Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1.12
- **Routing**: React Router 7.13.0
- **Animations**: Motion (Framer Motion) 12.23.24
- **Charts**: Recharts 2.15.2
- **UI Components**: Radix UI
- **Form Handling**: React Hook Form 7.55.0
- **Theme**: next-themes 0.4.6
- **Icons**: Lucide React 0.487.0
- **Carousel**: Embla Carousel 8.6.0
- **Build Tool**: Vite 6.3.5

## 📦 Dependencies

All required packages are listed in `package.json` and include:
- UI component libraries (Radix UI)
- Form validation
- Chart libraries
- Image carousels
- Dark mode support
- And more...

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Hosting
Upload the `dist/` folder to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

### Environment Variables
Create `.env` file for production:
```env
VITE_API_URL=https://api.morevents.com
VITE_PAYMENT_KEY=your_payment_key
```

## 🤝 Contributing

This project was created for Mor Events. For modifications or contributions, please contact the development team.

## 📄 License

Copyright © 2026 Mor Events. All rights reserved.

## 🙏 Acknowledgments

- **Founder**: Ayush Jaiswal
- **Design Inspiration**: Travel and adventure aesthetics
- **Collaboration**: Yoga and Fitness Club, IIPS DAVV
- **Images**: Unsplash (for demo purposes)

## 📝 Notes

- This is a frontend-only application with mock data
- Backend API integration required for production
- Google Sheets integration needs OAuth setup
- Payment gateway integration needed for actual payments
- All data is currently stored in mock files for demonstration

## 🐛 Known Issues

None at the moment. Please report any bugs to the development team.

## 🔮 Future Enhancements

- Real-time chat support
- Mobile app (React Native)
- Advanced analytics dashboard
- Email notifications for registrations
- Multi-language support
- Social media integration
- Blog/News section
- Photo/video gallery from participants
- Certificate generation
- Referral program

---

**Built with ❤️ by Mor Events Development Team**

For support: moreventsofficial@gmail.com | +91 7024896018
