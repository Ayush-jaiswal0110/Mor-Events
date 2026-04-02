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
import { useState, useCallback, useEffect } from "react";
import { getMediaType, normalizeYouTubeUrl, normalizeInstagramUrl } from "../data/mockData";
import { RegistrationModal } from "../components/events/RegistrationModal";

function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  const paragraphs = text.split("\n");

  return (
    <>
      {paragraphs.map((p, i) => {
        const parts = p.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <p key={i} className="mb-2 last:mb-0 break-words whitespace-pre-wrap overflow-wrap-anywhere">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={j} className="font-bold text-[#0F3057] dark:text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("*") && part.endsWith("*")) {
                return (
                  <strong key={j} className="font-bold text-[#0F3057] dark:text-white">
                    {part.slice(1, -1)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </>
  );
}

function MediaItem({ url, title }: { url: string; title: string }) {
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

  if (type === "instagram") {
    const embedUrl = normalizeInstagramUrl(url);
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-black flex items-center justify-center">
        <iframe
          src={embedUrl}
          className="w-full h-full max-w-[400px] border-none shadow-sm bg-white"
          scrolling="yes"
          allowTransparency
          allow="encrypted-media"
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
    <img src={url} alt={title} className="w-full h-full object-cover" />
  );
}

function MediaCarousel({
  media,
  title,
}: {
  media: { url: string; type: string }[];
  title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  if (media.length === 0) return null;

  return (
    <div className="space-y-3 w-full">
      {/* Main Display */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 w-full">
        <MediaItem url={media[currentIndex].url} title={title} />

        {media.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-10"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all z-10"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {media.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </div>
        )}

        <div className="absolute top-2 left-2">
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
        <div className="flex gap-2 overflow-x-auto pb-1 w-full">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-16 h-11 sm:w-20 sm:h-14 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-2 ring-[#008080] ring-offset-1"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {getMediaType(item.url) !== "image" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
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
        <div className="flex justify-center gap-2 flex-wrap">
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Event Not Found
          </h1>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allMedia = [
    ...event.images.map((url) => ({ url, type: getMediaType(url) })),
    ...(event.videos || []).map((url) => ({ url, type: getMediaType(url) })),
  ];

  const parsedGoogleMapUrl = event.googleMapUrl?.startsWith("<iframe")
    ? event.googleMapUrl.match(/src="([^"]+)"/)?.[1] || event.googleMapUrl
    : event.googleMapUrl;

  const mapEmbedSrc =
    parsedGoogleMapUrl &&
    (parsedGoogleMapUrl.includes("/embed") ||
      parsedGoogleMapUrl.includes("output=embed"))
      ? parsedGoogleMapUrl
      : event.venue
      ? `https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
      : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8">

        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" className="mb-4 sm:mb-6 text-sm">
            <ArrowLeft className="mr-2 h-4 w-4 flex-shrink-0" />
            Back to Events
          </Button>
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden mb-4 sm:mb-6 w-full"
        >
          <img
            src={
              event.images[0] ||
              "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?w=1200"
            }
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
            <div className="p-3 sm:p-5 md:p-8 text-white w-full min-w-0">
              <Badge
                className={`mb-1 sm:mb-3 text-xs ${
                  event.status === "upcoming" ? "bg-green-500" : "bg-gray-500"
                }`}
              >
                {event.status === "upcoming" ? "Upcoming Event" : "Completed"}
              </Badge>
              <h1 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-3 leading-tight break-words">
                {event.name}
              </h1>
              <div className="flex flex-col xs:flex-row flex-wrap gap-1 sm:gap-3 md:gap-5 text-xs sm:text-sm md:text-base">
                <div className="flex items-center gap-1 min-w-0">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(event.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
                <div className="flex items-center gap-0.5 font-bold">
                  <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{event.price.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start">

          {/* ── SIDEBAR (Price / Register) – first on mobile via order ── */}
          <div className="w-full min-w-0 order-first lg:order-last lg:col-span-1">
            <Card className="lg:sticky lg:top-8 shadow-xl border-t-4 border-t-[#008080] w-full">
              <CardContent className="p-4 sm:p-6 space-y-4">

                {/* Price */}
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Price Per Person
                  </p>
                  <div className="flex items-center text-2xl sm:text-3xl font-bold text-[#0F3057] dark:text-white">
                    <IndianRupee className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0" />
                    {event.price.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Register button */}
                {event.status === "upcoming" && (
                  <RegistrationModal eventId={event.id} eventName={event.name} eventPrice={event.price} />
                )}

                {/* Completed notice */}
                {event.status === "completed" && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      This event has been completed
                    </p>
                  </div>
                )}

                {/* What's Included */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm sm:text-base text-[#0F3057] dark:text-white mb-2">
                    What's Included
                  </h3>
                  <ul className="space-y-1.5">
                    {(
                      event.whatsIncluded || [
                        "Professional trek leader",
                        "Transportation from meeting point",
                        "Meals as per itinerary",
                        "First aid kit & safety equipment",
                        "Event completion certificate",
                      ]
                    ).map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                      >
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm sm:text-base text-[#0F3057] dark:text-white mb-2">
                    Contact for Queries
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <a
                      href="tel:+917024896018"
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      📞 <span>+91 7024896018</span>
                    </a>
                    <a
                      href="mailto:moreventsofficial@gmail.com"
                      className="flex items-start gap-2 text-gray-600 dark:text-gray-400 hover:text-[#008080] transition-colors"
                    >
                      ✉️{" "}
                      <span className="break-all">
                        moreventsofficial@gmail.com
                      </span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="w-full min-w-0 order-last lg:order-first lg:col-span-2 space-y-4 sm:space-y-6">

            {/* About */}
            <Card className="w-full overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F3057] dark:text-white mb-3">
                  About This Event
                </h2>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base w-full overflow-hidden">
                  <FormattedText text={event.description} />
                </div>
              </CardContent>
            </Card>

            {/* Itinerary */}
            {event.itinerary && event.itinerary.length > 0 && (
              <Card className="w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F3057] dark:text-white mb-4">
                    Itinerary
                  </h2>
                  <div className="space-y-4">
                    {event.itinerary.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.06 }}
                        className="flex w-full min-w-0"
                      >
                        {/* Day circle + connector */}
                        <div className="flex flex-col items-center mr-3 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F3057] to-[#008080] text-white flex items-center justify-center font-bold text-xs">
                            {item.day}
                          </div>
                          {index !== event.itinerary.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gradient-to-b from-[#008080] to-transparent mt-2 min-h-[20px]" />
                          )}
                        </div>

                        {/* Content – MUST have min-w-0 to shrink in flex */}
                        <div className="flex-1 pb-4 min-w-0 overflow-hidden">
                          <h3 className="font-bold text-sm sm:text-base text-[#0F3057] dark:text-white mb-1 break-words">
                            {item.title}
                          </h3>
                          <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed w-full overflow-hidden break-words">
                            <FormattedText text={item.description} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {allMedia.length > 0 && (
              <Card className="w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F3057] dark:text-white mb-4">
                    Gallery
                    <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      ({event.images.length} photo
                      {event.images.length !== 1 ? "s" : ""}
                      {(event.videos || []).length > 0
                        ? ` + ${(event.videos || []).length} video${(event.videos || []).length !== 1 ? "s" : ""}`
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
              <Card className="w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F3057] dark:text-white">
                      Location
                    </h2>
                    {event.googleMapUrl && (
                      <a
                        href={parsedGoogleMapUrl || event.googleMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-semibold text-[#008080] hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        Open Map <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                      </a>
                    )}
                  </div>
                  <div className="rounded-lg overflow-hidden h-48 sm:h-72 md:h-96 relative bg-gray-200 w-full">
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
        </div>
      </div>
    </div>
  );
}
