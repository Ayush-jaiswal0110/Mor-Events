# Plan My Trip — AI Personalized Trip Planner

Implementation notes for the AI trip-planning feature added to the existing Mor Events codebase.
This document assumes you're already familiar with `README.md` / `SETUP_GUIDE.md`.

## 1. Feature overview

Signed-in travelers can:

- Sign in / sign up with Google ("Continue with Google").
- Fill in a trip form (destination, dates, travelers, travel type, budget, interests, food
  preferences, pace, and more optional details).
- Get a day-wise AI-generated itinerary (attractions, breakfast/lunch/dinner, travel time,
  rest/free time, estimated costs, and important notes).
- See real generation status while it's being built (no fake progress bar).
- Save trips to their account, view them later ("My Trips"), edit details, and regenerate the
  itinerary without losing the last good one if regeneration fails.
- Share a trip with a friend by email, or copy a plain shareable link — both are revocable and
  only ever expose the itinerary, never the owner's account info.

## 2. How this fits the existing architecture — read this first

Before writing any code, the actual codebase was inspected (not assumed). Two things are
important for anyone maintaining this feature:

1. **The Django backend does not use the Django ORM for data.** `backend_core/settings.py`
   configures `DATABASES` with a dummy sqlite3 file purely so `django.contrib.admin`/`auth`
   don't crash — every real collection (`events`, `registrations`, `reviews`, `members`, and now
   `users`, `trips`, `trip_shares`, `rate_limits`) lives in MongoDB Atlas via raw PyMongo
   (`Backend/api/database.py`). There is one Django app (`api`) with topic-named view files
   wired manually into `Backend/api/urls.py` — no serializers, no viewsets, no routers anywhere
   in this project. The trip planner code follows that exact pattern rather than introducing a
   second, disconnected database just for this feature.
2. **There is no Celery/Redis/task-queue infrastructure.** The existing async pattern in this
   codebase (see `registrations_views.py`) is a plain daemon `threading.Thread` used to send
   confirmation emails without blocking the request. Itinerary generation reuses that same
   pattern (`Backend/api/services/trip_background.py`) instead of adding new infrastructure that
   can't be installed/verified without Redis being available.
3. **There was no consumer/traveler login before this feature** — only a single hardcoded admin
   login (`Backend/api/auth_views.py`, custom PyJWT). Google Sign-In is new, but it reuses the
   exact same JWT scheme (`generate_token`/`decode_token`/`login_required` in `Backend/api/utils.py`)
   so the rest of the app's auth plumbing works unchanged for both admin and traveler sessions.
   `google-auth`/`google-auth-oauthlib` were already listed in `requirements.txt` and already
   installed in the project's venv, even though nothing used them yet — this feature is what
   they were staged for.

### "Migrations" in a Mongo-first app

Since there's no Django ORM, there's nothing for `makemigrations`/`migrate` to do for this
feature. The equivalent step is an idempotent management command:

```bash
python manage.py setup_trip_indexes
```

This creates the MongoDB indexes the feature relies on (unique `shareToken`, unique
`googleSub`/`email` on users, etc.) and is safe to run repeatedly.

## 3. User flow

