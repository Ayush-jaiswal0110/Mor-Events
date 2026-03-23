import { motion } from "motion/react";
import { Shield, Award, DollarSign, Heart, Users } from "lucide-react";
import { Card, CardContent } from "../ui/card";

const features = [
  {
    icon: Shield,
    title: "Safe & Organized Trips",
    description: "Your safety is our priority with professional planning and support.",
  },
  {
    icon: Award,
    title: "Experienced Leadership",
    description: "Led by experienced trekkers and certified fitness professionals.",
  },
  {
    icon: DollarSign,
    title: "Affordable Packages",
    description: "Premium experiences at competitive prices for all budgets.",
  },
  {
    icon: Heart,
    title: "Memorable Experiences",
    description: "Creating lifelong memories and unforgettable adventures.",
  },
  {
    icon: Users,
    title: "Strong Community",
    description: "Join a vibrant community of adventure enthusiasts.",
  },
];

export function WhyChooseSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0F3057] to-[#4B0082] text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose Mor Events?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            We're more than just an event organizer – we're your adventure
            partners committed to creating exceptional experiences.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-white mx-auto mt-4" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
