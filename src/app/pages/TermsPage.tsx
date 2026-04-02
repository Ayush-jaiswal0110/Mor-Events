import { useEffect } from "react";
import { Link } from "react-router";

export function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F3057] dark:text-white mb-4">
              Terms & Conditions
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-blue dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-bold text-[#0F3057] dark:text-white border-b pb-2 mb-4">1. Acceptance of Terms</h2>
              <p>
                By registering for, participating in, or attending any event organized by Mor Events ("we", "our", "us"), 
                you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not register for our events.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0F3057] dark:text-white border-b pb-2 mb-4">2. Assumption of Risk & Liability Waiver</h2>
              <p>
                Adventure activities, hiking, trekking, and outdoor events involve inherent risks, including but not limited to 
                physical injury, illness, property damage, or death. By participating:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>You acknowledge that you are voluntarily participating with full knowledge of the inherent risks.</li>
                <li>You confirm you have no underlying medical conditions that would render you unfit for outdoor physical activities.</li>
                <li>You release and forever discharge Mor Events, its organizers, guides, and affiliates from all liability, claims, or demands for personal injury, property damage, or wrongful death arising from your participation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0F3057] dark:text-white border-b pb-2 mb-4">3. Cancellation & Refund Policy</h2>
              <p>
                We understand that plans can change. Our cancellation and refund policy is strictly structured as follows:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>7 Days Prior:</strong> Cancellations made at least 7 days before the event start date are eligible for a <strong>50% refund</strong>.</li>
                <li><strong>48 Hours Prior:</strong> Cancellations made within 48 hours of the event start date are strictly <strong>non-refundable</strong>.</li>
                <li><strong>Contacting Us:</strong> To initiate a cancellation, you must directly process it and also explicitly call our provided contact details to verify the refund process. You will get your payment returned to your original payment method within standard banking timelines after verification.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0F3057] dark:text-white border-b pb-2 mb-4">4. Code of Conduct</h2>
              <p>
                We prioritize safety and community respect. All participants must:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Follow all instructions given by Mor Events guides and leaders without question during the expedition.</li>
                <li>Respect local wildlife, nature trails, and property (Leave No Trace policy).</li>
                <li>Refrain from possessing or consuming alcohol, illegal drugs, or unauthorized substances during the event.</li>
              </ul>
              <p className="mt-2 text-red-600 dark:text-red-400 font-medium">
                Failure to comply may result in immediate expulsion from the event without refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0F3057] dark:text-white border-b pb-2 mb-4">5. Media & Photography</h2>
              <p>
                We often take photographs and record videos during our events for promotional purposes. By attending, you grant 
                Mor Events the irrevocable and unrestricted right to use, publish, and distribute images/videos where you may appear.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#0F3057] dark:text-white border-b pb-2 mb-4">6. Event Modifications</h2>
              <p>
                Mor Events reserves the right to modify the itinerary, postpone, or cancel an event due to unsafe weather conditions, 
                natural disasters, or unforeseen administrative occurrences. In the case of full cancellation by the organizers, 
                participants may be offered a full refund or a ticket transfer to a future comparable event.
              </p>
            </section>
          </div>

          <div className="mt-12 flex justify-center border-t pt-8">
            <Link to="/">
              <button className="px-6 py-2 bg-[#0F3057] hover:bg-[#008080] text-white font-medium rounded-lg transition duration-200">
                Return to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
