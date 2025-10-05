import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    console.log(`Using Firebase emulators on host: ${host}`);
    
    // Check if emulators are already connected to avoid errors
    // @ts-ignore
    if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    }
    // @ts-ignore
    if (!firestore.emulatorConfig) {
        connectFirestoreEmulator(firestore, host, 8080);
    }
    // @ts-ignore
    if (!storage.emulatorConfig) {
        connectStorageEmulator(storage, host, 9199);
    }
    // @ts-ignore
    if(!functions.emulatorConfig) {
        connectFunctionsEmulator(functions, host, 5001);
    }
}

export { app, firestore, auth, storage, functions };
