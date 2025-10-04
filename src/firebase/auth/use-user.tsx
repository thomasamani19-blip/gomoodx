'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';
import type { User as AppUser } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';


// A map of mock users to simulate different roles
const mockUsers: Record<string, AppUser> = {
  'client-uid': { name: 'Alex Martin', email: 'alex.martin@example.com', role: 'client', avatar: 'https://picsum.photos/seed/avatar2/100/100' },
  'escorte-uid': { name: 'Marie Dubois', email: 'marie.dubois@example.com', role: 'escorte', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
  'partenaire-uid': { name: 'Hôtel Luxe', email: 'contact@hotelluxe.com', role: 'partenaire', avatar: 'https://picsum.photos/seed/avatar3/100/100' },
  'admin-uid': { name: 'Admin', email: 'admin@gomoodx.com', role: 'administrateur', avatar: 'https://picsum.photos/seed/avatar4/100/100' },
};


export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // In a real app, you would fetch the user's role from Firestore.
        // For this prototype, we'll use a mock based on UID or a default.
        const appUser = mockUsers[fbUser.uid] || mockUsers['escorte-uid'];
        setUser(appUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // For demonstration, we'll simulate a logged-in user.
  // In a real app, you would remove this and handle login via the UI.
   useEffect(() => {
    const defaultUser = mockUsers['escorte-uid']; // Default to escorte
    setUser(defaultUser);
    setLoading(false);
  }, []);

  const manualSetUserRole = (role: UserRole) => {
    const mockUser = Object.values(mockUsers).find(u => u.role === role);
     if (mockUser) {
        setUser(mockUser);
     }
  }


  return { user, firebaseUser, loading, manualSetUserRole };
};
