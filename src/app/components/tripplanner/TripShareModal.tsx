import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { shareTripByEmail, createShareLink } from "../../../api/tripApi";

export function TripShareModal({
  tripId,
  open,
  onOpenChange,
}: {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailIsValid) {
      setError("Enter a valid recipient email address");
      return;
    }
    setError(null);
    try {
      setIsSending(true);
      await shareTripByEmail(tripId, { recipientEmail, recipientName: recipientName || undefined, message: message || undefined });
      toast.success("Trip shared! The email is on its way.");
      onOpenChange(false);
      setRecipientEmail("");
      setRecipientName("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Couldn't share this trip right now.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      setIsCreatingLink(true);
      const { shareUrl } = await createShareLink(tripId);
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (err: any) {
      toast.error(err.message || "Couldn't create a share link right now.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this trip</DialogTitle>
          <DialogDescription>
            Send the itinerary to a friend by email, or copy a shareable link. Only the itinerary is
            visible to whoever opens it — your account details stay private.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="friend@example.com"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea id="message" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleCopyLink} disabled={isCreatingLink} className="w-full sm:w-auto">
              {isCreatingLink ? "Creating link..." : "Copy Share Link"}
            </Button>
            <Button type="submit" disabled={isSending} className="w-full sm:w-auto bg-[#0F3057] hover:bg-[#008080] text-white">
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
