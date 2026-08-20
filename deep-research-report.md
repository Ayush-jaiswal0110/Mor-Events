# Morevents Trip Planner Implementation

## 1. Current Architecture Audit  
Morevents currently uses a **React front-end** and a **Django back-end** (likely via Django REST Framework) to serve data over APIs.  In such a decoupled setup, React components fetch and submit data through REST endpoints, while Django handles business logic and database storage (e.g. for events and users).  We should confirm the existing auth mechanism (e.g. Django sessions or token auth) and data models.  For the new features, the backend will expose new APIs (e.g. `/api/trips/`) and the frontend will call them.  Typical setup involves enabling CORS on Django, using `django-rest-framework` (DRF) serializers/models for trips, and configuring React state or hooks to manage login state and trip data.  

- **Frontend (React)**: likely already communicates via HTTP(S) with the Django API. We will add components for trip planning (forms, itinerary display, share-by-email).
- **Backend (Django)**: likely uses DRF for JSON APIs. We will add new models (e.g. `Trip`, `ItineraryDay`) and endpoints. We’ll also implement OAuth and email-sending logic here.
- **Data Flow**: React calls Django endpoints. User credentials (login tokens) are sent with requests (e.g. via JWT or session cookie).

## 2. Google Sign-In Authentication  
To allow “Login/Signup with Google”, implement Google OAuth2/OpenID Connect on both client and server.  On the React side, use a Google sign-in library such as `@react-oauth/google` (or the legacy `react-google-login`) to display a “Sign in with Google” button. When the user clicks it and grants permission, the Google Identity SDK returns an *ID token* or access token.  That token should be sent to the Django backend (e.g. via a POST to `/api/auth/google/`).  

On the Django side, you can use **django-allauth** or manual token verification. For example, one approach is to take the token and verify it with Google’s API. Using the `google.oauth2.id_token` module, the backend can do: 

```python
from google.oauth2 import id_token
from google.auth.transport import requests

# In a Django REST view:
token = request.data.get('id_token')
idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
# idinfo now contains the user’s Google account info (sub, email, name, picture, etc.)
```

If verification succeeds, extract the user’s Google “sub” (ID) and email. Find or create a Django `User` with that email (or store the Google ID on the user model). Set the password blank or random since login is via Google only. Then issue your normal auth token (JWT or session) for that user. In practice, many tutorials use **django-allauth** to handle Google social login under the hood. One StackOverflow answer explains exactly this flow: use a React Google-login component to get an access token, then POST it to Django where `django-allauth` creates/gets the social account and logs the user in.  

Either way, the key steps are:

- **Frontend**: Use Google Identity Services to get a credential (JWT). For example, clicking “Sign in with Google” yields an `access_token`/`id_token`. 
- **Backend**: Verify that token. For example, call `id_token.verify_oauth2_token()` as shown above. If valid, the returned `idinfo` dict contains the user’s Google ID and email. Create or retrieve the corresponding Django user and log them in.  
- **Response**: Return a new auth token (or set a cookie) so the React app knows the user is authenticated. You can then treat them like any logged-in user (e.g. they have a `User` record). 

This flow is confirmed by practitioners: Sollych on StackOverflow notes that after Google login, you send the token to the backend which “gets the google user data saved in the database under social accounts, ultimately login[s] them in the application”. A Django view example showed using exactly `id_token.verify_oauth2_token()` to authenticate the token and obtain user info. 

Important details:
- Use your own Google **Client ID** on the front end and back end to verify tokens. 
- Ensure the redirect URIs and origins match your app domains.
- Store tokens/credentials securely (e.g. in environment variables). 
- Consider token expiration and refresh; you may configure JWT lifetime or handle Google refresh tokens if needed.

## 3. Trip-Planning Data Model & Itinerary Logic  
We need new models to store user trips and itineraries. A suggested schema is:

- **User** (existing): a Django auth user (enhanced with Google ID if social login).
- **Trip**: fields include `user (FK)`, `destination_city`, `start_date`, `end_date`, plus any preferences (budget, group size, interests). This holds the trip parameters.
- **ItineraryDay**: fields include `trip (FK)`, `day_number`, and maybe `summary` or related entries. Each day record can store a list of planned activities.
- **Place/Activity** (optional): if storing individual stops, fields like `name`, `category` (sightseeing, restaurant, etc.), `address`, `coordinates`, and a FK to `ItineraryDay`. Alternatively, one can just store a JSON schedule in each ItineraryDay if simplicity is fine.

For itinerary **generation logic**, there are two main approaches:

