import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (Object.values(firebaseConfig).some((value) => !value)) {
  throw new Error('Missing Firebase configuration. Ensure all NEXT_PUBLIC_FIREBASE_* env vars are set.');
}

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(firestore, host, 8080);
}

export { app, auth, firestore };
