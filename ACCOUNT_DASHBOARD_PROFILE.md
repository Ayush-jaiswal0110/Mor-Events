# Account, Booking Login-Gate, Dashboard & Profile

Extends the Google Sign-In work from `TRIP_PLANNER_IMPLEMENTATION.md`. Read that document first —
this one only covers what changed on top of it: a working Logout button, event booking now
requiring sign-in, a Dashboard that shows a traveler's tickets, and an editable Profile page.

## 1. What changed

1. **Logout** — the nav's account button is now a dropdown (Dashboard / My Trips / Profile /
   Log Out) on desktop, and the same four items inline in the mobile menu. "Log Out" calls the
   existing stateless JWT logout and clears the local session.
2. **Booking now requires sign-in** — previously anyone could fill in the "Register Now" form
   with no account at all. Clicking "Register Now" now checks if a traveler is signed in; if not,
   they're sent to `/login` and returned to the exact event page afterwards. The backend enforces
   this too (not just the button) — the registration-creation and payment endpoints now require a
   valid JWT.
3. **Dashboard** (`/dashboard`) — shows the signed-in traveler's booked events ("My Tickets") plus
   quick links to Plan My Trip and Profile.
4. **Profile** (`/profile`) — lets a traveler edit their name and phone number. Email stays
   read-only (it's the verified Google account email).

## 2. Backend changes

| File | Change |
|---|---|
| `api/google_auth_views.py` | `current_user_view` now handles `PATCH` (name/phone) as well as `GET`. Google login no longer overwrites a name/photo the traveler has already customized on their Profile page — it only fills them in if still unset. `phone` added to the profile response. |
| `api/registrations_views.py` | The `POST` branch of `registrations_list` (creating a booking) is now wrapped in `@login_required`, following the exact same nested-function pattern already used for admin-only writes elsewhere in this file — no new pattern introduced. Every new registration stores `userId` from the signed-in traveler's token. Added `my_registrations_view` (`GET /api/my/registrations`) — a traveler's own bookings, filtered by `userId`. |
| `api/razorpay_views.py` | `create_order` and `verify_payment` (the Razorpay online-payment booking path) now also require `@login_required`, and `verify_payment` stores `userId` on the created registration too — both booking paths (QR-screenshot and Razorpay) are gated consistently. |
| `api/urls.py` | Added `path('my/registrations', registrations_views.my_registrations_view)`. |

**Why registrations created before this change won't show up on Dashboard:** older bookings have
no `userId` field (there was no login at all when they were made), so they can't be reliably
matched to a traveler account — the code deliberately does not guess. This only affects bookings
made before this feature shipped.

**No new "models" or migrations** — same as the trip planner feature, this app stores everything
in MongoDB via PyMongo, so nothing to run beyond what's already documented in
`TRIP_PLANNER_IMPLEMENTATION.md` (`python manage.py setup_trip_indexes`).

## 3. API changes

| Method | Path | Auth | Notes |
|---|---|---|---|
| PATCH | `/api/auth/me` | Bearer (traveler) | Body `{name?, phone?}`. Returns the updated profile. |
| POST | `/api/registrations` | **Now Bearer (traveler)** — was public | Creates a booking; `userId` is taken from the token, not the request body. |
| POST | `/api/payments/create-order` | **Now Bearer (traveler)** — was public | |
| POST | `/api/payments/verify` | **Now Bearer (traveler)** — was public | Registration created here also gets `userId`. |
| GET | `/api/my/registrations` | Bearer (traveler) | The signed-in traveler's own bookings, newest first. |

Everything else (admin login, events, reviews, analytics, etc.) is unchanged.

## 4. Frontend changes

- `src/app/context/AuthContext.tsx` — added `refreshUser()` and `updateProfile()`.
- `src/api/authApi.ts` — added `updateProfile()`; `TravelerUser` now includes `phone`.
- `src/api/registrationsApi.ts` (new) — `getMyBookings()`.
- `src/app/layouts/MainLayout.tsx` — account button is now a `DropdownMenu` (desktop) / inline
  links (mobile) with Dashboard, My Trips, Profile, and Log Out.
- `src/app/components/events/RegistrationModal.tsx` — the "Register Now" button no longer opens
  the dialog directly. It checks `useAuth().isAuthenticated` first; if signed out, it shows a
  toast and navigates to `/login` with the current page remembered so the traveler lands back on
  the same event after signing in. Once open, the form is prefilled from the traveler's profile
  (name/email/phone), and every API call in this component now goes through the consumer client
  (`userClient.ts`) instead of the admin one, so the traveler's own Bearer token is sent.
- `src/app/pages/DashboardPage.tsx` (new) — `/dashboard`, ticket list from `getMyBookings()`.
- `src/app/pages/ProfilePage.tsx` (new) — `/profile`, edit name/phone.
- `src/app/routes.tsx` — added `/dashboard` and `/profile`, both wrapped in the existing
  `RequireAuth` guard.

## 5. Manual verification checklist

Since I couldn't run the app in this session (see `TRIP_PLANNER_IMPLEMENTATION.md` §"Known
limitations" for why), please walk through this once locally:

1. Sign out (or open a private window) and go to an event page → click "Register Now" → you
   should land on `/login`, not the booking form.
2. Sign in with Google → you should be returned to that same event page, and "Register Now" now
   opens the form with your name/email prefilled.
3. Complete a booking (either QR-screenshot or Razorpay) → go to `/dashboard` → the booking
   should appear under "My Tickets".
4. Go to `/profile`, change your name/phone, save → refresh the page → the change should persist.
5. Open the account dropdown in the nav → "Log Out" → you should be signed out and the nav should
   show "Sign In" again.
6. Confirm the admin login at `/admin` still works exactly as before — nothing here should have
   touched it.
