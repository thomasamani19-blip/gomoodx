
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useAuth as useFirebaseAuth, useFirestore } from '../provider';
import type { User as AppUser } from '@/lib/types';
import { useDoc } from '../firestore/use-doc';
import { doc } from 'firebase/firestore';

// This hook is responsible for listening to Firebase Auth state changes
// and fetching the user profile from Firestore.
export const useUser = () => {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
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
  const userRef = firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null;
  const { data: user, loading: loadingUser, error } = useDoc<AppUser>(userRef);

  return { 
    user, 
    firebaseUser, 
    loading: loading || loadingUser, 
    error 
  };
};
