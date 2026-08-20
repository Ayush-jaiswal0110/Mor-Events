import { motion } from "motion/react";
import { Link } from "react-router";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, MapPin, IndianRupee } from "lucide-react";
import { useEvents } from "../../context/EventsContext";

export function EventsSection() {
  const { events } = useEvents();

  const sortedEvents = [...events].sort((a, b) => {
    if (a.status === "upcoming" && b.status !== "upcoming") return -1;
    if (a.status !== "upcoming" && b.status === "upcoming") return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Determine if an event is newly added (e.g. status upcoming or recent date)
  const isNewEvent = (eventDateStr: string, status: string) => {
    if (status !== "upcoming") return false;
    const eventTime = new Date(eventDateStr).getTime();
    const now = new Date().getTime();
    // Upcoming event within next 60 days is considered new/featured
    return eventTime >= now;
  };

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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
            ✨ Discover Upcoming Trips & Events
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F3057] dark:text-white mb-4">
            Upcoming & Featured Events
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join us on our next adventure. Explore breathtaking destinations, register early to lock your spot, and create memories that last a lifetime.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#008080] to-[#4B0082] mx-auto mt-4" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {sortedEvents.map((event, index) => {
            const isNew = isNewEvent(event.date, event.status);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col ${isNew ? 'ring-2 ring-teal-500/50 dark:ring-teal-400/40 shadow-lg' : ''}`}>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={event.images[0] || "https://images.unsplash.com/photo-1701518256995-22cfc9f499f1?w=800"}
                      alt={event.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {isNew && (
                        <span className="bg-gradient-to-r from-amber-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse uppercase tracking-wider">
                          🔥 NEW EVENT
                        </span>
                      )}
                    </div>

                    <Badge
                      className={`absolute top-4 right-4 ${
                        event.status === "upcoming"
                          ? "bg-green-600 text-white"
                          : "bg-gray-500 text-white"
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
                  <CardFooter className="gap-2">
                    <Link to={`/event/${event.id}`} className="w-full">
                      <Button className="w-full bg-[#0F3057] hover:bg-[#008080] text-white">
                        {event.status === "upcoming" ? "Register & Details" : "View Details"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