- **Rule-based scheduling**: Use external data (like Google Places) to find points of interest, then slot them into morning/afternoon/evening blocks. For example, call the Google Places API to get “top attractions” or restaurants in the destination. One sample trip app uses the Google Places API specifically “for searching places in [the] destination city”. You could retrieve sights, parks, restaurants, etc., then for each day: 
  - Allocate a morning activity (e.g. landmark), 
  - Lunch at a nearby restaurant, 
  - Afternoon activity (e.g. museum or hike), 
  - Dinner at a recommended locale. 
  Use geographic proximity or ranking to choose “best” places. For example, sort places by rating or popularity (Google Places results include ratings and categories). You can use Google Distance Matrix API to cluster nearby places per day, or simply pick the top *N* attractions. The itinerary would list each day’s schedule (time slots or bullet list of activities).  
- **AI/ML-driven generation**: Leverage a language model or planning API to draft the itinerary. For instance, some developers use OpenAI’s GPT to generate itineraries. An example project “Trip-Planner” integrated the OpenAI (ChatGPT) API to *generate detailed day-by-day schedules* based on user inputs. They describe it as “ChatGPT API generated itinerary showing activities per day”. To use this approach, you would call the OpenAI API (or similar) with a prompt like “Create a 5-day itinerary for [destination] from [start_date] to [end_date], including sightseeing and meals,” then parse the response. This can give rich descriptions but requires API access and cost.  
- **Hybrid**: Combine fixed data (attractions via Places API) with AI. For example, fetch top places via Google, then feed those names to a model to organize into a schedule.

No matter the approach, the itinerary generation typically happens in a backend service (e.g. a Django view or a Celery task). Once generated, save the itinerary to the database (e.g. each day’s activities) so it can be retrieved later. The React UI can then fetch the itinerary and display it in a day-by-day format (lists or cards). 

**Example workflow**:
1. User submits a trip form (destination, dates) to the backend.
2. Django view creates a `Trip` record, then calls the itinerary generator.
3. The generator uses Google Places (or an AI) to build a schedule. For instance, query Google Places for category “tourist attractions” and “restaurants” in the city, pick a handful, and assign them to days.  
4. Save each day’s plan (including meals/rest times) as `ItineraryDay` entries linked to the trip.
5. Return the completed itinerary to the front end (JSON of days and activities).

By combining data APIs and/or an AI model, the system can output a structured plan. For example, one research project notes that automated planning systems can produce a “structured day-wise itinerary” including routes and timings (though their methods may vary). We recommend starting simple (e.g. fixed templates or greedy assignment) and later enhancing with smarter algorithms or AI as needed.  

## 4. Sharing the Plan via Gmail  
To let users **share an itinerary by email**, integrate with the Gmail API. The workflow could be:

- **Frontend UI**: On the trip summary page, add a “Share via Email” button. Clicking it opens a modal/form where the user enters their friend’s email address and an optional message.  
- **Backend**: When the form is submitted, send a POST to a Django endpoint (e.g. `/api/trips/<id>/share`) with the trip ID and recipient email. The Django view will compose an email containing the itinerary details (you can format it as plain text or HTML). 

For sending email, you have two main options:
1. **Django Email (SMTP)**: Configure Django’s email backend to use a Gmail SMTP account (e.g. yourcompany@gmail.com). This is easy – enable “App Password” or OAuth for the Gmail account and set `EMAIL_HOST = 'smtp.gmail.com'` in settings. Then use Django’s `send_mail()` or `EmailMessage`.  
2. **Gmail API**: Use the RESTful Gmail API to send email. This requires setting up Google API credentials. With the Gmail API, you build a MIME message, base64-encode it, and call `messages.send`. Google’s docs explain that “You can send it directly using the `messages.send` method”. For example, using `google-api-python-client`, you might do:
   ```python
   from googleapiclient.discovery import build
   from google.oauth2.credentials import Credentials
   # Assume `creds` is a valid OAuth2 Credentials with Gmail send scope.
   service = build('gmail', 'v1', credentials=creds)
   message_body = create_message(sender, recipient, subject, body_text)  # RFC-2822 base64
   sent_msg = service.users().messages().send(userId="me", body=message_body).execute()
   ```
   This sends the email as the authorized user. You would need to manage OAuth tokens: either a service account (if using a Workspace/GSuite account) or have the site owner authorize a Gmail account. 

A simpler approach is SMTP (option 1), but using the Gmail API (option 2) is more flexible and avoids Gmail’s limitations on SMTP. The Gmail API docs show the steps to create and send messages: essentially, “create the email content and encode it as a base64URL string, then call `messages.send`”.  

- **Content**: The email should include the trip details and itinerary. You might attach the plan as HTML or link to the trip page. Make sure the email is formatted nicely (e.g. bullet points or tables for each day).
- **Permissions**: If using Gmail API, request `https://www.googleapis.com/auth/gmail.send` scope when obtaining credentials. The React app might also need to allow the user to authorize (if sending from their Gmail); otherwise use a fixed site Gmail.

