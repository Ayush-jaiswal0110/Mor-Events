import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "../ui/accordion";
import {
  INTEREST_OPTIONS, FOOD_PREFERENCE_OPTIONS, TripFormValues,
} from "../../types/trip";

export type TripFormErrors = Partial<Record<keyof TripFormValues, string>>;

const DEFAULT_VALUES: TripFormValues = {
  destination: "",
  startDate: "",
  endDate: "",
  travelersCount: 2,
  travelType: "",
  budgetType: "",
  budgetAmount: undefined,
  currency: "INR",
  startingCity: "",
  arrivalDate: "",
  arrivalTime: "",
  departureDate: "",
  departureTime: "",
  travelMode: "",
  interests: [],
  foodPreferences: [],
  dietaryRestrictions: "",
  preferredPace: "balanced",
  accommodationPreference: "",
  hotelLocation: "",
  accessibilityRequirements: "",
  specialRequests: "",
};

function validate(values: TripFormValues): TripFormErrors {
  const errors: TripFormErrors = {};
  if (!values.destination.trim()) errors.destination = "Destination is required";
  else if (values.destination.length > 150) errors.destination = "Destination is too long";

  if (!values.startDate) errors.startDate = "Start date is required";
  if (!values.endDate) errors.endDate = "End date is required";
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "End date cannot be before start date";
  }
  if (!values.travelersCount || values.travelersCount < 1) {
    errors.travelersCount = "Traveler count must be at least 1";
  }
  if (!values.travelType) errors.travelType = "Please select a travel type";
  if (!values.budgetType) errors.budgetType = "Please select a budget";
  if (values.budgetType === "custom") {
    if (!values.budgetAmount || Number.isNaN(values.budgetAmount) || values.budgetAmount <= 0) {
      errors.budgetAmount = "Enter a valid custom budget amount";
    }
  }
  return errors;
}

interface Props {
  initialValues?: Partial<TripFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: TripFormValues) => void | Promise<void>;
}

export function TripPlannerForm({ initialValues, submitLabel = "Generate My Itinerary", isSubmitting, onSubmit }: Props) {
  const [values, setValues] = useState<TripFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const [errors, setErrors] = useState<TripFormErrors>({});

  const set = <K extends keyof TripFormValues>(key: K, value: TripFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggleListValue = (key: "interests" | "foodPreferences", value: string) => {
    setValues((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    // Values are intentionally NOT reset here — if the parent's onSubmit
    // rejects (network/API error), the form keeps everything the user typed.
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Required fields */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="destination">Destination *</Label>
          <Input
            id="destination"
            placeholder="e.g. Manali, Himachal Pradesh"
            value={values.destination}
            maxLength={150}
            onChange={(e) => set("destination", e.target.value)}
            aria-invalid={!!errors.destination}
          />
          {errors.destination && <p className="text-sm text-red-500">{errors.destination}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            aria-invalid={!!errors.startDate}
          />
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            aria-invalid={!!errors.endDate}
          />
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="travelersCount">Number of Travelers *</Label>
          <Input
            id="travelersCount"
            type="number"
            min={1}
            max={20}
            value={values.travelersCount}
            onChange={(e) => set("travelersCount", parseInt(e.target.value || "1", 10))}
            aria-invalid={!!errors.travelersCount}
          />
          {errors.travelersCount && <p className="text-sm text-red-500">{errors.travelersCount}</p>}
        </div>

        <div className="space-y-2">
          <Label>Travel Type *</Label>
          <Select value={values.travelType} onValueChange={(v) => set("travelType", v as TripFormValues["travelType"]) }>
            <SelectTrigger aria-invalid={!!errors.travelType}>
              <SelectValue placeholder="Select travel type" />
            </SelectTrigger>
            <SelectContent>
              {["solo", "couple", "family", "friends", "business"].map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.travelType && <p className="text-sm text-red-500">{errors.travelType}</p>}
        </div>

        <div className="space-y-2">
          <Label>Budget *</Label>
          <Select value={values.budgetType} onValueChange={(v) => set("budgetType", v as TripFormValues["budgetType"])}>
            <SelectTrigger aria-invalid={!!errors.budgetType}>
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {errors.budgetType && <p className="text-sm text-red-500">{errors.budgetType}</p>}
        </div>

        {values.budgetType === "custom" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="budgetAmount">Custom Amount *</Label>
              <Input
                id="budgetAmount"
                type="number"
                min={1}
                value={values.budgetAmount ?? ""}
                onChange={(e) => set("budgetAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                aria-invalid={!!errors.budgetAmount}
              />
              {errors.budgetAmount && <p className="text-sm text-red-500">{errors.budgetAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                maxLength={6}
                value={values.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
              />
            </div>
          </>
        )}
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <Label>Interests</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INTEREST_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={values.interests.includes(opt.value)}
                onCheckedChange={() => toggleListValue("interests", opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Food preferences */}
      <div className="space-y-3">
        <Label>Food Preferences</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FOOD_PREFERENCE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={values.foodPreferences.includes(opt.value)}
                onCheckedChange={() => toggleListValue("foodPreferences", opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Preferred pace */}
      <div className="space-y-2 max-w-xs">
        <Label>Preferred Pace</Label>
        <Select value={values.preferredPace} onValueChange={(v) => set("preferredPace", v as TripFormValues["preferredPace"]) }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relaxed">Relaxed</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="fast_paced">Fast-paced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Optional / advanced fields */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger>More trip details (optional)</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label htmlFor="startingCity">Starting City</Label>
                <Input id="startingCity" value={values.startingCity} onChange={(e) => set("startingCity", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelMode">Preferred Travel Mode</Label>
                <Input id="travelMode" placeholder="Flight, train, car..." value={values.travelMode} onChange={(e) => set("travelMode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Arrival Date</Label>
                <Input id="arrivalDate" type="date" value={values.arrivalDate} onChange={(e) => set("arrivalDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Arrival Time</Label>
                <Input id="arrivalTime" type="time" value={values.arrivalTime} onChange={(e) => set("arrivalTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date</Label>
                <Input id="departureDate" type="date" value={values.departureDate} onChange={(e) => set("departureDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input id="departureTime" type="time" value={values.departureTime} onChange={(e) => set("departureTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Input id="dietaryRestrictions" placeholder="e.g. no peanuts, gluten-free" value={values.dietaryRestrictions} onChange={(e) => set("dietaryRestrictions", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accommodationPreference">Accommodation Preference</Label>
                <Input id="accommodationPreference" placeholder="Hotel, homestay, hostel..." value={values.accommodationPreference} onChange={(e) => set("accommodationPreference", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="hotelLocation">Hotel / Accommodation Location</Label>
                <Input id="hotelLocation" value={values.hotelLocation} onChange={(e) => set("hotelLocation", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="accessibilityRequirements">Accessibility Requirements</Label>
                <Textarea id="accessibilityRequirements" maxLength={1000} value={values.accessibilityRequirements} onChange={(e) => set("accessibilityRequirements", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea id="specialRequests" maxLength={1000} value={values.specialRequests} onChange={(e) => set("specialRequests", e.target.value)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button type="submit" size="lg" className="w-full bg-[#0F3057] hover:bg-[#008080] text-white" disabled={isSubmitting}>
        {isSubmitting ? "Please wait..." : submitLabel}
      </Button>
    </form>
  );
}
