// Types for the "Plan My Trip" feature. Mirrors the Mongo document shape
// returned by Backend/api/trip_views.py (see TRIP_PLANNER_IMPLEMENTATION.md).

export type TravelType = "solo" | "couple" | "family" | "friends" | "business";
export type BudgetType = "budget" | "moderate" | "luxury" | "custom";
export type PreferredPace = "relaxed" | "balanced" | "fast_paced";
export type TripStatus = "draft" | "queued" | "generating" | "completed" | "failed";

export type ItemType =
  | "breakfast" | "sightseeing" | "activity" | "travel" | "lunch" | "rest"
  | "check_in" | "check_out" | "shopping" | "snack" | "dinner" | "nightlife"
  | "free_time";

export const INTEREST_OPTIONS: { value: string; label: string }[] = [
  { value: "nature", label: "Nature" },
  { value: "adventure", label: "Adventure" },
  { value: "culture", label: "Culture" },
  { value: "history", label: "History" },
  { value: "museums", label: "Museums" },
  { value: "religious_places", label: "Religious Places" },
  { value: "food", label: "Food" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "beaches", label: "Beaches" },
  { value: "mountains", label: "Mountains" },
  { value: "wildlife", label: "Wildlife" },
  { value: "photography", label: "Photography" },
  { value: "relaxation", label: "Relaxation" },
  { value: "local_experiences", label: "Local Experiences" },
  { value: "family_activities", label: "Family Activities" },
];

export const FOOD_PREFERENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "local_food", label: "Local Food" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "street_food", label: "Street Food" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "cafes", label: "Cafes" },
  { value: "desserts", label: "Desserts" },
  { value: "no_preference", label: "No Preference" },
];

export interface ItineraryItem {
  sequence: number;
  startTime: string | null;
  endTime: string | null;
  itemType: ItemType;
  title: string;
  description?: string;
  placeName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  estimatedDurationMinutes?: number | null;
  estimatedTravelMinutes?: number | null;
  estimatedCost?: number | null;
  mapsUrl?: string | null;
  bookingUrl?: string | null;
  notes?: string | null;
  source?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  title: string;
  summary?: string;
  estimatedDailyCost?: number | null;
  items: ItineraryItem[];
}

export interface TripFormValues {
  destination: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  travelType: TravelType | "";
  budgetType: BudgetType | "";
  budgetAmount?: number;
  currency?: string;
  startingCity?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  departureDate?: string;
  departureTime?: string;
  travelMode?: string;
  interests: string[];
  foodPreferences: string[];
  dietaryRestrictions?: string;
  preferredPace: PreferredPace;
  accommodationPreference?: string;
  hotelLocation?: string;
  accessibilityRequirements?: string;
  specialRequests?: string;
  title?: string;
}

export interface Trip extends TripFormValues {
  id: string;
  userId: string;
  status: TripStatus;
  generationVersion: number;
  generationError: string | null;
  needsRegeneration: boolean;
  estimatedTotalCost: number | null;
  summary: string;
  importantNotes: string[];
  itineraryDays: ItineraryDay[];
  placesVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripShare {
  id: string;
  recipientEmail: string | null;
  recipientName: string | null;
  status: "pending" | "sent" | "failed";
  revoked: boolean;
  sentAt: string | null;
  createdAt: string;
  shareUrl: string | null;
}
