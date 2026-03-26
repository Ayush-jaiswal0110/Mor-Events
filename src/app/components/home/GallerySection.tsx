import { motion } from "motion/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Image as ImageIcon, X } from "lucide-react";
import { useEvents } from "../../context/EventsContext";
import { getMediaType, normalizeYouTubeUrl } from "../../data/mockData";

interface MediaItem {
  url: string;
  type: "image" | "youtube" | "video" | "instagram";
  eventName: string;
  eventDate: string;
}

function MediaSlide({ item, isActive }: { item: MediaItem; isActive: boolean }) {
  if (item.type === "youtube") {
    const embedUrl = normalizeYouTubeUrl(item.url);
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {isActive ? (
          <iframe
            src={`${embedUrl}&autoplay=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.eventName}
          />
        ) : (
          <div className="w-full h-full bg-black/80 flex items-center justify-center">
            <Play className="w-16 h-16 text-white/60" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Play className="w-3 h-3 fill-white" />
            VIDEO
          </span>
        </div>
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
          src={item.url}
          className="w-full h-full object-cover"
          controls={isActive}
          playsInline
        />
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Play className="w-3 h-3 fill-white" />
            VIDEO
          </span>
        </div>
      </div>
    );
  }

  if (item.type === "instagram") {
    const embedUrl = item.url.split('?')[0].replace(/\/$/, '') + '/embed';
    return (
      <div className="relative w-full h-full bg-[#FAFAFA] flex items-center justify-center p-4">
        <iframe
          src={embedUrl}
          className="w-full h-full max-w-[400px] border-none shadow-sm rounded-md"
          scrolling="no"
          allowTransparency
        />
        <div className="absolute top-3 left-3">
          <span className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            INSTAGRAM
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={item.url}
      alt={item.eventName}
      className="w-full h-full object-cover"
    />
  );
}

export function GallerySection() {
  const { completedEvents } = useEvents();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Collect all media from completed events
  const allMedia: MediaItem[] = completedEvents.flatMap((event) => [
    ...event.images.map((url) => ({
      url,
      type: getMediaType(url) as "image" | "youtube" | "video" | "instagram",
      eventName: event.name,
      eventDate: event.date,
    })),
    ...(event.videos || []).map((url) => ({
      url,
      type: getMediaType(url) as "image" | "youtube" | "video" | "instagram",
      eventName: event.name,
      eventDate: event.date,
    })),
  ]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  }, [allMedia.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  }, [allMedia.length]);

  useEffect(() => {
    if (allMedia.length === 0) return;
    if (isHovered) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }
    autoPlayRef.current = setInterval(() => {
      goNext();
    }, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isHovered, goNext, allMedia.length]);

  if (allMedia.length === 0) {
    return (
      <section id="gallery" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-[#0F3057] dark:text-white mb-4">
            Previous Events Gallery
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            No media available yet. Complete events will show their gallery here.
          </p>
        </div>
      </section>
    );
  }

  const current = allMedia[currentIndex];

  return (
    <section id="gallery" className="py-12 sm:py-20 bg-gray-900 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Previous Events Gallery
          </h2>
          <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto px-2">
            Relive the memories from our past adventures. Every journey tells a story.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-[#4B0082] mx-auto mt-4" />
        </motion.div>

        {/* Main Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Slide */}
          <div
            className="relative h-[280px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
            onClick={() => setLightboxItem(current)}
          >
            <MediaSlide item={current} isActive={true} />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Event info */}
            <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 text-white pointer-events-none">
              <p className="text-xs sm:text-sm text-white/70 mb-1">
                {new Date(current.eventDate).toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h3 className="text-base sm:text-2xl font-bold leading-snug">{current.eventName}</h3>
              <div className="flex items-center gap-2 mt-1">
                {current.type !== "image" ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-red-400">
                    <Play className="w-3 h-3 fill-current" /> Video
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-blue-300">
                    <ImageIcon className="w-3 h-3" /> Photo
                  </span>
                )}
                <span className="text-white/50 text-xs sm:text-sm">
                  {currentIndex + 1} / {allMedia.length}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {allMedia.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
            <motion.div
              key={currentIndex}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: isHovered ? 0 : 5, ease: "linear" }}
              className="h-full bg-gradient-to-r from-[#008080] to-[#4B0082]"
            />
          </div>
        </motion.div>

        {/* Thumbnails */}
        {allMedia.length > 1 && (
          <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 overflow-x-auto pb-2 max-w-5xl mx-auto scrollbar-thin">
            {allMedia.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-14 h-10 sm:w-20 sm:h-14 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-[#008080] ring-offset-2 ring-offset-gray-900 scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {item.type !== "image" && item.type !== "instagram" ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                  </div>
                ) : item.type === "instagram" ? (
                  <div className="w-full h-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.eventName}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Dot indicators */}
        {allMedia.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all rounded-full ${
                  index === currentIndex
                    ? "w-8 h-2 bg-[#008080]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
            onClick={() => setLightboxItem(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="max-w-4xl w-full max-h-[90vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxItem.type !== "image" ? (
              <div className="aspect-video">
                <MediaSlide item={lightboxItem} isActive={true} />
              </div>
            ) : (
              <img
                src={lightboxItem.url}
                alt={lightboxItem.eventName}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            <div className="bg-gray-900 px-6 py-3 text-white">
              <p className="font-semibold">{lightboxItem.eventName}</p>
              <p className="text-sm text-gray-400">
                {new Date(lightboxItem.eventDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
