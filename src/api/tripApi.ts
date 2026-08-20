// src/api/tripApi.ts — typed wrappers around the Plan My Trip backend endpoints.
import { userApiFetch, publicApiFetch } from "./userClient";
import type { Trip, TripFormValues, TripShare } from "../app/types/trip";

export interface Paginated<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export async function createTrip(values: Partial<TripFormValues>): Promise<Trip> {
  const res = await userApiFetch("/trips", { method: "POST", body: JSON.stringify(values) });
  return res.data;
}

export async function listTrips(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
} = {}): Promise<Paginated<Trip>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, String(v));
  });
  const res = await userApiFetch(`/trips?${query.toString()}`);
  return { data: res.data, pagination: res.pagination };
}

export async function getTrip(id: string): Promise<Trip> {
  const res = await userApiFetch(`/trips/${id}`);
  return res.data;
}

export async function updateTrip(id: string, values: Partial<TripFormValues>): Promise<Trip> {
  const res = await userApiFetch(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(values) });
  return res.data;
}

export async function deleteTrip(id: string): Promise<void> {
  await userApiFetch(`/trips/${id}`, { method: "DELETE" });
}

export async function generateTrip(id: string): Promise<void> {
  await userApiFetch(`/trips/${id}/generate`, { method: "POST" });
}

export async function regenerateTrip(id: string): Promise<void> {
  await userApiFetch(`/trips/${id}/regenerate`, { method: "POST" });
}

export interface TripStatusResponse {
  status: Trip["status"];
  generationError: string | null;
  generationVersion: number;
  needsRegeneration: boolean;
}

export async function getTripStatus(id: string): Promise<TripStatusResponse> {
  const res = await userApiFetch(`/trips/${id}/status`);
  return res.data;
}

export async function shareTripByEmail(
  id: string,
  payload: { recipientEmail: string; recipientName?: string; message?: string }
): Promise<{ id: string; shareUrl: string; status: string }> {
  const res = await userApiFetch(`/trips/${id}/share`, { method: "POST", body: JSON.stringify(payload) });
  return res.data;
}

export async function createShareLink(id: string): Promise<{ id: string; shareUrl: string }> {
  const res = await userApiFetch(`/trips/${id}/share-link`, { method: "POST" });
  return res.data;
}

export async function listTripShares(id: string): Promise<TripShare[]> {
  const res = await userApiFetch(`/trips/${id}/shares`);
  return res.data;
}

export async function revokeTripShare(tripId: string, shareId: string): Promise<void> {
  await userApiFetch(`/trips/${tripId}/shares/${shareId}/revoke`, { method: "POST" });
}

export async function getSharedTrip(token: string): Promise<Partial<Trip>> {
  const res = await publicApiFetch(`/shared-trips/${token}`);
  return res.data;
}
