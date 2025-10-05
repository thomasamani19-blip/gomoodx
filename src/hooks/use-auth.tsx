'use client';

import type { UserRole } from '@/lib/types';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser as useFirebaseUserHook, useAuth as useFirebaseAuthHook } from '@/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  avatar?: string;
  pseudo?: string;
}


interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading } = useFirebaseUserHook();
  const auth = useFirebaseAuthHook();
  const firestore = useFirestore();
  
  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    // Create user document in Firestore
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    await setDoc(userRef, {
        nom: name,
        email: email,
        role: role,
        // Default avatar for new users
        avatar: `https://avatar.vercel.sh/${firebaseUser.uid}.png`
    });
  }

  const logout = () => {
    signOut(auth);
  };

  const value = useMemo(() => ({ 
      user: user as User | null, 
      firebaseUser,
      loading, 
      login, 
      signup,
      logout, 
    }), [user, firebaseUser, loading, auth, firestore]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
