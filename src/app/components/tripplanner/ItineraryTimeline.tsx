import { ItineraryDayCard } from "./ItineraryDayCard";
import type { ItineraryDay } from "../../types/trip";

export function ItineraryTimeline({
  days,
  importantNotes,
  estimatedTotalCost,
  placesVerified,
}: {
  days: ItineraryDay[];
  importantNotes?: string[];
  estimatedTotalCost?: number | null;
  placesVerified?: boolean;
}) {
  if (!days || days.length === 0) {
    return <p className="text-gray-500 text-center py-8">No itinerary yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {estimatedTotalCost != null && (
          <p className="text-sm text-gray-600">
            Estimated total trip cost: <span className="font-semibold text-[#0F3057]">₹{estimatedTotalCost}</span>{" "}
            <span className="text-xs text-gray-400">(estimate — not a quote)</span>
          </p>
        )}
        {!placesVerified && (
          <p className="text-xs text-gray-400">
            Places couldn't be independently verified for this trip — treat names/hours/prices as estimates.
          </p>
        )}
      </div>

      {days
        .slice()
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((day) => (
          <ItineraryDayCard key={day.dayNumber} day={day} />
        ))}

      {importantNotes && importantNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">Important Notes</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800">
            {importantNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
