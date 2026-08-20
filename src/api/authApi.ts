// src/api/authApi.ts — consumer ("traveler") authentication API calls.
import { userApiFetch } from "./userClient";

export interface TravelerUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  picture?: string | null;
  role: "user";
}

export async function loginWithGoogle(credential: string): Promise<{ token: string; user: TravelerUser }> {
  const res = await userApiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  return { token: res.token, user: res.user };
}

export async function fetchCurrentUser(): Promise<TravelerUser> {
  const res = await userApiFetch("/auth/me");
  return res.user;
}

export async function updateProfile(payload: { name?: string; phone?: string }): Promise<TravelerUser> {
  const res = await userApiFetch("/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await userApiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Logout is stateless (JWT) — ignore network errors, the caller still clears the local token.
  }
}
