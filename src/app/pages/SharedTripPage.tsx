import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ItineraryTimeline } from "../components/tripplanner/ItineraryTimeline";
import { getSharedTrip } from "../../api/tripApi";
import type { Trip } from "../types/trip";

export function SharedTripPage() {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<Partial<Trip> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getSharedTrip(token)
      .then(setTrip)
      .catch((err) => setError(err.message || "This shared trip link is no longer available."))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-gray-500">Loading trip...</div>;
  }

  if (error || !trip) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-600 mb-4">{error || "This shared trip link is no longer available."}</p>
        <Link to="/" className="text-[#008080] hover:underline">Back to Mor Events</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <p className="text-sm text-[#008080] font-medium mb-1">Shared Trip Itinerary</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F3057]">{trip.destination}</h1>
        <p className="text-gray-500 mt-1">
          {trip.startDate} – {trip.endDate}
          {trip.travelersCount ? ` · ${trip.travelersCount} traveler${trip.travelersCount > 1 ? "s" : ""}` : ""}
        </p>
        {trip.summary && <p className="text-gray-600 mt-2">{trip.summary}</p>}
      </div>

      <ItineraryTimeline
        days={trip.itineraryDays || []}
        importantNotes={trip.importantNotes}
        estimatedTotalCost={trip.estimatedTotalCost}
        placesVerified={trip.placesVerified}
      />

      <div className="text-center mt-10">
        <Link to="/plan-trip" className="text-[#008080] hover:underline">
          Plan your own trip with Mor Events →
        </Link>
      </div>
    </div>
  );
}
