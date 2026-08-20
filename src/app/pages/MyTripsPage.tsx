import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus, Search, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { deleteTrip, listTrips, regenerateTrip } from "../../api/tripApi";
import type { Trip, TripStatus } from "../types/trip";

const STATUS_COLORS: Record<TripStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  queued: "bg-blue-100 text-blue-800 border-blue-200",
  generating: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export function MyTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listTrips({ search, status: statusFilter, page, limit: 12 });
      setTrips(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Couldn't load your trips.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTrip(id);
      toast.success("Trip deleted");
      load();
    } catch (err: any) {
      toast.error(err.message || "Couldn't delete this trip.");
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      await regenerateTrip(id);
      toast.success("Regenerating itinerary...");
      load();
    } catch (err: any) {
      toast.error(err.message || "Couldn't regenerate this trip.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F3057]">My Trips</h1>
        <Button onClick={() => navigate("/plan-trip")} className="bg-[#0F3057] hover:bg-[#008080] text-white">
          <Plus className="h-4 w-4 mr-1" /> Plan a New Trip
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by destination..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setPage(1);
            setStatusFilter(v);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-12">Loading your trips...</p>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">You haven't planned any trips yet.</p>
          <Button onClick={() => navigate("/plan-trip")} className="bg-[#0F3057] hover:bg-[#008080] text-white">
            Plan My First Trip
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link to={`/trip/${trip.id}`} className="font-semibold text-[#0F3057] hover:underline">
                    {trip.destination}
                  </Link>
                  <Badge className={STATUS_COLORS[trip.status]} variant="outline">
                    {trip.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-1">
                  {trip.startDate} – {trip.endDate}
                </p>
                <p className="text-xs text-gray-400 mb-4">Created {new Date(trip.createdAt).toLocaleDateString()}</p>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/trip/${trip.id}`)}>
                    Open
                  </Button>
                  {trip.status !== "queued" && trip.status !== "generating" && (
                    <Button size="sm" variant="outline" onClick={() => handleRegenerate(trip.id)}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 ml-auto">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(trip.id)} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500 self-center">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