1. Visitor clicks "Plan My Trip" in the main nav.
2. If not signed in, they're sent to `/login`, sign in with Google, and are returned to
   `/plan-trip` automatically (`RequireAuth` + `LoginPage`'s `from` state).
3. They fill in the trip form and submit → `POST /api/trips` creates the trip (`status: queued`)
   and starts background generation → the browser is redirected to `/trip/:id`.
4. `/trip/:id` polls `GET /api/trips/:id/status` every few seconds while `queued`/`generating`,
   showing rotating "Finding the best places...", etc. copy, then renders the itinerary once
   `completed` (or a safe error + retry button if `failed`).
5. From there they can edit details, regenerate, share by email/link, or delete the trip.
6. `/my-trips` lists all their trips with search/status filter/pagination.
7. A recipient of a shared link opens `/shared-trip/:token` — a public page, no login required,
   showing only the itinerary (never the owner's identity).

## 4. Backend implementation

All new/changed files are under `Backend/api/`:

| File | Purpose |
|---|---|
| `database.py` (edited) | Added `users_collection`, `trips_collection`, `trip_shares_collection`, `rate_limits_collection`. |
| `trip_utils.py` | Validation (Phase 4 rules), ID/token generation, Mongo-backed rate limiter, safe error messages. |
| `google_auth_views.py` | `POST /api/auth/google`, `GET /api/auth/me` — consumer Google Sign-In. |
| `trip_views.py` | Trip CRUD + generate/regenerate/status endpoints, ownership checks. |
| `trip_share_views.py` | Email share, share-link, list/revoke shares, public shared-trip view. |
| `email_utils.py` (edited) | Added `send_trip_share_email` using the exact same SMTP pattern as the existing registration emails. |
| `services/ai_provider.py` | Provider-agnostic AI call (OpenAI / Anthropic / Gemini) over `requests` — no new SDK dependency. |
| `services/places_provider.py` | Geoapify geocoding + places lookup, degrades to `[]` if unconfigured. |
| `services/itinerary_generator.py` | Builds the prompt, calls the AI provider, retries once on validation failure. |
| `services/itinerary_validator.py` | Validates/normalizes raw AI JSON before it's ever saved (Phase 10). |
| `services/trip_background.py` | `threading.Thread`-based async runner (see architecture note above). |
| `management/commands/setup_trip_indexes.py` | Mongo index setup ("migration" equivalent). |
| `tests_trip_planner.py` | Unit tests (validation, ownership, generation flow, sharing) with everything external mocked. |
| `urls.py` (edited) | Registers all of the above. |

## 5. Database ("models")

Mongo documents, not Django models — see `trip_utils.py`/`trip_views.py` for the exact shape.

**`users`** — `_id` (`user_xxx`), `googleSub` (unique), `email` (unique), `name`, `picture`,
`createdAt`, `lastLoginAt`.

**`trips`** — `_id` (`trip_xxx`), `userId`, `title`, `destination`, `startDate`, `endDate`,
`travelersCount`, `travelType`, `budgetType`, `budgetAmount`, `currency`, `preferredPace`,
`interests[]`, `foodPreferences[]`, `dietaryRestrictions`, optional fields (`startingCity`,
`arrivalDate/Time`, `departureDate/Time`, `travelMode`, `accommodationPreference`,
`hotelLocation`, `accessibilityRequirements`, `specialRequests`), `status`
(`draft|queued|generating|completed|failed`), `generationVersion`, `generationError`,
`needsRegeneration`, `estimatedTotalCost`, `summary`, `importantNotes[]`, `itineraryDays[]`
(embedded — each `{dayNumber, date, title, summary, estimatedDailyCost, items[]}`, each item
`{sequence, startTime, endTime, itemType, title, description, placeName, address, latitude,
longitude, estimatedDurationMinutes, estimatedTravelMinutes, estimatedCost, mapsUrl, bookingUrl
(always null — Phase 9 rule 17), notes, source}`), `placesVerified`, `createdAt`, `updatedAt`.

Itinerary days/items are embedded in the trip document rather than split into separate
collections — idiomatic for Mongo, and avoids a second relational database for a 1:N:N
relationship that's always read/written together.

**`trip_shares`** — `_id` (`share_xxx`), `tripId`, `sharedBy`, `recipientEmail`, `recipientName`,
`message`, `shareToken` (unique, `secrets.token_urlsafe(32)`), `status`
(`pending|sent|failed`), `revoked`, `expiresAt`, `sentAt`, `createdAt`, `updatedAt`.

**`rate_limits`** — `_id` (`"<userId>:<action>:<YYYY-MM-DD>"`), `count`. Backs the
generation/regeneration/share-email daily limits without needing Redis.

**Indexes** (`python manage.py setup_trip_indexes`): unique `users.googleSub`, unique
`users.email`, `trips.(userId, createdAt)`, `trips.(userId, status)`, unique
`trip_shares.shareToken`, `trip_shares.(tripId, createdAt)`.

**"Constraints"**: uniqueness is enforced by the Mongo indexes above; ownership and
one-day-per-date rules are enforced in application code (`trip_views._owned_trip_or_error`,
`itinerary_validator.validate_itinerary`) since Mongo has no cross-document FK constraints.

## 6. API endpoints

Base path: `/api` (same prefix as every other endpoint in this project).

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/google` | Public | Body `{credential}` (Google ID token). Verifies it server-side, finds/creates the user, returns `{success, token, user}` — same envelope as the existing admin login. |
| GET | `/auth/me` | Bearer | Returns the signed-in traveler's profile. |
| POST | `/auth/logout` | Bearer | Reused as-is from the existing admin auth (stateless JWT). |
| POST | `/trips` | Bearer | Create + queue generation. 400 on validation errors (`{success:false, errors:[{field,message}]}`); if the daily generation limit is hit the trip is still saved as `draft`. |
| GET | `/trips` | Bearer | List the caller's trips. Query: `status`, `search`, `page`, `limit`, `sortBy`, `sortDir`. |
| GET | `/trips/:id` | Bearer | 404 if missing **or** owned by someone else (no 403 — avoids confirming a trip ID exists). |
| PATCH | `/trips/:id` | Bearer | Partial update; flags `needsRegeneration` if a completed trip's core fields change. |
| DELETE | `/trips/:id` | Bearer | Deletes the trip and its shares. |
| POST | `/trips/:id/generate` | Bearer | Starts generation for a draft/failed trip. 429 if the daily limit is hit. |
| POST | `/trips/:id/regenerate` | Bearer | Bumps `generationVersion`; keeps the last completed itinerary until the new one succeeds. 429 on limit. |
| GET | `/trips/:id/status` | Bearer | `{status, generationError, generationVersion, needsRegeneration}` — polled by the frontend. |
| POST | `/trips/:id/share` | Bearer | Body `{recipientEmail, recipientName?, message?}`. Requires a completed trip. 429 on limit. Sends async. |
| POST | `/trips/:id/share-link` | Bearer | Creates a plain shareable link, no email. |
| GET | `/trips/:id/shares` | Bearer | List share links/emails issued for the trip (owner only). |
| POST | `/trips/:id/shares/:share_id/revoke` | Bearer | Revokes a link/email share. |
| GET | `/shared-trips/:token` | Public | Opened from the share link/email. Returns itinerary fields only — never `userId`/owner email. 404 if revoked/expired/unknown. |

All responses use the project's existing `{success, message?, data?, errors?}` envelope. No
provider stack traces are ever returned — failures are logged server-side and a safe generic
message is stored/returned instead (`trip_utils.safe_error_message`).

## 7. Authentication

- **Admin login is untouched.** `auth_views.py`/`/auth/login` still works exactly as before.
- **Google Sign-In** (`google_auth_views.py`): the frontend loads Google's Identity Services
  script and gets an ID token; the backend verifies its signature, audience (`GOOGLE_CLIENT_ID`),
  issuer, expiry and `email_verified` claim via `google.oauth2.id_token.verify_oauth2_token`
  before ever trusting it — the browser's claims are never trusted directly. On success it
  finds-or-creates a `users` document and issues the same kind of JWT the admin login issues
  (`role: "user"` instead of `"admin"`), so `login_required` keeps working unmodified.
- `GOOGLE_CLIENT_SECRET` is **not** used by this flow (ID-token verification doesn't need it) and
  is never sent to the frontend. Only `GOOGLE_CLIENT_ID` — a public identifier — is shared with
  the browser (`VITE_GOOGLE_CLIENT_ID`).

### Google Cloud setup

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → type
   *Web application*.
2. Add your frontend origin(s) (e.g. `http://localhost:5173`, your production domain) under
   *Authorized JavaScript origins*. No redirect URI is needed for this flow (Google Identity
   Services' one-tap/button flow, not the redirect-based auth-code flow).
3. Copy the Client ID into **both**:
   - `Backend/.env` → `GOOGLE_CLIENT_ID`
   - project root `.env` → `VITE_GOOGLE_CLIENT_ID` (see root `.env.example`)

## 8. AI provider configuration

Set in `Backend/.env`:

```env
AI_PROVIDER=openai        # openai | anthropic | gemini
AI_MODEL=                 # provider-specific model name, e.g. gpt-4o-mini
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

Only the key for the selected provider is required. If none is configured, trip generation
fails gracefully with "Trip planning isn't fully set up yet..." rather than crashing — the
feature is safe to deploy before an operator has added an AI key.

Calls go over `requests` (no new SDK dependency) to each provider's REST API
(`Backend/api/services/ai_provider.py`). The itinerary generator (`itinerary_generator.py`)
sends the trip details + up to 40 verified places, asks for a single strict JSON object (see the
schema embedded in its system prompt), validates the response (`itinerary_validator.py`), and
retries once with the validation errors appended to the prompt before giving up and marking the
trip `failed` (its previous completed itinerary, if any, is never destroyed).

## 9. Places / routing provider

`PLACES_PROVIDER=geoapify` (`Backend/api/services/places_provider.py`) — chosen because it has
solid India coverage, a generous free tier, geocoding + places in one REST call over `requests`
(no new dependency), and doesn't require a billing-enabled Google Cloud project. Set
`GEOAPIFY_API_KEY` to enable it; without it, generation still works, just without
place-verification grounding (the itinerary is marked `placesVerified: false` and the UI shows a
small disclaimer).

## 10. Background task setup

No Celery/Redis is introduced (see §2). `services/trip_background.py` runs generation on a
daemon thread, guarded against duplicate dispatch both in-process (a `set` of in-flight trip
IDs) and via the trip's own `status` field. This is adequate for the project's current
single-process `gunicorn` deployment (`Backend/Dockerfile`).

**Documented upgrade path to Celery** (for multi-worker production scale): `generate_itinerary()`
in `itinerary_generator.py` has no request/response dependency, so wrap
`trip_background._generate_for_trip(trip_id)` in a `@shared_task def generate_trip_task(trip_id)`,
add `celery`, `redis` to `requirements.txt`, set `CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND`, and
replace the `threading.Thread(...)` call in `queue_generation()` with
`generate_trip_task.delay(trip_id)`. Nothing else in the request/view layer needs to change.

## 11. Email sharing

Reuses the project's only email infrastructure — raw SMTP via `smtplib`
(`Backend/api/email_utils.py`, same `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` already configured
for registration emails). `send_trip_share_email` follows the exact same branded-HTML pattern as
the existing confirmation emails. Sending happens on a background thread (same convention as
`registrations_views.py`'s existing confirmation emails) so the API responds immediately with
`202 Accepted`.

Share links point at `${FRONTEND_URL}/shared-trip/<token>` where the token is
`secrets.token_urlsafe(32)`. Links are revocable (`POST /trips/:id/shares/:share_id/revoke`) and
support an optional `expiresAt` (not set by default — add a value when creating the share
document if you want time-limited links).

## 12. Environment variables

New variables (see `Backend/.env.example` and root `.env.example`):

```env
# Backend/.env
GOOGLE_CLIENT_ID=
AI_PROVIDER=openai
AI_MODEL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
PLACES_PROVIDER=geoapify
GEOAPIFY_API_KEY=
MAX_TRIP_DAYS=14
MAX_TRAVELERS=20
TRIP_GENERATION_LIMIT_PER_DAY=10
TRIP_REGENERATION_LIMIT_PER_DAY=10
EMAIL_SHARE_LIMIT_PER_DAY=20
```

```env
# project root .env (Vite)
VITE_GOOGLE_CLIENT_ID=
```

No existing environment variable was renamed, removed, or repurposed. `FRONTEND_URL` (already
present in `Backend/.env`) is reused to build share links.

## 13. Local setup

```bash
# Backend
cd Backend
python -m venv venv        # if not already created
venv\Scripts\activate       # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
# fill in Backend/.env (see Backend/.env.example) — at minimum GOOGLE_CLIENT_ID and one AI provider key
python manage.py setup_trip_indexes
python manage.py runserver

# Frontend (separate terminal, project root)
cp .env.example .env   # then fill in VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

## 14. Database migrations

There is nothing to `makemigrations`/`migrate` for this feature (see §2). Run the index setup
command once per environment:

```bash
cd Backend
python manage.py setup_trip_indexes
```

It's idempotent — safe to run again after future deploys.

## 15. Running workers

No separate worker process is required for the MVP background-thread approach — it runs inside
the same `gunicorn`/`runserver` process. If you adopt the Celery upgrade path from §10, run a
worker with `celery -A backend_core worker -l info` alongside a Redis instance.

## 16. Testing

```bash
cd Backend
python manage.py test api.tests_trip_planner
```

Covers: form validation rules (destination required, date ordering, traveler count, custom
budget, unknown interests rejected), itinerary JSON validation (day count, item types, time
ordering, `bookingUrl` always stripped), trip ownership (a user can't read/edit/delete/share
another user's trip — 404, not 403), the create → generate → rate-limit flow, share-email
gating (must be `completed` first) and revocation, and the public shared-trip endpoint rejecting
unknown tokens. The AI provider, places provider, Mongo collections, and outbound email are all
mocked/faked — no real network calls or paid API usage happen in tests.

No frontend test runner (Jest/Vitest/RTL) exists in this project's `package.json`, so no new
frontend test files were added — adding one is listed under "Future improvements" below.

## 17. Deployment

No changes to `Backend/Dockerfile`/deployment process are required — the feature runs inside the
existing single-process `gunicorn` deployment. Just make sure the new environment variables (§12)
are set in your hosting provider's environment/secrets config, and run
`python manage.py setup_trip_indexes` once against the production database after deploying.

## 18. Security

- Every private trip/share endpoint requires a valid JWT (`login_required`, the project's
  existing decorator) **and** an explicit per-trip ownership check
  (`trip_views._owned_trip_or_error`) — a trip that exists but belongs to someone else returns
  404, matching the existing "don't leak existence" behavior elsewhere isn't present in this
  codebase yet, but is the safer default here.
- Google ID tokens are verified server-side (signature, audience, issuer, expiry,
  `email_verified`) — never trusted from the browser.
- `GOOGLE_CLIENT_SECRET`, AI provider keys, and the places API key stay backend-only; only the
  public `GOOGLE_CLIENT_ID` reaches the frontend.
- AI/provider errors are logged (`trip_utils.safe_error_message`) and never returned to the
  client or stored verbatim on the trip document — only a generic message is.
- Shared-trip responses (`shared_trip_public_view`) return an explicit allow-list of fields —
  never the owner's id/email.
- Share tokens are `secrets.token_urlsafe(32)` (cryptographically secure), unique-indexed, and
  revocable.
- Rate limits (below) protect the paid AI/places calls and the SMTP relay from abuse; all are
  enforced server-side, never only in the frontend.

## 19. Cost & abuse controls

```env
MAX_TRIP_DAYS=14
MAX_TRAVELERS=20
TRIP_GENERATION_LIMIT_PER_DAY=10
TRIP_REGENERATION_LIMIT_PER_DAY=10
EMAIL_SHARE_LIMIT_PER_DAY=20
```

Enforced in `trip_utils.check_and_increment_rate_limit` (a small Mongo counter, no Redis needed)
and checked inside the relevant views before any AI/places/email call is made — never only
client-side.

## 20. Known limitations

- Background generation runs on a Python thread inside the web process (no Celery/Redis) — fine
  for the current single-process deployment, but won't survive a process restart mid-generation
  (the trip would be stuck at `generating`; a `retry`/`generate` call fixes it). See §10 for the
  documented Celery upgrade path.
- Without `GEOAPIFY_API_KEY` configured, itineraries are generated from the AI's general
  knowledge only (no place-verification grounding) — still usable, just marked
  `placesVerified: false`.
- No frontend automated tests were added (no test runner was present in this project to hook
  into) — see below.
- Share-link `expiresAt` is stored but nothing sets it yet (links don't expire by default);
  wire it up if you want time-limited sharing.
- This session's execution sandbox couldn't run `pip install`, `npm install`,
  `python manage.py test`, or `npm run build` (see the final report) — please run these once
  before treating the feature as verified in your environment.

## 21. Future improvements

- Add a frontend test runner (Vitest + React Testing Library is the natural fit for this Vite
  project) and cover `TripPlannerForm` validation, the status-polling flow, and the share modal.
- Move to Celery + Redis once the deployment has Redis available (see §10).
- Add map previews (the `latitude`/`longitude` data is already there) using whichever mapping
  library is added to the frontend.
- Add `expiresAt` enforcement + a "share settings" UI for link expiry.
- Consider letting an admin configure per-provider AI/places settings from the admin dashboard
  instead of `.env`, consistent with how Google Sheets integration settings are already stored
  in `integration_settings`.
