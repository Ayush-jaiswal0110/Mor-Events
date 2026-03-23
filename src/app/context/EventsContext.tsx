import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Event } from "../data/mockData";
import { apiFetch } from "../../api/client";
import { toast } from "sonner"; // If sonner is used, typical in this app stack

interface EventsContextType {
  events: Event[];
  addEvent: (event: Omit<Event, "id">) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  upcomingEvents: Event[];
  completedEvents: Event[];
  refreshEvents: () => Promise<void>;
  isLoading: boolean;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/events?limit=100');
      if (res.success) {
        setEvents(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const addEvent = async (eventData: Omit<Event, "id">) => {
    try {
      const res = await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      if (res.success) {
        setEvents((prev) => [res.data, ...prev]);
        toast.success("Event created successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
      throw error;
    }
  };

  const updateEvent = async (event: Event) => {
    try {
      const { id, ...updateData } = event;
      const res = await apiFetch(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      if (res.success) {
        setEvents((prev) => prev.map((e) => (e.id === id ? res.data : e)));
        toast.success("Event updated successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update event");
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiFetch(`/events/${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
      throw error;
    }
  };

  const getEventById = (id: string) => events.find((e) => e.id === id);

  const upcomingEvents = events.filter((e) => e.status === "upcoming");
  const completedEvents = events.filter((e) => e.status === "completed");

  return (
    <EventsContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventById,
        upcomingEvents,
        completedEvents,
        refreshEvents,
        isLoading
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
}
