import { useParams, Link } from "react-router";
import { useEvents } from "../context/EventsContext";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  MapPin,
  IndianRupee,
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useCallback } from "react";
import { getMediaType, normalizeYouTubeUrl } from "../data/mockData";
import { RegistrationModal } from "../components/events/RegistrationModal";

function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  const paragraphs = text.split('\n');
  
  return (
    <>
      {paragraphs.map((p, i) => {
        // Simple regex: split by **text** or *text* and keep the delimiter
        const parts = p.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <p key={i} className="mb-2 last:mb-0">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-[#0F3057] dark:text-white">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return <strong key={j} className="font-bold text-[#0F3057] dark:text-white">{part.slice(1, -1)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </>
  );
}

function MediaItem({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const type = getMediaType(url);

  if (type === "youtube") {
    const embedUrl = normalizeYouTubeUrl(url);
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        className="w-full h-full object-cover"
        controls
        playsInline
      />
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className="w-full h-full object-cover"
    />
  );
}

function MediaCarousel({ media, title }: { media: { url: string; type: string }[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  if (media.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Main Display */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
        <MediaItem url={media[currentIndex].url} title={title} />

        {/* Navigation */}
        {media.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter */}
        {media.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-3 left-3">
          {getMediaType(media[currentIndex].url) !== "image" ? (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Play className="w-3 h-3 fill-white" /> VIDEO
            </span>
          ) : (
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
              <ImageIcon className="w-3 h-3" /> PHOTO
            </span>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-2 ring-[#008080] ring-offset-1"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {getMediaType(item.url) !== "image" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={`${title} - ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Dot indicators */}
      {media.length > 1 && (
        <div className="flex justify-center gap-2">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all rounded-full ${
                index === currentIndex
                  ? "w-6 h-2 bg-[#008080]"
                  : "w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-[#008080]/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const { getEventById } = useEvents();
  const event = getEventById(id || "");

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Event Not Found
          </h1>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Combine all media (images + videos)
  const allMedia = [
    ...event.images.map((url) => ({ url, type: getMediaType(url) })),
    ...(event.videos || []).map((url) => ({ url, type: getMediaType(url) })),
  ];

  const parsedGoogleMapUrl = event.googleMapUrl?.startsWith("<iframe") 
    ? event.googleMapUrl.match(/src="([^"]+)"/)?.[1] || event.googleMapUrl 
    : event.googleMapUrl;

  // Render a safe embed URL. If the URL they provided does not contain '/embed' or 'output=embed', generate one dynamically based on the venue.
  const mapEmbedSrc = parsedGoogleMapUrl && (parsedGoogleMapUrl.includes('/embed') || parsedGoogleMapUrl.includes('output=embed')) 
    ? parsedGoogleMapUrl 
    : event.venue ? `https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=13&ie=UTF8&iwloc=&output=embed` : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-80 md:h-96 rounded-2xl overflow-hidden mb-8"
        >
          <img
            src={event.images[0] || "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?w=1200"}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-6 md:p-8 text-white w-full">
              <Badge
                className={`mb-4 ${
                  event.status === "upcoming" ? "bg-green-500" : "bg-gray-500"
                }`}
              >
                {event.status === "upcoming" ? "Upcoming Event" : "Completed"}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {event.name}
              </h1>
              <div className="flex flex-wrap gap-4 md:gap-6 text-sm md:text-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  {new Date(event.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center font-bold">
                  <IndianRupee className="h-4 w-4 md:h-5 md:w-5 mr-1" />
                  {event.price.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#0F3057] dark:text-white mb-4">
                  About This Event
                </h2>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <FormattedText text={event.description} />
                </div>
              </CardContent>
            </Card>

            {/* Itinerary */}
            {event.itinerary && event.itinerary.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-[#0F3057] dark:text-white mb-6">
                    Itinerary
                  </h2>
                  <div className="space-y-6">
                    {event.itinerary.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                        className="flex"
                      >
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F3057] to-[#008080] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {item.day}
                          </div>
                          {index !== event.itinerary.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gradient-to-b from-[#008080] to-transparent mt-2 min-h-[24px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-bold text-lg text-[#0F3057] dark:text-white mb-2">
                            {item.title}
                          </h3>
                          <div className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                            <FormattedText text={item.description} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media Gallery (Carousel) */}
            {allMedia.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-[#0F3057] dark:text-white mb-6">
                    Gallery
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-3">
                      ({event.images.length} photos{" "}
                      {(event.videos || []).length > 0
                        ? `+ ${(event.videos || []).length} videos`
                        : ""}
                      )
                    </span>
                  </h2>
                  <MediaCarousel media={allMedia} title={event.name} />
                </CardContent>
              </Card>
            )}

            {/* Map */}
            {mapEmbedSrc && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0F3057] dark:text-white">
                      Location
                    </h2>
                    {event.googleMapUrl && (
                      <a href={parsedGoogleMapUrl || event.googleMapUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#008080] hover:underline flex items-center gap-1">
                        Open Map <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="rounded-lg overflow-hidden h-80 md:h-96 relative bg-gray-200">
                    <iframe
                      src={mapEmbedSrc}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Event location map"
                      className="absolute inset-0"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-8 shadow-xl border-t-4 border-t-[#008080]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Price Per Person
                  </p>
                  <div className="flex items-center text-3xl font-bold text-[#0F3057] dark:text-white">
                    <IndianRupee className="h-8 w-8" />
                    {event.price.toLocaleString("en-IN")}
                  </div>
                </div>

                {event.status === "upcoming" && (
                  <RegistrationModal eventId={event.id} eventName={event.name} />
                )}

                {event.status === "completed" && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This event has been completed
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <h3 className="font-bold text-[#0F3057] dark:text-white">
                    What's Included
                  </h3>
                  <ul className="space-y-2">
                    {(event.whatsIncluded || [
                      "Professional trek leader",
                      "Transportation from meeting point",
                      "Meals as per itinerary",
                      "First aid kit & safety equipment",
                      "Event completion certificate",
                    ]).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start text-sm text-gray-600 dark:text-gray-400"
                      >
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-[#0F3057] dark:text-white mb-3">
                    Contact for Queries
                  </h3>
                  <div className="space-y-2 text-sm">
                    <a
                      href="tel:+917024896018"
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#008080] dark:hover:text-[#008080] transition-colors"
                    >
                      📞 +91 7024896018
                    </a>
                    <a
                      href="mailto:moreventsofficial@gmail.com"
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#008080] dark:hover:text-[#008080] transition-colors"
                    >
                      ✉️ moreventsofficial@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
