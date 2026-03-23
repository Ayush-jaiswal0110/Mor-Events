import { motion } from "motion/react";
import { Link } from "react-router";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, MapPin, IndianRupee } from "lucide-react";
import { useEvents } from "../../context/EventsContext";

export function EventsSection() {
  const { events } = useEvents();

  return (
    <section id="events" className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3057] dark:text-white mb-4">
            Our Events
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join us on our next adventure. Explore breathtaking destinations and
            create memories that last a lifetime.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-[#4B0082] mx-auto mt-4" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.images[0] || "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?w=800"}
                    alt={event.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <Badge
                    className={`absolute top-4 right-4 ${
                      event.status === "upcoming"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {event.status === "upcoming" ? "Upcoming" : "Completed"}
                  </Badge>
                </div>
                <CardHeader>
                  <h3 className="text-xl font-bold text-[#0F3057] dark:text-white">
                    {event.name}
                  </h3>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {event.shortDescription}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4 mr-2 text-[#008080]" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 mr-2 text-[#008080]" />
                      <span>
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-[#0F3057] dark:text-white">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      <span>{event.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={`/event/${event.id}`} className="w-full">
                    <Button className="w-full bg-[#0F3057] hover:bg-[#008080] text-white">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
