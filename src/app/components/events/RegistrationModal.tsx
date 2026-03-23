import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { apiFetch } from "../../../api/client";
import { ExternalLink } from "lucide-react";

interface RegistrationModalProps {
  eventId: string;
  eventName: string;
}

export function RegistrationModal({ eventId, eventName }: RegistrationModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    dietaryRestrictions: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        eventId,
        ...formData,
      };

      const res = await apiFetch('/registrations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("Successfully registered for the event!");
        setOpen(false);
        setFormData({
            name: "",
            email: "",
            phone: "",
            emergencyContact: "",
            dietaryRestrictions: "",
        });
      } else {
        toast.error(res.message || "Failed to register. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-[#0F3057] hover:bg-[#008080] text-white">
          <ExternalLink className="mr-2 h-5 w-5" />
          Register Now
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for {eventName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 00000 00000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
            <Input
              id="emergencyContact"
              type="tel"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="+91 00000 00000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Dietary Restrictions (Optional)</Label>
            <Input
              id="dietaryRestrictions"
              value={formData.dietaryRestrictions}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
              placeholder="e.g. Vegetarian, Jain, Allergies"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#0F3057] hover:bg-[#008080] text-white" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Confirm Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