Overall, set up a Gmail API client or SMTP backend in Django, then in your “share” view, invoke it with the friend’s email and your composed itinerary. This gives users the ability to email the plan directly.  

## 5. Implementation Roadmap

1. **Set Up Google Cloud Credentials**: 
   - Create a Google API project. 
   - Configure OAuth 2.0 Client IDs for “Web application” with your frontend origin (e.g. `http://localhost:3000`).  
   - Enable the **Google+ (People) API** or **Identity Services** for sign-in, and the **Gmail API**. 
   - Obtain the Client ID/Secret for OAuth and set as env variables in both frontend and backend.

2. **Implement Google Login**:  
   - *Frontend*: Install `@react-oauth/google` (or similar) and add a Google login button. On success, obtain the token.  
   - *Backend*: Add a Django view (e.g. `GoogleAuthView`) to receive the token. In that view, use `id_token.verify_oauth2_token(token, Request(), CLIENT_ID)` to validate. Then create/find the user and authenticate them. Return a session or JWT.  
   - **Citations**: Sollych’s answer recommends this flow with `react-google-login` + `django-allauth`; and another example shows using `google.oauth2.id_token.verify_oauth2_token` in Django.

3. **Design Trip Models and API**:  
   - Define Django models: e.g. `Trip` (with user, destination, dates, preferences) and `ItineraryDay` (linked to Trip). Possibly also a `Place` model or JSON fields for activities.  
   - Create DRF serializers and viewsets:  
     - **Create Trip API**: POST `/api/trips/` with destination and dates to create a Trip.  
     - **Get Trip/Itinerary API**: GET `/api/trips/<id>/` returns trip details and itinerary days.  
   - Protect these with auth (only the owner can access their trips).  
   - *React*: Build a form component for entering trip details. On submit, call the Create API. Then fetch and display the itinerary from the Trip detail API.

4. **Implement Itinerary Generation Logic**:  
   - In the Trip creation view (or a background task triggered after creation), implement the planning logic:  
     - Query **Google Places API** for top attractions/restaurants in the city.  
     - Divide them into each day’s plan (e.g. nearest neighbors or fixed templates).  
     - Populate `ItineraryDay` entries (day 1: places A, B; day 2: C, D, etc., with meal recommendations in between).  
     - **Alternatively**, call an AI service (OpenAI GPT) with trip details to generate a text itinerary, then parse it into days (this is optional and requires API integration). We saw an example where a Django app uses ChatGPT to get day-by-day activities.  
   - Save the itinerary to the database. Ensure this step is fast enough or run it asynchronously (e.g. with Celery) if it’s time-consuming.

5. **Create UI Components**:  
   - After login, show a “Plan a Trip” page with a form (destination, start/end date, interests).  
   - On submission, show a loading indicator while the backend generates the plan.  
   - Display the itinerary in a readable format (e.g. each day as a card or section with activities and meal spots).  
   - Add a **Share** button: opens an email form (recipient input + message).  

6. **Implement Email Sharing**:  
   - *Backend*: Endpoint like POST `/api/trips/<id>/share/` that accepts `to_email` and an optional message.  
   - Compose an email body including the trip summary and itinerary.  
   - Use the Gmail API or Django email to send it. If using the Gmail API, load credentials (possibly a single site-wide Gmail account credential) and call `messages.send`. If using SMTP, call `send_mail()` in Django.  
   - Return success or error to the frontend.  

7. **Testing**:  
   - **Auth**: Test Google login flow end-to-end. Use test Google accounts. Ensure token exchange and user creation works.  
   - **Trip APIs**: Write unit tests for Trip creation, including validations. Mock the itinerary generation (or test integration with Google Places).  
   - **Itinerary Logic**: Test that given a city and dates, reasonable plans are generated. Manually review a few outputs.  
   - **Email**: Test sending emails to a real or mock SMTP/Gmail. Confirm inbox delivery and format.  
   - **UI**: Manually test the React components: login button, trip form, itinerary display, share form.

8. **Deployment/Config**:  
   - Store Google Client ID/Secret and Gmail credentials in environment variables (do **not** hard-code).  
   - Ensure the frontend is pointed to the correct API URL (e.g. production domain).  
   - If needed, handle OAuth redirect URIs for Google sign-in.  

By following these steps, Morevents will gain Google-based authentication, an automated trip-planning feature, and an email-sharing workflow. Key technologies include **Django REST Framework** for the API, Google’s OAuth2/OpenID for login, the Google Places API or OpenAI for itinerary data, and the Gmail API for emailing. With thorough testing and secure handling of tokens, these features will allow users to easily log in with Google, create custom multi-day travel plans, and share them with friends.

**Sources:** Implementation approaches are drawn from community examples and docs, e.g. React+Django Google login workflows, trip planner prototypes using Google Places and AI, and Google’s Gmail API guide.