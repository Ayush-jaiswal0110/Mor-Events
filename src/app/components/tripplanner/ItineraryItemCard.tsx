import { MapPin, Clock, IndianRupee, Bus } from "lucide-react";
import { Badge } from "../ui/badge";
import type { ItineraryItem } from "../../types/trip";

const ITEM_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  sightseeing: "Sightseeing",
  activity: "Activity",
  travel: "Travel",
  lunch: "Lunch",
  rest: "Rest",
  check_in: "Check-in",
  check_out: "Check-out",
  shopping: "Shopping",
  snack: "Snack",
  dinner: "Dinner",
  nightlife: "Nightlife",
  free_time: "Free Time",
};

const ITEM_TYPE_COLORS: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800 border-amber-200",
  lunch: "bg-orange-100 text-orange-800 border-orange-200",
  dinner: "bg-purple-100 text-purple-800 border-purple-200",
  snack: "bg-yellow-100 text-yellow-800 border-yellow-200",
  travel: "bg-gray-100 text-gray-700 border-gray-200",
  sightseeing: "bg-blue-100 text-blue-800 border-blue-200",
  activity: "bg-teal-100 text-teal-800 border-teal-200",
  rest: "bg-slate-100 text-slate-700 border-slate-200",
  free_time: "bg-slate-100 text-slate-700 border-slate-200",
  check_in: "bg-green-100 text-green-800 border-green-200",
  check_out: "bg-green-100 text-green-800 border-green-200",
  shopping: "bg-pink-100 text-pink-800 border-pink-200",
  nightlife: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function ItineraryItemCard({ item }: { item: ItineraryItem }) {
  return (
    <div className="flex gap-4 py-3">
      <div className="w-20 shrink-0 text-sm text-gray-500 pt-1 tabular-nums">
        {item.startTime || "--:--"}
        {item.endTime ? <span className="block text-xs text-gray-400">to {item.endTime}</span> : null}
      </div>
      <div className="flex-1 border-l-2 border-gray-100 pl-4 pb-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge className={ITEM_TYPE_COLORS[item.itemType] || ""} variant="outline">
            {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
          </Badge>
          <h4 className="font-medium text-[#0F3057]">{item.title}</h4>
        </div>
        {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
        {item.placeName && (
          <div className="flex items-start gap-1 text-sm text-gray-500 mb-1">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {item.placeName}
              {item.address ? ` — ${item.address}` : ""}
              {item.mapsUrl && (
                <a href={item.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#008080] hover:underline ml-1">
                  View on map
                </a>
              )}
            </span>
          </div>
        )}
        <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 mt-1">
          {item.estimatedDurationMinutes ? (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.estimatedDurationMinutes} min</span>
          ) : null}
          {item.estimatedTravelMinutes ? (
            <span className="flex items-center gap-1"><Bus className="h-3 w-3" /> {item.estimatedTravelMinutes} min travel</span>
          ) : null}
          {item.estimatedCost != null ? (
            <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> ~{item.estimatedCost} (estimate)</span>
          ) : null}
        </div>
        {item.notes && <p className="text-xs text-gray-400 italic mt-1">{item.notes}</p>}
      </div>
    </div>
  );
}
