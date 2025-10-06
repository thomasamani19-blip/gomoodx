import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

import { firebaseConfig } from './config';

// Re-export providers and hooks
export {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useStorage,
} from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

export function initializeFirebase(config: FirebaseOptions = firebaseConfig) {
  const firebaseApp = initializeApp(config);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);

  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    // It's assumed that all emulators are running on the same host.
    // If you're using different hosts, you'll need to configure them individually.
    console.log(`Using Firebase emulators on host: ${host}`);
    
    // @ts-ignore - Check if emulator is already connected to avoid re-connecting
    if (!firestore.emulatorConfig) {
        connectFirestoreEmulator(firestore, host, 8080);
    }
    // @ts-ignore
    if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, `http://${host}:9099`, {
            disableWarnings: true,
        });
    }
    // @ts-ignore
    if (!storage.emulatorConfig) {
        connectStorageEmulator(storage, host, 9199);
    }
  }

  return { firebaseApp, firestore, auth, storage };
}
