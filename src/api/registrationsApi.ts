// src/api/registrationsApi.ts — a signed-in traveler's own event bookings/tickets.
import { userApiFetch } from "./userClient";

export interface MyBooking {
  id: string;
  registrationNumber: string;
  name: string;
  email: string;
  phone: string;
  eventId: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod?: string;
  amount: number;
  registeredAt: string;
}

export async function getMyBookings(): Promise<MyBooking[]> {
  const res = await userApiFetch("/my/registrations");
  return res.data;
}
