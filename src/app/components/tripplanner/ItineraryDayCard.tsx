import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ItineraryItemCard } from "./ItineraryItemCard";
import type { ItineraryDay } from "../../types/trip";

export function ItineraryDayCard({ day }: { day: ItineraryDay }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg text-[#0F3057]">
            Day {day.dayNumber}: {day.title}
          </CardTitle>
          <span className="text-sm text-gray-500">{day.date}</span>
        </div>
        {day.summary && <p className="text-sm text-gray-600">{day.summary}</p>}
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-gray-50">
          {day.items.map((item, idx) => (
            <ItineraryItemCard key={idx} item={item} />
          ))}
        </div>
        {day.estimatedDailyCost != null && (
          <p className="text-sm text-gray-500 mt-3 pt-3 border-t">
            Estimated cost for the day: <span className="font-medium text-[#0F3057]">₹{day.estimatedDailyCost}</span> (estimate only)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
