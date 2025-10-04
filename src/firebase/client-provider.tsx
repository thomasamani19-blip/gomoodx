'use client';
import { useMemo, type ReactNode } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider, type FirebaseServices } from './provider';

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the root layout of the application.
// It ensures that Firebase is initialized only once.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider {...(firebaseServices as FirebaseServices)}>
      {children}
    </FirebaseProvider>
  );
}
