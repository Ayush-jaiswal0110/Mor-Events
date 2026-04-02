import { motion } from "motion/react";
import founderImg from "../../../assets/eed6de649ee2eaf43e252e2b9f2c3a7137b4cbb7.png";

export function AboutSection() {
  return (
    <section
      id="about"
      className="py-20 bg-gray-50 dark:bg-gray-900"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3057] dark:text-white mb-4">
            About Mor Events
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-[#4B0082] mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#008080] to-[#4B0082] rounded-2xl blur-xl opacity-30" />
              <img
                src={founderImg}
                alt="Ayush Jaiswal - Founder"
                className="relative rounded-2xl shadow-2xl w-full max-w-md h-auto object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold text-[#0F3057] dark:text-white">
              Meet Our Founder
            </h3>
            <div className="space-y-2">
              <h4 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Ayush Jaiswal
              </h4>
              <p className="text-lg text-[#008080] dark:text-[#00A0A0]">
                Founder & Travel Event Director
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OC Head - Yoga and Fitness Club, IIPS DAVV
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Associate Software Developer @ Reqpedia
              </p>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Founded by Ayush Jaiswal, Mor Events is a travel and
              adventure-based event company organizing treks, trips, and
              experiential journeys across India. We believe in creating
              unforgettable memories while promoting fitness, wellness, and a
              love for nature.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Our collaboration with the Yoga and Fitness Club of IIPS DAVV
              ensures that every adventure combines physical challenge with
              mindfulness and community building.
            </p>
            <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                "Adventure is not outside, it is within. Let's discover it
                together."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
