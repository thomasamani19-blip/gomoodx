'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useAuth as useFirebaseAuth } from '../provider';
import type { User as AppUser, UserWithId } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';
import { useDoc } from '../firestore/use-doc';


// A map of mock users to simulate different roles
const mockUsers: Record<string, UserWithId> = {
  'client-uid': { id: 'client-uid', name: 'Alex Martin', email: 'alex.martin@example.com', role: 'client', avatar: 'https://picsum.photos/seed/avatar2/100/100' },
  'escorte-uid': { id: 'escorte-uid', name: 'Marie Dubois', email: 'marie.dubois@example.com', role: 'escorte', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
  'partenaire-uid': { id: 'partenaire-uid', name: 'Hôtel Luxe', email: 'contact@hotelluxe.com', role: 'partenaire', avatar: 'https://picsum.photos/seed/avatar3/100/100' },
  'admin-uid': { id: 'admin-uid', name: 'Admin', email: 'admin@gomoodx.com', role: 'administrateur', avatar: 'https://picsum.photos/seed/avatar4/100/100' },
};

// This hook is responsible for listening to Firebase Auth state changes
// and fetching the user profile from Firestore.
// For the prototype, it simulates this behavior with mock data.
export const useUser = () => {
  const auth = useFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // For demo purposes, we'll keep one user logged in.
  const [currentUserId, setCurrentUserId] = useState<string | null>('escorte-uid');

  const { data: user, loading: loadingUser, error } = useDoc<AppUser>(
    currentUserId ? `users/${currentUserId}` : null
  );

  const manualSetUserRole = (role: UserRole) => {
    const mockUser = Object.values(mockUsers).find(u => u.role === role);
    if (mockUser) {
        setCurrentUserId(mockUser.id);
    }
  };

  const loading = loadingAuth || loadingUser;

  return { user, firebaseUser, loading, manualSetUserRole };
};
