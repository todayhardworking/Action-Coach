# System Architecture (Stepvia)

Stepvia uses a simple, scalable structure based on Next.js App Router,
Firebase Authentication, Firestore, and server-side OpenAI calls.

## 1. Frontend
- Built with Next.js / React.
- Pages and UI live in the `app/` directory.
- Client components handle:
  - user input
  - UI state
  - sending requests to API routes

## 2. Backend
- All backend logic is inside API routes:
  - `app/api/generate-questions`
  - `app/api/generate-smart`
  - (future) `app/api/generate-actions`

## 3. Authentication
- Uses Firebase Auth (email + Google sign-in).
- Client retrieves Firebase user.
- API routes verify the user when needed (future module).

## 4. Database
- Firestore with simple collections:
  - `targets`
  - `actions`

## 5. AI Processing
- All AI calls run in API routes on the server.
- Uses OpenAI (`gpt-4o`) for goal-related processing.
- No AI logic runs on the client.

## 6. Deployment
- Hosted on Vercel.
- Environment variables stored in Vercel env settings.
