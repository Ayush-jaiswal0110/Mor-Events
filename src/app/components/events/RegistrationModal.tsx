import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { apiFetch } from "../../../api/client";
import { ExternalLink, CreditCard, UploadCloud, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import paymentQr from "../../../assets/payment_qr.png";

interface RegistrationModalProps {
  eventId: string;
  eventName: string;
  eventPrice?: number;
}

export function RegistrationModal({ eventId, eventName, eventPrice }: RegistrationModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [viewingTerms, setViewingTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    dietaryRestrictions: "",
    paymentMethod: "qr",
    paymentScreenshot: "",
    acceptTerms: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      toast.error("You must accept the Terms and Conditions to proceed.");
      return;
    }
    setStep(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading screenshot...");

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      // NOTE: the client automatically handles FormData without Content-Type
      const res = await apiFetch("/upload/payment-screenshot", {
        method: "POST",
        body: uploadData,
      });

      if (res.success && res.data?.url) {
        toast.success("Screenshot uploaded!", { id: toastId });
        setFormData({ ...formData, paymentScreenshot: res.data.url, paymentMethod: "qr" });
      } else {
        toast.error("Failed to upload screenshot.", { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload.", { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input value so the same file can be selected again if needed
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        eventId,
        ...formData,
      };

      const res = await apiFetch("/registrations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("Successfully registered!");
        setShowSuccess(true);
      } else {
        toast.error(res.message || "Failed to register. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!eventPrice) {
      toast.error("Event price is not available.");
      return;
    }

    setIsSubmitting(true);
    const orderToastId = toast.loading("Initializing secure checkout...");

    try {
      const orderRes = await apiFetch("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: eventPrice })
      });

      if (!orderRes.success) {
        toast.error(orderRes.message || "Failed to initialize payment", { id: orderToastId });
        setIsSubmitting(false);
        return;
      }

      toast.dismiss(orderToastId);

      const options = {
        key: orderRes.keyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "MorEvents",
        description: `Registration for ${eventName}`,
        order_id: orderRes.data.id,
        handler: async function (response: any) {
          toast.loading("Verifying payment...", { id: "verify-toast" });
          const verifyPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            registrationData: { eventId, ...formData }
          };

          try {
            const verifyRes = await apiFetch("/payments/verify", {
              method: "POST",
              body: JSON.stringify(verifyPayload)
            });

            if (verifyRes.success) {
              toast.success("Payment successful!", { id: "verify-toast" });
              setShowSuccess(true);
            } else {
              toast.error(verifyRes.message || "Payment verification failed. Contact support.", { id: "verify-toast" });
            }
          } catch (err: any) {
            toast.error("Network error during verification.", { id: "verify-toast" });
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#0F3057"
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
        setIsSubmitting(false);
      });
      rzp.open();

    } catch (error: any) {
      toast.error(error.message || "Something went wrong.", { id: orderToastId });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        // give it time to animate out before resetting step layout if they re-open
        setTimeout(() => setStep(1), 300);
      }
    }}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-[#0F3057] hover:bg-[#008080] text-white">
          <ExternalLink className="mr-2 h-5 w-5" />
          Register Now
        </Button>
      </DialogTrigger>

      {/* Dynamic max-width based on step */}
      <DialogContent className={`transition-all duration-300 ${step === 2 || showSuccess ? 'sm:max-w-[500px]' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {(!showSuccess) && (step === 2 || viewingTerms) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-2 -ml-2 rounded-full"
                onClick={() => viewingTerms ? setViewingTerms(false) : setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {showSuccess ? "Registration Complete" : viewingTerms ? "Terms & Conditions" : `Register for ${eventName}`}
          </DialogTitle>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#0F3057] dark:text-white">Registration Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please check your mail. You will receive your event ticket and confirmation mail shortly.
            </p>
            <Button
              className="w-full mt-6 bg-[#0F3057] hover:bg-[#008080] text-white"
              onClick={() => {
                setShowSuccess(false);
                setOpen(false);
                setStep(1);
                setFormData({ name: "", email: "", phone: "", emergencyContact: "", dietaryRestrictions: "", paymentMethod: "qr", paymentScreenshot: "", acceptTerms: false });
                window.location.href = '/';
              }}
            >
              OK
            </Button>
          </div>
        ) : viewingTerms ? (
          <div className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="text-sm space-y-4 text-gray-700 dark:text-gray-300">
              <p>By registering for our events, you agree strictly to the following terms:</p>
              <div>
                <h4 className="font-bold text-[#0F3057] dark:text-gray-100">1. Assumption of Risk</h4>
                <p>Adventure events inherently involve risk of injury. You voluntarily participate at your own risk and discharge Mor Events from liability.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#0F3057] dark:text-gray-100">2. Cancellation & Refunds</h4>
                <p>7 Days Prior: 50% refund.</p>
                <p>48 Hours Prior: Strictly non-refundable.</p>
                <p>You must reach out via call directly to process refunds through authorized verified banking channels.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#0F3057] dark:text-gray-100">3. Code of Conduct</h4>
                <p>Participants must maintain eco-friendly behaviors (Leave No Trace) and strictly refrain from substance abuse. Event leaders hold the right to expel participants for misconduct.</p>
              </div>
              <div>
                <h4 className="font-bold text-[#0F3057] dark:text-gray-100">4. Modifications</h4>
                <p>Organizers reserve right to cancel or postpone the event due to natural variables (weather) with proper future crediting mechanisms.</p>
              </div>
            </div>
            <Button
              className="w-full mt-6 bg-[#0F3057] text-white hover:bg-[#008080]"
              onClick={() => {
                setFormData({ ...formData, acceptTerms: true });
                setViewingTerms(false);
              }}
            >
              I Understand & Accept
            </Button>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4 mt-4">
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

            <div className="flex items-start space-x-3 pt-2 pb-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 flex-shrink-0 w-4 h-4 text-[#0F3057] bg-gray-100 border-gray-300 rounded cursor-pointer"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              />
              <Label htmlFor="terms" className="text-sm font-normal text-gray-600 dark:text-gray-300 cursor-pointer">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setViewingTerms(true)}
                  className="text-[#3399cc] hover:text-[#008080] hover:underline font-bold transition-colors"
                >
                  Terms & Conditions
                </button>
                *
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0F3057] hover:bg-[#008080] text-white"
            >
              Proceed to Payment
            </Button>
          </form>
        ) : (
          <div className="space-y-6 mt-4">

            {/* Amount / Razorpay area */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center">
              {eventPrice !== undefined && <p className="text-sm text-gray-500 mb-1">Total Amount: <span className="font-bold text-lg text-[#0F3057] dark:text-white">₹{eventPrice}</span></p>}

              <div className="w-full">
                <Button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={isSubmitting}
                  className="w-full bg-[#3399cc] hover:bg-[#2b88b7] text-white"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now via Razorpay
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></span>
                <span>OR PAY VIA UPI</span>
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-md font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
                AYUSH JAISWAL
              </h3>
              <div className="w-48 h-48 bg-gray-100 rounded-lg p-2 overflow-hidden border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-1">
                <img
                  src={paymentQr}
                  alt="PhonePe QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Scan using any UPI app (PhonePe, GPay, Paytm)
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-3">
              <Label>Payment Verification</Label>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-dashed border-2 hover:border-[#008080] hover:text-[#008080] transition-colors"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : formData.paymentScreenshot ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <UploadCloud className="w-4 h-4 mr-2" />
                  )}
                  {formData.paymentScreenshot ? "Screenshot Uploaded" : "Upload Screenshot"}
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-[#0F3057] hover:bg-[#008080] text-white"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading || !formData.paymentScreenshot}
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>

            {!formData.paymentScreenshot && (
              <p className="text-xs text-center text-orange-500">
                Please upload payment screenshot to submit.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
