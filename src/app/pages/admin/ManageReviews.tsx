import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Search,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "../../../api/client";
import { toast } from "sonner";

interface Review {
  id: string;
  userName: string;
  eventId?: string;
  eventName?: string;
  rating: number;
  text: string;
  status: "pending_approval" | "approved" | "rejected";
  verified: boolean;
  createdAt: string;
  image?: string;
}

type StatusFilter = "all" | "pending_approval" | "approved" | "rejected";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_approval: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-200 dark:text-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

export function ManageReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/reviews?limit=100");
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateStatus = async (reviewId: string, newStatus: "approved" | "rejected") => {
    setUpdatingIds((prev) => new Set(prev).add(reviewId));
    try {
      await apiFetch(`/reviews/${reviewId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
      toast.success(
        newStatus === "approved"
          ? "Review approved — it will now appear on the landing page!"
          : "Review rejected and hidden from the landing page."
      );
    } catch {
      toast.error("Failed to update review status. Please try again.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    setUpdatingIds((prev) => new Set(prev).add(reviewId));
    try {
      await apiFetch(`/reviews/${reviewId}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted permanently.");
    } catch {
      toast.error("Failed to delete review.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  // Derived filtered list
  const filtered = reviews.filter((r) => {
    const matchesStatus = activeFilter === "all" || r.status === activeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      r.userName?.toLowerCase().includes(query) ||
      r.text?.toLowerCase().includes(query) ||
      r.eventName?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: reviews.length,
    pending_approval: reviews.filter((r) => r.status === "pending_approval").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const tabs: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: "all", label: "All", count: counts.all, color: "text-gray-600 dark:text-gray-400" },
    { key: "pending_approval", label: "Pending", count: counts.pending_approval, color: "text-yellow-600" },
    { key: "approved", label: "Approved", count: counts.approved, color: "text-green-600" },
    { key: "rejected", label: "Rejected", count: counts.rejected, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3057] dark:text-white mb-1">
            Manage Reviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Approve reviews to show them on the landing page, or reject/delete unwanted ones.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchReviews}
          disabled={isLoading}
          className="flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: counts.all, bg: "bg-blue-50 dark:bg-blue-900/20", icon: <MessageSquare className="w-5 h-5 text-blue-500" /> },
          { label: "Pending", value: counts.pending_approval, bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: <Clock className="w-5 h-5 text-yellow-500" /> },
          { label: "Approved", value: counts.approved, bg: "bg-green-50 dark:bg-green-900/20", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
          { label: "Rejected", value: counts.rejected, bg: "bg-red-50 dark:bg-red-900/20", icon: <XCircle className="w-5 h-5 text-red-500" /> },
        ].map((stat) => (
          <Card key={stat.label} className={`${stat.bg} border-none`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-[#0F3057] dark:text-white">{stat.value}</p>
              </div>
              {stat.icon}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === tab.key
                  ? "bg-white dark:bg-gray-700 shadow text-[#0F3057] dark:text-white"
                  : `${tab.color} hover:bg-white/50 dark:hover:bg-gray-700/50`
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeFilter === tab.key
                    ? "bg-[#0F3057] text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {searchQuery
                ? "No reviews match your search."
                : activeFilter === "all"
                ? "No reviews submitted yet."
                : `No ${activeFilter.replace("_", " ")} reviews.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((review) => {
            const statusInfo = STATUS_LABELS[review.status] || STATUS_LABELS["pending_approval"];
            const isBusy = updatingIds.has(review.id);

            return (
              <Card
                key={review.id}
                className={`border transition-all hover:shadow-md ${
                  review.status === "approved"
                    ? "border-green-200 dark:border-green-900"
                    : review.status === "rejected"
                    ? "border-red-200 dark:border-red-900 opacity-75"
                    : "border-yellow-200 dark:border-yellow-900"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-[#4B0082] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(review.userName?.[0] || "A").toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#0F3057] dark:text-white">
                              {review.userName || "Anonymous"}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                            {review.verified && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} />
                            {review.eventName && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {review.eventName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Review text */}
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic mb-4">
                        "{review.text}"
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {review.status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(review.id, "approved")}
                            disabled={isBusy}
                            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                        )}
                        {review.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(review.id, "rejected")}
                            disabled={isBusy}
                            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        )}
                        {review.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(review.id, "rejected")}
                            disabled={isBusy}
                            className="border-gray-300 text-gray-600 hover:bg-gray-50 gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Unpublish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteReview(review.id)}
                          disabled={isBusy}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1.5 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Landing page note */}
      {counts.approved > 0 && (
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">
            <strong>{counts.approved} review{counts.approved !== 1 ? "s" : ""}</strong> currently visible on the landing page.
            {counts.pending_approval > 0 && (
              <> <strong>{counts.pending_approval} pending</strong> review{counts.pending_approval !== 1 ? "s" : ""} await{counts.pending_approval === 1 ? "s" : ""} your approval.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
