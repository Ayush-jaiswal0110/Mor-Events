import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { toast } from "sonner";
import { Share2, Pencil, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { TripStatusIndicator } from "../components/tripplanner/TripStatusIndicator";
import { ItineraryTimeline } from "../components/tripplanner/ItineraryTimeline";
import { TripShareModal } from "../components/tripplanner/TripShareModal";
import { TripPlannerForm } from "../components/tripplanner/TripPlannerForm";
import {
  getTrip, getTripStatus, deleteTrip, generateTrip, regenerateTrip, updateTrip,
} from "../../api/tripApi";
import type { Trip, TripFormValues } from "../types/trip";

const POLL_INTERVAL_MS = 4000;

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTrip(id);
      setTrip(data);
      return data;
    } catch (err: any) {
      toast.error(err.message || "Couldn't load this trip.");
      navigate("/my-trips");
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    if (!id || !trip) return;
    const isActive = trip.status === "queued" || trip.status === "generating";
    if (!isActive) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const s = await getTripStatus(id);
        if (s.status !== trip.status) {
          loadTrip();
        }
      } catch {
        // transient — keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, trip?.status]);

  if (isLoading || !trip) {
    return <div className="min-h-[50vh] flex items-center justify-center text-gray-500">Loading trip...</div>;
  }

  const handleRetry = async () => {
    try {
      await generateTrip(trip.id);
      toast.success("Generating your itinerary again...");
      loadTrip();
    } catch (err: any) {
      toast.error(err.message || "Couldn't restart generation.");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateTrip(trip.id);
      toast.success("Regenerating your itinerary — your current plan will stay until it's ready.");
      loadTrip();
    } catch (err: any) {
      toast.error(err.message || "Couldn't regenerate this trip.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTrip(trip.id);
      toast.success("Trip deleted");
      navigate("/my-trips");
    } catch (err: any) {
      toast.error(err.message || "Couldn't delete this trip.");
    }
  };

  const handleEditSave = async (values: TripFormValues) => {
    try {
      setIsSavingEdit(true);
      await updateTrip(trip.id, values);
      toast.success("Trip details updated");
      setEditOpen(false);
      loadTrip();
    } catch (err: any) {
      toast.error(err.message || "Couldn't save your changes.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const isActive = trip.status === "queued" || trip.status === "generating";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/my-trips" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0F3057] mb-4">
        <ArrowLeft className="h-4 w-4" /> My Trips
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F3057]">{trip.destination}</h1>
          <p className="text-gray-500 mt-1">
            {trip.startDate} – {trip.endDate} · {trip.travelersCount} traveler{trip.travelersCount > 1 ? "s" : ""} ·{" "}
            {trip.travelType} · {trip.budgetType}
          </p>
          {trip.summary && <p className="text-gray-600 mt-2 max-w-2xl">{trip.summary}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isActive}>
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate this itinerary?</AlertDialogTitle>
                <AlertDialogDescription>
                  We'll build a new plan for your current trip details. Your existing itinerary stays visible
                  until the new one is ready, and stays untouched if generation fails.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>Regenerate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            disabled={trip.status !== "completed"}
          >
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {trip.needsRegeneration && trip.status === "completed" && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You've changed trip details since this itinerary was generated — it may no longer match. Use
          "Regenerate" above to refresh it.
        </div>
      )}

      {isActive || trip.status === "failed" ? (
        <TripStatusIndicator status={trip.status} error={trip.generationError} onRetry={handleRetry} />
      ) : (
        <ItineraryTimeline
          days={trip.itineraryDays}
          importantNotes={trip.importantNotes}
          estimatedTotalCost={trip.estimatedTotalCost}
          placesVerified={trip.placesVerified}
        />
      )}

      <TripShareModal tripId={trip.id} open={shareOpen} onOpenChange={setShareOpen} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Trip Details</DialogTitle>
          </DialogHeader>
          <TripPlannerForm
            initialValues={trip}
            submitLabel="Save Changes"
            isSubmitting={isSavingEdit}
            onSubmit={handleEditSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
