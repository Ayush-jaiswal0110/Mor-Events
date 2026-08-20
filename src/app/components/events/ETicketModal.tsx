import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download, Calendar, MapPin, Ticket, ShieldCheck, User } from "lucide-react";
import logoImg from "../../../assets/84eb31f383e3c5c569c8f83a91ad8f1d232586a2.png";
import { MyBooking } from "../../../api/registrationsApi";

interface ETicketModalProps {
  booking: MyBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ETicketModal({ booking, open, onOpenChange }: ETicketModalProps) {
  if (!booking) return null;

  // Generate a clean QR code URL using public QR code API encoding booking details
  const qrData = encodeURIComponent(
    JSON.stringify({
      ticketId: booking.registrationNumber,
      eventId: booking.eventId,
      eventName: booking.eventName,
      eventDate: booking.eventDate || "",
      name: booking.name,
      status: booking.paymentStatus,
    })
  );

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&color=0F3057&bgcolor=ffffff`;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[#0F3057] text-white border-0">
        <DialogHeader className="p-6 bg-gradient-to-r from-[#0F3057] via-[#008080] to-[#4B0082] text-white relative">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Mor Events" className="w-10 h-10 rounded-full border-2 border-white/40" />
            <div>
              <DialogTitle className="text-xl font-bold text-white">Mor Events Official Pass</DialogTitle>
              <p className="text-xs text-white/80">Digital E-Ticket & Entry QR</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-white space-y-6">
          {/* Main Ticket Card */}
          <div className="border-2 border-dashed border-teal-500/40 rounded-2xl p-5 bg-gradient-to-b from-teal-50/50 to-transparent dark:from-teal-950/20 relative">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-[#008080] text-white px-2.5 py-0.5 rounded-full">
                  Confirmed Entry Pass
                </span>
                <h3 className="text-lg font-bold text-[#0F3057] dark:text-white mt-1">
                  {booking.eventName}
                </h3>
              </div>
              <div className="text-right font-mono text-xs font-semibold text-[#008080]">
                {booking.registrationNumber}
              </div>
            </div>

            {/* Participant info rows */}
            <div className="space-y-2 text-xs mb-4">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <User className="w-3.5 h-3.5 text-[#008080] shrink-0" />
                <span className="font-medium">{booking.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-[#008080] shrink-0" />
                <span className="font-semibold text-[#0F3057] dark:text-teal-400">
                  Event Date:&nbsp;
                </span>
                <span className="font-medium">{formatDate(booking.eventDate)}</span>
              </div>
              {booking.eventLocation && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-[#008080] shrink-0" />
                  <span className="font-medium">{booking.eventLocation}</span>
                </div>
              )}
            </div>

            {/* Scannable QR Code */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center my-3 shadow-inner">
              <img
                src={qrImageUrl}
                alt="Ticket Entry QR Code"
                className="w-36 h-36 object-contain"
              />
              <span className="text-[11px] font-mono font-semibold text-gray-500 mt-1">
                {booking.registrationNumber}
              </span>
              <span className="text-[10px] text-gray-400">Scan at Basecamp Check-in</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Booking
              </span>
              <span className="font-semibold text-[#0F3057] dark:text-teal-400">
                ₹{booking.amount || 0} Paid
              </span>
            </div>
          </div>

          <Button
            onClick={handlePrint}
            className="w-full bg-[#0F3057] hover:bg-[#008080] text-white font-bold py-5 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download / Print Ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
