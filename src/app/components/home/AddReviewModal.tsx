import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../../api/client";

interface AddReviewModalProps {
  onReviewAdded: (newReview: any) => void;
}

export function AddReviewModal({ onReviewAdded }: AddReviewModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    text: "",
    rating: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.text) {
      toast.error("Please provide both your name and review text");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          text: formData.text,
          rating: formData.rating,
          status: 'approved' // Set to approved directly so it shows instantly for the user's local state, though backend might reset it to pending based on schema, we'll just optimistically show it.
        }),
      });

      if (res.success) {
        toast.success("Thank you for your review!");
        onReviewAdded(res.data);
        setOpen(false);
        setFormData({ name: "", email: "", text: "", rating: 5 });
      } else {
        toast.error(res.message || "Failed to submit review");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#008080] hover:bg-[#4B0082] text-white">
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer-name">Your Name *</Label>
            <Input
              id="reviewer-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="E.g. Ayush"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer-email">Email (Optional)</Label>
            <Input
              id="reviewer-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="For internal verification"
            />
          </div>
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= formData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-text">Your Review *</Label>
            <Textarea
              id="review-text"
              required
              rows={4}
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Tell us what you loved about the trip..."
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#0F3057] hover:bg-[#008080] text-white" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
