'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '../provider';
import type { User as AppUser, UserWithId } from '@/hooks/use-auth';
import { useDoc } from '../firestore/use-doc';

// This hook is responsible for listening to Firebase Auth state changes
// and fetching the user profile from Firestore.
export const useUser = () => {
  const auth = useFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);
  
  // Get the user profile from Firestore
  const userPath = firebaseUser ? `users/${firebaseUser.uid}` : null;
  const { data: user, loading: loadingUser, error } = useDoc<AppUser>(userPath);

  return { 
    user, 
    firebaseUser, 
    loading: loading || loadingUser, 
    error 
  };
};
