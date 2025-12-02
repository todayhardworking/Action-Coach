# Action Coach

Starter workspace reset for a fresh **Next.js 14 (App Router) + React 18** project with **Firebase Auth** and **Firestore** ready to wire in. The repo is clean so you can build new features immediately and deploy to Vercel.

## Prerequisites
- Node.js 18+
- Firebase project with Web credentials
- Vercel account (optional for deployment)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables and fill in your Firebase values:
   ```bash
   cp .env.example .env.local
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Firebase configuration
- Update the `NEXT_PUBLIC_FIREBASE_*` keys in `.env.local` with your Firebase project settings.
- To develop with emulators, set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and optionally `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST`.

## Project structure
- `app/` – Next.js App Router pages and layouts
- `lib/firebase/client.ts` – Shared Firebase initialization for Auth and Firestore
- `app/globals.css` – Base styling for the landing page

## Scripts
- `npm run dev` – start the local dev server
- `npm run build` – production build
- `npm run start` – start in production mode
- `npm run lint` – run ESLint

## Deployment
Deploy with [Vercel](https://vercel.com/docs/deployments/overview) using the same environment variables defined in `.env.local`.
