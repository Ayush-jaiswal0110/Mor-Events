import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { TripPlannerForm } from "../components/tripplanner/TripPlannerForm";
import { createTrip } from "../../api/tripApi";
import type { TripFormValues } from "../types/trip";

export function TripPlannerPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: TripFormValues) => {
    try {
      setIsSubmitting(true);
      const trip = await createTrip(values);
      toast.success("Trip created — building your itinerary...");
      navigate(`/trip/${trip.id}`);
    } catch (err: any) {
      toast.error(err.message || "Couldn't create your trip. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#0F3057]">Plan My Trip</h1>
        <p className="text-gray-600 mt-2">
          Tell us about your trip and our AI will build a day-wise itinerary — places, meals,
          travel time and rest stops included.
        </p>
      </div>
      <TripPlannerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
