import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  IndianRupee,
  Image as ImageIcon,
  Video,
  ListOrdered,
  X,
  Info,
  Link as LinkIcon,
} from "lucide-react";
import { useEvents } from "../../context/EventsContext";
import { Event, ItineraryItem, getMediaType, normalizeYouTubeUrl } from "../../data/mockData";
import { toast } from "sonner";
import { apiFetch } from "../../../api/client";

interface FormData {
  name: string;
  description: string;
  venue: string;
  date: string;
  price: string;
  shortDescription: string;
  status: "upcoming" | "completed";
  googleMapUrl: string;
  registrationLink: string;
  whatsIncluded: string[];
  images: string[];
  videos: string[];
  itinerary: ItineraryItem[];
}

const defaultForm: FormData = {
  name: "",
  description: "",
  venue: "",
  date: "",
  price: "",
  shortDescription: "",
  status: "upcoming",
  googleMapUrl: "",
  registrationLink: "",
  whatsIncluded: [
    "Professional trek leader",
    "Transportation from meeting point",
    "Meals as per itinerary",
    "First aid kit & safety equipment",
    "Event completion certificate",
  ],
  images: [""],
  videos: [],
  itinerary: [{ day: 1, title: "", description: "" }],
};

// Media Preview component
function MediaPreview({ url }: { url: string }) {
  if (!url.trim()) return null;
  const type = getMediaType(url);

  if (type === "youtube") {
    const embed = normalizeYouTubeUrl(url);
    return (
      <div className="mt-2 rounded-lg overflow-hidden aspect-video">
        <iframe
          src={embed}
          className="w-full h-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video preview"
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="mt-2 rounded-lg overflow-hidden">
        <video src={url} className="w-full max-h-40 object-cover" controls />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Preview"
      className="mt-2 w-full h-24 object-cover rounded-lg"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export function ManageEvents() {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [activeTab, setActiveTab] = useState("basic");

  // --- Form helpers ---
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Images
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    // Using toast.promise or just toast for quick feedback
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("type", "event");

    const toastId = toast.loading("Uploading image...");
    try {
      const res = await apiFetch("/upload/image", {
        method: "POST",
        body: uploadData, // the client removes content-type automatically for FormData
      });
      if (res.success) {
        toast.success("Image uploaded successfully", { id: toastId });
        updateField("images", [...formData.images, res.data.url]);
      }
    } catch (error) {
      toast.error("Failed to upload image", { id: toastId });
    }
  };

  const removeImage = (i: number) =>
    updateField("images", formData.images.filter((_, idx) => idx !== i));
  const updateImage = (i: number, val: string) => {
    const arr = [...formData.images];
    arr[i] = val;
    updateField("images", arr);
  };

  // Videos
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append("file", file);

    const toastId = toast.loading("Uploading video (this may take a moment)...");
    try {
      const res = await apiFetch("/upload/video", {
        method: "POST",
        body: uploadData,
      });
      if (res.success) {
        toast.success("Video uploaded successfully", { id: toastId });
        updateField("videos", [...formData.videos, res.data.url]);
      }
    } catch (error) {
      toast.error("Failed to upload video", { id: toastId });
    }
  };

  const removeVideo = (i: number) =>
    updateField("videos", formData.videos.filter((_, idx) => idx !== i));
  const updateVideo = (i: number, val: string) => {
    const arr = [...formData.videos];
    arr[i] = val;
    updateField("videos", arr);
  };

  // Itinerary
  const addItineraryItem = () => {
    const maxDay = formData.itinerary.reduce((m, item) => Math.max(m, item.day), 0);
    updateField("itinerary", [
      ...formData.itinerary,
      { day: maxDay + 1, title: "", description: "" },
    ]);
  };
  const removeItineraryItem = (i: number) =>
    updateField("itinerary", formData.itinerary.filter((_, idx) => idx !== i));
  const updateItineraryItem = (i: number, field: keyof ItineraryItem, val: string | number) => {
    const arr = [...formData.itinerary];
    arr[i] = { ...arr[i], [field]: field === "day" ? Number(val) : val };
    updateField("itinerary", arr);
  };

  // Whats Included
  const addIncluded = () => updateField("whatsIncluded", [...formData.whatsIncluded, ""]);
  const removeIncluded = (i: number) =>
    updateField("whatsIncluded", formData.whatsIncluded.filter((_, idx) => idx !== i));
  const updateIncluded = (i: number, val: string) => {
    const arr = [...formData.whatsIncluded];
    arr[i] = val;
    updateField("whatsIncluded", arr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedImages = formData.images.filter((u) => u.trim() !== "");
    const cleanedVideos = formData.videos.filter((u) => u.trim() !== "");
    const cleanedItinerary = formData.itinerary.filter(
      (item) => item.title.trim() !== ""
    );
    const cleanedIncluded = formData.whatsIncluded.filter((u) => u.trim() !== "");

    if (!formData.name.trim()) {
      toast.error("Event name is required");
      setActiveTab("basic");
      return;
    }

    const eventPayload: Omit<Event, "id"> = {
      name: formData.name,
      description: formData.description,
      venue: formData.venue,
      date: formData.date,
      price: parseFloat(formData.price) || 0,
      shortDescription: formData.shortDescription,
      status: formData.status,
      googleMapUrl: formData.googleMapUrl || undefined,
      registrationLink: formData.registrationLink || undefined,
      whatsIncluded: cleanedIncluded,
      images: cleanedImages,
      videos: cleanedVideos,
      itinerary: cleanedItinerary,
    };

    if (editingEvent) {
      updateEvent({ ...eventPayload, id: editingEvent.id });
      toast.success("Event updated successfully!");
    } else {
      addEvent(eventPayload);
      toast.success("Event created successfully!");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingEvent(null);
    setActiveTab("basic");
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      venue: event.venue,
      date: event.date,
      price: event.price.toString(),
      shortDescription: event.shortDescription,
      status: event.status,
      googleMapUrl: event.googleMapUrl || "",
      registrationLink: event.registrationLink || "",
      whatsIncluded: event.whatsIncluded || [
        "Professional trek leader",
        "Transportation from meeting point",
        "Meals as per itinerary",
        "First aid kit & safety equipment",
        "Event completion certificate",
      ],
      images: event.images.length > 0 ? event.images : [""],
      videos: event.videos || [],
      itinerary: event.itinerary.length > 0
        ? event.itinerary
        : [{ day: 1, title: "", description: "" }],
    });
    setActiveTab("basic");
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEvent(id);
      toast.success("Event deleted successfully!");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3057] dark:text-white mb-2">
            Manage Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, edit, and manage your events with photos, videos & itinerary
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#0F3057] hover:bg-[#008080] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-xl font-bold text-[#0F3057] dark:text-white">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid grid-cols-4 w-full mb-6">
                  <TabsTrigger value="basic" className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Basic Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Media</span>
                  </TabsTrigger>
                  <TabsTrigger value="itinerary" className="flex items-center gap-1">
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Itinerary</span>
                  </TabsTrigger>
                  <TabsTrigger value="extras" className="flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Extras</span>
                  </TabsTrigger>
                </TabsList>

                {/* ── TAB 1: BASIC INFO ── */}
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Ralamandal Trek"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Short Description *</Label>
                    <Input
                      id="shortDescription"
                      placeholder="One-line summary shown on event cards"
                      value={formData.shortDescription}
                      onChange={(e) => updateField("shortDescription", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed description of the event..."
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue *</Label>
                      <Input
                        id="venue"
                        placeholder="Location name"
                        value={formData.venue}
                        onChange={(e) => updateField("venue", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => updateField("date", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Person (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="e.g. 799"
                        value={formData.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        required
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v: "upcoming" | "completed") =>
                          updateField("status", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">
                            🟢 Upcoming
                          </SelectItem>
                          <SelectItem value="completed">
                            ⚫ Completed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("media")}
                      className="bg-[#0F3057] hover:bg-[#008080] text-white"
                    >
                      Next: Media →
                    </Button>
                  </div>
                </TabsContent>

                {/* ── TAB 2: MEDIA ── */}
                <TabsContent value="media" className="space-y-6 mt-0">
                  {/* Images Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#008080]" />
                        Photos
                        <Badge variant="secondary">{formData.images.filter(u => u.trim()).length}</Badge>
                      </Label>
                      <div>
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Label
                          htmlFor="imageUpload"
                          className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Upload Photo
                        </Label>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload direct photos from your device. First image is used as the cover.
                    </p>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {formData.images.map((url, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-6 text-center">
                              {i + 1}
                            </span>
                            <Input
                              value={url}
                              onChange={(e) => updateImage(i, e.target.value)}
                              placeholder="https://example.com/photo.jpg"
                              className="flex-1 text-sm"
                            />
                            {i === 0 && (
                              <Badge variant="secondary" className="text-xs px-1.5 flex-shrink-0">
                                Cover
                              </Badge>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {url.trim() && (
                            <div className="ml-8">
                              <MediaPreview url={url} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <input
                        type="file"
                        id="imageUploadBottom"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Label
                        htmlFor="imageUploadBottom"
                        className="w-full flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-500 hover:border-[#008080] hover:text-[#008080] bg-transparent h-10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Another Photo
                      </Label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    {/* Videos Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base flex items-center gap-2">
                          <Video className="w-4 h-4 text-red-500" />
                          Videos
                          <Badge variant="secondary">{formData.videos.filter(u => u.trim()).length}</Badge>
                        </Label>
                        <div>
                          <input
                            type="file"
                            id="videoUpload"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideoUpload}
                          />
                          <Label
                            htmlFor="videoUpload"
                            className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Upload Video
                          </Label>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload direct MP4 or WEBM video files directly from your computer.
                      </p>

                      {formData.videos.length === 0 ? (
                        <div>
                          <Label
                            htmlFor="videoUpload"
                            className="block cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-red-400 transition-colors"
                          >
                            <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No videos added yet
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Click here to select and upload a video
                            </p>
                          </Label>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                          {formData.videos.map((url, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-6 text-center">
                                  {i + 1}
                                </span>
                                <Input
                                  value={url}
                                  onChange={(e) => updateVideo(i, e.target.value)}
                                  placeholder="https://youtube.com/watch?v=... or .mp4 URL"
                                  className="flex-1 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeVideo(i)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {url.trim() && (
                                <div className="ml-8">
                                  <MediaPreview url={url} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("basic")}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("itinerary")}
                      className="bg-[#0F3057] hover:bg-[#008080] text-white"
                    >
                      Next: Itinerary →
                    </Button>
                  </div>
                </TabsContent>

                {/* ── TAB 3: ITINERARY ── */}
                <TabsContent value="itinerary" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-[#008080]" />
                        Itinerary Steps
                        <Badge variant="secondary">{formData.itinerary.length}</Badge>
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add day-by-day schedule. Each step shows as a numbered item in the event details.
                      </p>
                    </div>
                  </div>

                  {/* Quick Day add buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          updateField("itinerary", [
                            ...formData.itinerary,
                            { day, title: "", description: "" },
                          ])
                        }
                      >
                        + Day {day}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {formData.itinerary.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                        <ListOrdered className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No itinerary steps added yet
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Use the day buttons above to add steps
                        </p>
                      </div>
                    ) : (
                      formData.itinerary.map((item, i) => (
                        <div
                          key={i}
                          className="relative border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/50"
                        >
                          {/* Header row */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F3057] to-[#008080] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {item.day}
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-xs text-gray-500">Day</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={item.day}
                                  onChange={(e) =>
                                    updateItineraryItem(i, "day", e.target.value)
                                  }
                                  className="w-16 h-8 text-sm text-center"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-gray-500">Step Title *</Label>
                              <Input
                                value={item.title}
                                onChange={(e) =>
                                  updateItineraryItem(i, "title", e.target.value)
                                }
                                placeholder="e.g. Early Morning Departure"
                                className="h-9 text-sm mt-0.5"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItineraryItem(i)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 mt-4 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Description */}
                          <div>
                            <Label className="text-xs text-gray-500">Description</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) =>
                                updateItineraryItem(i, "description", e.target.value)
                              }
                              placeholder="What happens in this step? Include timings, activities, etc."
                              rows={2}
                              className="text-sm mt-0.5 resize-none"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-500 hover:border-[#008080] hover:text-[#008080]"
                    onClick={addItineraryItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Itinerary Step
                  </Button>

                  <div className="flex justify-between pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("media")}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("extras")}
                      className="bg-[#0F3057] hover:bg-[#008080] text-white"
                    >
                      Next: Extras →
                    </Button>
                  </div>
                </TabsContent>

                {/* ── TAB 4: EXTRAS ── */}
                <TabsContent value="extras" className="space-y-6 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="registrationLink">Registration Link (Google Form / URL)</Label>
                    <Input
                      id="registrationLink"
                      type="url"
                      placeholder="https://forms.gle/..."
                      value={formData.registrationLink}
                      onChange={(e) => updateField("registrationLink", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Shown on event detail page for upcoming events as "Register Now" button.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleMapUrl">Google Maps Embed URL</Label>
                    <Input
                      id="googleMapUrl"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      value={formData.googleMapUrl}
                      onChange={(e) => updateField("googleMapUrl", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Go to Google Maps → Share → Embed a map → copy the src URL from the iframe code.
                    </p>
                  </div>

                  {/* What's Included */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">What's Included</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIncluded}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.whatsIncluded.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-green-500 text-sm">✓</span>
                          <Input
                            value={item}
                            onChange={(e) => updateIncluded(i, e.target.value)}
                            placeholder="e.g. Professional trek leader"
                            className="flex-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeIncluded(i)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("itinerary")}
                    >
                      ← Back
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setIsDialogOpen(false); resetForm(); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#0F3057] hover:bg-[#008080] text-white px-8"
                      >
                        {editingEvent ? "✓ Update Event" : "✓ Create Event"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No events yet</p>
          <p className="text-sm mt-1">Click "Add New Event" to create your first event</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={
                    event.images[0] ||
                    "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?w=800"
                  }
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <Badge
                  className={`absolute top-3 right-3 ${
                    event.status === "upcoming" ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  {event.status === "upcoming" ? "Upcoming" : "Completed"}
                </Badge>
                {/* Media count badges */}
                <div className="absolute bottom-3 left-3 flex gap-1">
                  {event.images.length > 0 && (
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <ImageIcon className="w-3 h-3" />
                      {event.images.length}
                    </span>
                  )}
                  {(event.videos || []).length > 0 && (
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <Video className="w-3 h-3" />
                      {(event.videos || []).length}
                    </span>
                  )}
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-[#0F3057] dark:text-white line-clamp-1">
                  {event.name}
                </h3>
                <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#008080] flex-shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#008080] flex-shrink-0" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-[#0F3057] dark:text-white">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span>{event.price.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Itinerary count */}
                {event.itinerary.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    <ListOrdered className="inline w-3 h-3 mr-1" />
                    {event.itinerary.length} itinerary steps
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:border-[#008080] hover:text-[#008080]"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}