// Mock database for demo purposes
export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  venue: string;
  date: string;
  price: number;
  shortDescription: string;
  images: string[];
  videos: string[];
  itinerary: ItineraryItem[];
  status: "upcoming" | "completed";
  googleMapUrl?: string;
  registrationLink?: string;
  whatsIncluded?: string[];
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  image?: string;
}

export interface Registration {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventId: string;
  eventName: string;
  paymentStatus: "pending" | "paid" | "failed";
  registeredAt: string;
}

export const eventsData: Event[] = [
  {
    id: "1",
    name: "Trekking to Ralamandal",
    description:
      "Experience an exhilarating trek to Ralamandal, one of the most scenic spots near Indore. This trek offers a perfect blend of adventure, nature, and fitness. Organized in collaboration with Yoga and Fitness Club of IIPS DAVV.",
    venue: "Ralamandal Wildlife Sanctuary, Indore",
    date: "2026-04-15",
    price: 599,
    shortDescription:
      "A perfect blend of trekking and nature exploration at Ralamandal Wildlife Sanctuary.",
    images: [
      "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHRyZWtraW5nJTIwYWR2ZW50dXJlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc3MjQzMzg0Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1724125894882-3b9aaeff7e8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjB0cmFpbCUyMGhpa2luZ3xlbnwxfHx8fDE3NzI0MzM4NDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    videos: [
      "https://www.youtube.com/embed/xNRJwmlRBNU",
    ],
    itinerary: [
      {
        day: 1,
        title: "Morning Assembly & Trek",
        description:
          "Gather at IIPS DAVV campus at 6:00 AM. Transportation to Ralamandal. Begin trek at 7:30 AM. Reach summit by 10:00 AM.",
      },
      {
        day: 1,
        title: "Lunch & Yoga Session",
        description:
          "Enjoy packed lunch with a view. Participate in a guided yoga and meditation session at the summit.",
      },
      {
        day: 1,
        title: "Descent & Return",
        description:
          "Begin descent at 2:00 PM. Return to campus by 5:00 PM. Share experiences and group photos.",
      },
    ],
    status: "completed",
    googleMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.3891676745677!2d75.81087431495772!3d22.72392498511656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd5f5c6f8e9d%3A0x9d8e5a5f5c6f8e9d!2sRalamandal%20Wildlife%20Sanctuary!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin",
    registrationLink: "https://forms.gle/example1",
    whatsIncluded: [
      "Professional trek leader",
      "Transportation from meeting point",
      "Meals as per itinerary",
      "First aid kit & safety equipment",
      "Event completion certificate",
    ],
  },
  {
    id: "2",
    name: "Janapav Kutti Trek",
    description:
      "Discover the historic Janapav hill, believed to be the birthplace of Lord Parshuram. This moderate trek combines spirituality with adventure and offers breathtaking views of the Malwa plateau.",
    venue: "Janapav Hill, Mhow",
    date: "2026-05-20",
    price: 799,
    shortDescription:
      "Historic trek to Janapav hill with spiritual significance and stunning views.",
    images: [
      "https://images.unsplash.com/photo-1740383237083-0d11ceda91dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaW1hbGF5YW4lMjB0cmVrJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzI0MzM4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1663672679293-ea5964b82874?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwYWR2ZW50dXJlJTIwYmFja3BhY2tpbmd8ZW58MXx8fHwxNzcyNDMzODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    videos: [
      "https://www.youtube.com/embed/rGKfKNdSXAg",
    ],
    itinerary: [
      {
        day: 1,
        title: "Early Morning Departure",
        description:
          "Meet at 5:30 AM at designated point. Travel to Janapav base by 7:00 AM. Safety briefing and warm-up exercises.",
      },
      {
        day: 1,
        title: "Trek to Summit",
        description:
          "Begin trek through forest trails. Visit ancient temples. Reach Janapav peak by 11:00 AM. Explore the historical sites.",
      },
      {
        day: 1,
        title: "Lunch & Activities",
        description:
          "Lunch break with scenic views. Group activities and photography session. Begin descent at 3:00 PM.",
      },
      {
        day: 1,
        title: "Return Journey",
        description:
          "Arrive at base by 5:00 PM. Return to Indore by 7:00 PM. Certificate distribution.",
      },
    ],
    status: "completed",
    googleMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.3891676745677!2d75.81087431495772!3d22.72392498511656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd5f5c6f8e9d%3A0x9d8e5a5f5c6f8e9d!2sJanapav!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin",
    registrationLink: "https://forms.gle/example2",
    whatsIncluded: [
      "Professional trek leader",
      "Transportation from meeting point",
      "Meals as per itinerary",
      "First aid kit & safety equipment",
      "Event completion certificate",
    ],
  },
  {
    id: "3",
    name: "Dhawalgiri Trek",
    description:
      "Challenge yourself with the exciting Dhawalgiri trek, a moderate to difficult trail that tests your endurance while rewarding you with panoramic mountain views and an unforgettable adventure experience.",
    venue: "Dhawalgiri Range, Madhya Pradesh",
    date: "2026-06-10",
    price: 899,
    shortDescription:
      "An exciting moderate-difficult trek with panoramic mountain views.",
    images: [
      "https://images.unsplash.com/photo-1758272959668-edd9114299c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1waW5nJTIwYWR2ZW50dXJlJTIwZ3JvdXB8ZW58MXx8fHwxNzcyNDMzODQ3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1685850749074-9cf8023d7e8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbiUyMGluZGlhfGVufDF8fHx8MTc3MjQzMzg0N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    videos: [
      "https://www.youtube.com/embed/5qap5aO4i9A",
    ],
    itinerary: [
      {
        day: 1,
        title: "Day 1: Base Camp Setup",
        description:
          "Depart at 4:00 AM. Reach base camp by 9:00 AM. Set up tents and base camp. Acclimatization walk and team building activities. Dinner and bonfire.",
      },
      {
        day: 2,
        title: "Day 2: Summit Attempt",
        description:
          "Early morning start at 5:00 AM. Trek through challenging terrain. Reach summit by noon. Celebrate achievement and group photos. Descend to base camp by evening.",
      },
      {
        day: 3,
        title: "Day 3: Return Journey",
        description:
          "Morning yoga and breakfast. Pack up base camp. Final group activities and feedback session. Return journey to Indore. Arrive by evening.",
      },
    ],
    status: "completed",
    googleMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.3891676745677!2d75.81087431495772!3d22.72392498511656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd5f5c6f8e9d%3A0x9d8e5a5f5c6f8e9d!2sDhawalgiri!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin",
    registrationLink: "https://forms.gle/example3",
    whatsIncluded: [
      "Professional trek leader",
      "Transportation from meeting point",
      "Meals as per itinerary",
      "Camping gear & tent",
      "First aid kit & safety equipment",
      "Event completion certificate",
    ],
  },
  {
    id: "4",
    name: "Himalayan Adventure 2026",
    description:
      "Join us for an epic 7-day Himalayan adventure covering multiple peaks, camping under the stars, and experiencing the raw beauty of the mountains. This is a premium experience for serious adventure enthusiasts.",
    venue: "Himachal Pradesh",
    date: "2026-09-15",
    price: 12999,
    shortDescription:
      "7-day premium Himalayan adventure with camping and multiple peaks.",
    images: [
      "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHRyZWtraW5nJTIwYWR2ZW50dXJlJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc3MjQzMzg0Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1740383237083-0d11ceda91dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaW1hbGF5YW4lMjB0cmVrJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzI0MzM4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    videos: [],
    itinerary: [
      {
        day: 1,
        title: "Arrival & Acclimatization",
        description:
          "Arrive in Manali. Check into hotel. City tour and briefing. Team introduction and gear check.",
      },
      {
        day: 2,
        title: "Base Camp Trek",
        description:
          "Drive to trek starting point. Begin trek to base camp. Set up camp and evening activities.",
      },
      {
        day: 3,
        title: "Advanced Camp",
        description:
          "Trek to advanced camp at higher altitude. Camping and star gazing.",
      },
      {
        day: 4,
        title: "Summit Day",
        description:
          "Early morning summit push. Reach peak and celebrate. Return to advanced camp.",
      },
      {
        day: 5,
        title: "Descent",
        description: "Descend to base camp. Relaxation and celebration.",
      },
      {
        day: 6,
        title: "Return to Manali",
        description: "Trek back to starting point. Drive to Manali. Leisure time.",
      },
      {
        day: 7,
        title: "Departure",
        description: "Breakfast and checkout. Certificate distribution. Departure.",
      },
    ],
    status: "upcoming",
    googleMapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.3891676745677!2d77.81087431495772!3d32.72392498511656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd5f5c6f8e9d%3A0x9d8e5a5f5c6f8e9d!2sManali!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin",
    registrationLink: "https://forms.gle/example4",
    whatsIncluded: [
      "Professional trek leader",
      "Transportation from meeting point",
      "All meals included",
      "Camping gear & tent",
      "First aid kit & safety equipment",
      "Event completion certificate",
      "Travel insurance",
    ],
  },
];

export const reviewsData: Review[] = [
  {
    id: "1",
    name: "Priya Sharma",
    rating: 5,
    text: "Amazing experience! The Ralamandal trek was well organized and the team was very supportive. Highly recommend Mor Events!",
    image: undefined,
  },
  {
    id: "2",
    name: "Rahul Verma",
    rating: 5,
    text: "Best trekking experience ever! Ayush and his team made sure everyone was safe and had fun. Can't wait for the next adventure!",
    image: undefined,
  },
  {
    id: "3",
    name: "Sneha Patel",
    rating: 5,
    text: "The Janapav trek exceeded all expectations. Beautiful location, great company, and professional organization. Thank you Mor Events!",
    image: undefined,
  },
  {
    id: "4",
    name: "Amit Singh",
    rating: 5,
    text: "Dhawalgiri trek was challenging but so rewarding! The yoga sessions added a special touch. Definitely joining the next event!",
    image: undefined,
  },
  {
    id: "5",
    name: "Kavya Reddy",
    rating: 5,
    text: "Professional, safe, and incredibly fun! Mor Events knows how to create unforgettable experiences. Kudos to the entire team!",
    image: undefined,
  },
];

export const registrationsData: Registration[] = [
  {
    id: "1",
    name: "Ankit Sharma",
    phone: "9876543210",
    email: "ankit@example.com",
    eventId: "4",
    eventName: "Himalayan Adventure 2026",
    paymentStatus: "paid",
    registeredAt: "2026-03-01T10:30:00Z",
  },
  {
    id: "2",
    name: "Meera Jain",
    phone: "9876543211",
    email: "meera@example.com",
    eventId: "4",
    eventName: "Himalayan Adventure 2026",
    paymentStatus: "pending",
    registeredAt: "2026-03-01T14:20:00Z",
  },
  {
    id: "3",
    name: "Rohan Gupta",
    phone: "9876543212",
    email: "rohan@example.com",
    eventId: "4",
    eventName: "Himalayan Adventure 2026",
    paymentStatus: "paid",
    registeredAt: "2026-03-02T09:15:00Z",
  },
];

// Helper to detect media type
export const getMediaType = (url: string): "image" | "youtube" | "video" | "instagram" => {
  if (!url) return "image";
  if (url.includes("instagram.com/p/") || url.includes("instagram.com/reel/")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return "video";
  return "image";
};

export const normalizeYouTubeUrl = (url: string): string => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
  return url;
};

export const normalizeInstagramUrl = (url: string): string => {
  const baseUrl = url.split("?")[0];
  const urlWithSlash = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  // The embed endpoint
  return urlWithSlash + "embed";
};

// Legacy helpers (kept for backward compat, use context for mutable operations)
export const getEventById = (id: string): Event | undefined => {
  return eventsData.find((event) => event.id === id);
};

export const getUpcomingEvents = (): Event[] => {
  return eventsData.filter((event) => event.status === "upcoming");
};

export const getCompletedEvents = (): Event[] => {
  return eventsData.filter((event) => event.status === "completed");
};

export const getRegistrationsByEventId = (eventId: string): Registration[] => {
  return registrationsData.filter((reg) => reg.eventId === eventId);
};
