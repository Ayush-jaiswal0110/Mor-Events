import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, CreditCard, UploadCloud, Loader2, Sparkles, UserCheck, ShieldCheck, MapPin, Calendar, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { userApiFetch as apiFetch } from "../../api/userClient";
import paymentQr from "../../assets/payment_qr.png";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";

export function EventRegistrationPage() {
  const { id } = useParams();
  const { getEventById } = useEvents();
  const event = getEventById(id || "");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "male",
    city: "",
    emergencyContact: "",
    dietaryRestrictions: "",
    acceptTerms: false,
    paymentMethod: "qr",
    paymentScreenshot: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto pre-fill from user profile
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  // Handle step 1 submission
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setStep(2);
  };

  // Handle step 2 submission (Terms)
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      toast.error("You must accept the Terms and Conditions to proceed.");
      return;
    }
    setStep(3);
  };

  // Screenshot Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading payment screenshot...");

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await apiFetch("/upload/payment-screenshot", {
        method: "POST",
        body: uploadData,
      });

      if (res.success && res.data?.url) {
        toast.success("Screenshot uploaded!", { id: toastId });
        setFormData((prev) => ({ ...prev, paymentScreenshot: res.data.url, paymentMethod: "qr" }));
      } else {
        toast.error("Failed to upload screenshot.", { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Complete Registration Submit Handler
  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        eventId: event.id,
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

  // Razorpay Gateway Handler
  const handleRazorpayPayment = async () => {
    if (!event.price) {
      toast.error("Event price is missing.");
      return;
    }

    setIsSubmitting(true);
    const orderToastId = toast.loading("Initializing secure payment...");

    try {
      const orderRes = await apiFetch("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: event.price }),
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
        description: `Registration for ${event.name}`,
        order_id: orderRes.data.id,
        handler: async function (response: any) {
          toast.loading("Verifying payment...", { id: "verify-toast" });
          const verifyPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            registrationData: { eventId: event.id, ...formData },
          };

          try {
            const verifyRes = await apiFetch("/payments/verify", {
              method: "POST",
              body: JSON.stringify(verifyPayload),
            });

            if (verifyRes.success) {
              toast.success("Payment successful!", { id: "verify-toast" });
              setShowSuccess(true);
            } else {
              toast.error(verifyRes.message || "Payment verification failed.", { id: "verify-toast" });
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
          contact: formData.phone,
        },
        theme: {
          color: "#0F3057",
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to={`/event/${event.id}`}>
          <Button variant="ghost" className="mb-6 text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event Details
          </Button>
        </Link>

        {/* Event Summary Card Header */}
        <Card className="mb-8 border-l-4 border-l-[#008080] shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-600 dark:text-teal-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Event Registration
              </div>
              <h1 className="text-2xl font-bold text-[#0F3057] dark:text-white">{event.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#008080]" /> {event.venue}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-[#008080]" /> {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Total Amount</span>
              <span className="text-2xl font-bold text-[#0F3057] dark:text-white flex items-center justify-end">
                <IndianRupee className="w-5 h-5" /> {event.price.toLocaleString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* If user is NOT signed in, require authentication first */}
        {!isAuthenticated ? (
          <Card className="shadow-lg border-teal-500/20 text-center py-10 px-6">
            <CardContent className="space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/50 rounded-full flex items-center justify-center mx-auto text-[#008080]">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0F3057] dark:text-white mb-2">
                  Sign In to Register for Event
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  To register for <strong>{event.name}</strong>, please sign in or create an account with Google. This lets us send your event tickets and updates directly to your email!
                </p>
              </div>

              <div className="pt-4 flex flex-col items-center justify-center">
                <GoogleSignInButton onSuccess={() => toast.success("Successfully signed in!")} />
              </div>
            </CardContent>
          </Card>
        ) : showSuccess ? (
          /* Registration Success State */
          <Card className="shadow-xl text-center py-12 px-6">
            <CardContent className="space-y-6 max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#0F3057] dark:text-white mb-2">
                  Registration Successful! 🎉
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  We have received your registration for <strong>{event.name}</strong>. Your confirmation email and event ticket are on their way!
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="bg-[#0F3057] hover:bg-[#008080] text-white" onClick={() => navigate("/dashboard")}>
                  Go to My Dashboard & Tickets
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Multi-Step Registration Form */
          <Card className="shadow-lg">
            {/* Step Progress Bar */}
            <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-[#0F3057] text-white' : 'bg-teal-600 text-white'}`}>1</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Personal Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-[#0F3057] text-white' : step > 2 ? 'bg-teal-600 text-white' : 'bg-gray-300 dark:bg-gray-800 text-gray-600'}`}>2</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Terms</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-[#0F3057] text-white' : 'bg-gray-300 dark:bg-gray-800 text-gray-600'}`}>3</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Payment</span>
              </div>
            </div>

            <CardContent className="p-6">
              {step === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <h3 className="text-lg font-bold text-[#0F3057] dark:text-white mb-4">Step 1: Participant Information</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
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
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min="10"
                        max="90"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g. 24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City / Hometown</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Indore, Bhopal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact (Phone)</Label>
                      <Input
                        id="emergencyContact"
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="dietaryRestrictions">Special Notes / Medical / Dietary (Optional)</Label>
                    <Input
                      id="dietaryRestrictions"
                      value={formData.dietaryRestrictions}
                      onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                      placeholder="e.g. Veg / Jain food, minor asthma, etc."
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full bg-[#0F3057] hover:bg-[#008080] text-white">
                      Proceed to Terms & Conditions
                    </Button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleStep2Submit} className="space-y-4">
                  <h3 className="text-lg font-bold text-[#0F3057] dark:text-white mb-2">Step 2: Terms & Conditions</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-4 max-h-60 overflow-y-auto text-sm space-y-3 text-gray-700 dark:text-gray-300">
                    <p className="font-semibold text-[#0F3057] dark:text-white">Rules & Guidelines for {event.name}:</p>
                    <p>1. <strong>Safety First:</strong> Participants must follow all instructions given by event coordinators and trek leaders at all times.</p>
                    <p>2. <strong>Environmental Ethics:</strong> Zero littering policy. All plastic/trash must be carried back.</p>
                    <p>3. <strong>Cancellation Policy:</strong> Cancellations made 7 days prior are eligible for 50% refund. Cancellations within 48 hours are non-refundable.</p>
                    <p>4. <strong>Health Declaration:</strong> Ensure you are physically fit for outdoor trek activities.</p>
                  </div>

                  <div className="flex items-start space-x-3 pt-3">
                    <input
                      type="checkbox"
                      id="termsCheck"
                      required
                      className="mt-1 w-4 h-4 text-[#0F3057] cursor-pointer"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    />
                    <Label htmlFor="termsCheck" className="text-sm cursor-pointer leading-normal">
                      I have read and agree to all the Terms, Safety Rules & Conditions for <strong>{event.name}</strong>.
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3">
                      Back
                    </Button>
                    <Button type="submit" className="w-2/3 bg-[#0F3057] hover:bg-[#008080] text-white">
                      Proceed to Payment
                    </Button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-[#0F3057] dark:text-white">Step 3: Complete Payment</h3>

                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">Amount Payable</p>
                    <p className="text-3xl font-extrabold text-[#0F3057] dark:text-white">₹{event.price.toLocaleString("en-IN")}</p>

                    <div className="mt-4">
                      <Button
                        type="button"
                        onClick={handleRazorpayPayment}
                        disabled={isSubmitting}
                        className="w-full bg-[#3399cc] hover:bg-[#2b88b7] text-white font-bold"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Online via Razorpay
                      </Button>
                    </div>

                    <div className="my-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
                      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                      <span>OR PAY VIA UPI QR</span>
                      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>

                  {/* QR Scanner */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-black rounded-xl border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                      Scan UPI QR Code (PhonePe / GPay / Paytm)
                    </h4>
                    <div className="w-44 h-44 bg-gray-100 p-2 rounded-lg border flex items-center justify-center">
                      <img src={paymentQr} alt="Payment QR" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Upload Screenshot */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Upload Payment Screenshot *</Label>
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
                      className="w-full border-dashed border-2 hover:border-[#008080]"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : formData.paymentScreenshot ? (
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      ) : (
                        <UploadCloud className="w-4 h-4 mr-2" />
                      )}
                      {formData.paymentScreenshot ? "Payment Screenshot Uploaded ✅" : "Click to Upload Screenshot"}
                    </Button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3">
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmitRegistration}
                      disabled={isSubmitting || isUploading || !formData.paymentScreenshot}
                      className="w-2/3 bg-[#0F3057] hover:bg-[#008080] text-white font-bold"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Registration"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
