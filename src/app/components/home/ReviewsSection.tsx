import { motion } from "motion/react";
import { Card, CardContent } from "../ui/card";
import { Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useState, useEffect } from "react";
import Autoplay from "embla-carousel-autoplay";
import { apiFetch } from "../../../api/client";
import { AddReviewModal } from "./AddReviewModal";

export function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await apiFetch("/reviews");
        if (res.success && res.data) {
          // Filter to only approved reviews, assuming structure has { status: 'approved' }
          const approved = res.data.filter((r: any) => r.status !== 'pending' && r.status !== 'rejected');
          setReviews(approved);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleReviewAdded = (newReview: any) => {
    setReviews(prev => [newReview, ...prev]);
  };

  if (isLoading) {
    return null; // or you could return a loading skeleton here
  }

  return (
    <section id="reviews" className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3057] dark:text-white mb-4">
            What Our Adventurers Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Don't just take our word for it. Hear from those who've experienced
            the magic firsthand.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-[#4B0082] mx-auto mt-4 mb-6" />
          <AddReviewModal onReviewAdded={handleReviewAdded} />
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-4"
                >
                  <Card className="h-full bg-gradient-to-br from-[#0F3057]/5 to-[#008080]/5 dark:from-[#0F3057]/20 dark:to-[#008080]/20 border-none shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex mb-4">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-6 flex-1 italic">
                        "{review.text || review.reviewText || review.comment}"
                      </p>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#008080] to-[#4B0082] flex items-center justify-center text-white font-bold text-lg">
                          {((review.userName || review.name)?.[0] || 'A').toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-[#0F3057] dark:text-white">
                            {review.userName || review.name || "Adventurer"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Verified Traveler
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={scrollPrev}
              className="w-12 h-12 rounded-full bg-[#0F3057] text-white hover:bg-[#008080] transition-colors flex items-center justify-center"
            >
              ←
            </button>
            <button
              onClick={scrollNext}
              className="w-12 h-12 rounded-full bg-[#0F3057] text-white hover:bg-[#008080] transition-colors flex items-center justify-center"
            >
              →
            </button>
          </div>
        </div>
        
        {reviews.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No reviews yet. Be the first to share your experience!
          </div>
        )}
      </div>
    </section>
  );
}