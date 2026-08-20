import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import type { TripStatus } from "../../types/trip";

const PROGRESS_MESSAGES = [
  "Creating your trip...",
  "Finding the best places...",
  "Selecting attractions based on your interests...",
  "Organizing your day-wise route...",
  "Adding food and rest stops...",
  "Finalizing your personalized itinerary...",
];

/**
 * Shown while a trip is queued/generating. This app has no WebSocket/SSE
 * infrastructure (see TRIP_PLANNER_IMPLEMENTATION.md), so the caller polls
 * GET /trips/:id/status and passes the real `status` in here — the
 * rotating text below is purely cosmetic copy, not a fake percentage, and
 * always reflects the backend's actual "queued"/"generating" state.
 */
export function TripStatusIndicator({
  status,
  error,
  onRetry,
}: {
  status: TripStatus;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (status !== "queued" && status !== "generating") return;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-red-600 font-medium">We couldn't generate your itinerary</p>
        <p className="text-sm text-gray-500 max-w-sm">{error || "Please try again in a few minutes."}</p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-2 bg-[#0F3057] hover:bg-[#008080] text-white">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (status === "queued" || status === "generating") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="h-10 w-10 text-[#008080] animate-spin" />
        <p className="text-[#0F3057] font-medium">{PROGRESS_MESSAGES[messageIndex]}</p>
        <p className="text-xs text-gray-400">This usually takes under a minute.</p>
      </div>
    );
  }

  return null;
}
