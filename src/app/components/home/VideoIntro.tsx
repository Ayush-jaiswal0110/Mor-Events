import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, SkipForward, Play, Pause } from "lucide-react";
import introVideo from "../../../assets/mor_event_into.mp4";

interface VideoIntroProps {
  onComplete: () => void;
}

export function VideoIntro({ onComplete }: VideoIntroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Disable scrolling when intro is playing
    document.body.style.overflow = "hidden";
    
    // Play video automatically
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or video error:", err);
      });
    }

    return () => {
      // Re-enable scrolling on cleanup
      document.body.style.overflow = "";
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 8;
      setProgress((current / duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    handleExit();
  };

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 800); // Allow exit animations to finish
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.05,
            filter: "blur(10px)"
          }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden select-none"
        >
          {/* Subtle ambient light behind video */}
          <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-purple-900/5 to-transparent pointer-events-none" />

          {/* Loading spinner */}
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black z-10">
              <div className="w-12 h-12 border-4 border-t-teal-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
              <p className="text-white/60 text-sm font-medium tracking-widest uppercase animate-pulse">
                Mor Events
              </p>
            </div>
          )}

          {/* Main Video Element */}
          <video
            ref={videoRef}
            src={introVideo}
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onCanPlay={() => setIsLoaded(true)}
            onClick={togglePlay}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } cursor-pointer`}
          />

          {/* Bottom Gradient overlay for controls readability */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          {/* Top Gradient overlay for brand title */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Glassmorphic Brand Banner top-left */}
          <div className="absolute top-6 left-6 flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wider uppercase">
              Mor Events • Cinematic Intro
            </span>
          </div>

          {/* Control Bar & Actions */}
          <div className="absolute bottom-8 left-6 right-6 flex flex-col gap-4">
            
            {/* Elegant Cinematic Progress Bar */}
            <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 via-[#0F3057] to-purple-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              {/* Playback Controls & Volume */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/15 hover:bg-white/20 text-white transition-all transform hover:scale-105"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/15 hover:bg-white/20 text-white transition-all transform hover:scale-105 flex items-center gap-2"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-white/70" />
                      <span className="text-[10px] text-white/50 pr-1 uppercase hidden md:inline">Click for Sound</span>
                    </>
                  ) : (
                    <Volume2 className="w-4 h-4 text-teal-400 animate-bounce" />
                  )}
                </button>
              </div>

              {/* Glowing Skip CTA Button */}
              <button
                onClick={handleExit}
                className="flex items-center gap-2 pl-5 pr-4 py-2.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/25 hover:border-white/30 text-white text-sm font-semibold tracking-wider transition-all transform hover:scale-[1.03] group shadow-lg hover:shadow-teal-500/20"
              >
                <span>Skip Intro</span>
                <SkipForward className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
