import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

import { firebaseConfig } from './config';

// Re-export providers and hooks
export {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

export function initializeFirebase(config: FirebaseOptions = firebaseConfig) {
  const firebaseApp = initializeApp(config);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    // It's assumed that all emulators are running on the same host.
    // If you're using different hosts, you'll need to configure them individually.
    console.log(`Using Firebase emulators on host: ${host}`);
    connectFirestoreEmulator(firestore, host, 8080);
    connectAuthEmulator(auth, `http://${host}:9099`, {
      disableWarnings: true,
    });
  }

  return { firebaseApp, firestore, auth };
}
