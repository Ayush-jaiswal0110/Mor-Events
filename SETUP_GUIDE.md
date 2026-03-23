# Quick Setup Guide - Mor Events

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
# or
pnpm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to: `http://localhost:5173`

That's it! The website is now running locally.

---

## 🎯 What You Get

### User Website
- Beautiful landing page with hero section
- Event listings with details
- Image gallery
- Review carousel
- Contact form
- Dark/Light mode toggle
- WhatsApp floating button

### Admin Dashboard
Access: `http://localhost:5173/admin`

**Default Login (Mock):**
- Email: Any valid email
- Password: Any password

Features:
- Dashboard with analytics
- Event management (Create/Edit/Delete)
- View registrations
- Charts and statistics

---

## 📝 Customizing Content

### 1. Update Events
Edit: `/src/app/data/mockData.ts`

Find `eventsData` array and modify:
```typescript
{
  id: "1",
  name: "Your Event Name",
  description: "Event description...",
  venue: "Location",
  date: "2026-04-15",
  price: 599,
  // ... more fields
}
```

### 2. Update Reviews
In same file, find `reviewsData` array:
```typescript
{
  id: "1",
  name: "Customer Name",
  rating: 5,
  text: "Review text...",
}
```

### 3. Update Contact Information
Edit: `/src/app/components/home/ContactSection.tsx`

Find and update:
- Email: `moreventsofficial@gmail.com`
- Phone: `+91 7024896018`
- Address: Your address
- Social media links

### 4. Update Company Info
Edit: `/src/app/components/home/AboutSection.tsx`
- Founder name
- Company description
- Tagline

---

## 🎨 Branding

### Colors
Brand colors are used throughout with Tailwind classes:
- **Peacock Blue**: `bg-[#0F3057]` or `text-[#0F3057]`
- **Teal**: `bg-[#008080]` or `text-[#008080]`
- **Purple**: `bg-[#4B0082]` or `text-[#4B0082]`

### Logo
Logo is used in:
- `/src/app/layouts/MainLayout.tsx`
- `/src/app/layouts/AdminLayout.tsx`
- `/src/app/pages/admin/AdminLogin.tsx`

Replace import:
```typescript
import logoImg from "figma:asset/YOUR_LOGO_ID.png";
```

---

## 🔧 Common Tasks

### Add a New Event
1. Open `/src/app/data/mockData.ts`
2. Add new object to `eventsData` array
3. Include all required fields (id, name, description, etc.)
4. Add images from Unsplash or your own

### Add a New Page
1. Create component in `/src/app/pages/`
2. Add route in `/src/app/routes.tsx`
3. Add navigation link in layout

### Change Theme Colors
1. Open `/src/styles/theme.css`
2. Modify CSS variables
3. Or use inline Tailwind classes

---

## 🌐 Connecting to Backend

### Step 1: Set API Base URL
Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 2: Update API Calls
Replace mock data with API calls in components.

Example:
```typescript
// Before (mock data)
import { eventsData } from "../data/mockData";

// After (API call)
const response = await fetch(`${import.meta.env.VITE_API_URL}/events`);
const { data: events } = await response.json();
```

### Step 3: Implement Authentication
Update login in `/src/app/pages/admin/AdminLogin.tsx`:
```typescript
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();
localStorage.setItem('token', token);
```

---

## 📱 Testing on Mobile

### Using Local Network
1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Access from phone:
   ```
   http://YOUR_IP:5173
   ```
   Example: `http://192.168.1.100:5173`

### Using Tunneling (ngrok)
```bash
npx ngrok http 5173
```

---

## 🔒 Security Checklist for Production

- [ ] Replace mock authentication with real JWT
- [ ] Add environment variables for sensitive data
- [ ] Enable HTTPS
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Sanitize user inputs
- [ ] Add CSRF protection
- [ ] Set up proper CORS
- [ ] Use secure password hashing (bcrypt)
- [ ] Implement proper session management

---

## 📦 Building for Production

### Step 1: Build
```bash
npm run build
```

### Step 2: Preview Build
```bash
npm run preview
```

### Step 3: Deploy
Upload `dist/` folder to:
- **Netlify**: Drag & drop `dist/` folder
- **Vercel**: Connect Git repository
- **AWS S3**: Upload to bucket + CloudFront

---

## 🐛 Troubleshooting

### Issue: Port 5173 already in use
**Solution**: Change port in `vite.config.ts`:
```typescript
export default defineConfig({
  server: { port: 3000 }
});
```

### Issue: Images not loading
**Solution**: Check image imports use correct asset IDs:
```typescript
import img from "figma:asset/CORRECT_ASSET_ID.png";
```

### Issue: Dark mode not working
**Solution**: Clear browser cache and local storage:
```javascript
localStorage.clear();
```

### Issue: Carousel not auto-rotating
**Solution**: Check embla-carousel-autoplay is installed:
```bash
npm install embla-carousel-autoplay
```

---

## 📧 Support

Need help?
- Email: moreventsofficial@gmail.com
- Phone: +91 7024896018

---

## ✅ Pre-Launch Checklist

Before going live:
- [ ] Test all pages and links
- [ ] Verify contact form works
- [ ] Check mobile responsiveness
- [ ] Test dark/light mode
- [ ] Update all mock data
- [ ] Replace placeholder images
- [ ] Set up backend API
- [ ] Configure payment gateway
- [ ] Set up Google Sheets integration
- [ ] Add Google Analytics
- [ ] Test registration flow
- [ ] Verify email notifications
- [ ] Check loading speeds
- [ ] Run accessibility audit
- [ ] Set up SSL certificate
- [ ] Create backup system

---

## 🎓 Learning Resources

### React
- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Happy Building! 🚀**

Created with ❤️ for Mor Events
