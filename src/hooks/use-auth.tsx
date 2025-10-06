

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
import { doc, setDoc, serverTimestamp, writeBatch, type Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User } from '@/lib/types';

export interface AppUser extends User {}

interface AuthContextType {
  user: AppUser | null;
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
    const fbUser = userCredential.user;

    const batch = writeBatch(firestore);

    // 1. Create user document
    const userRef = doc(firestore, 'users', fbUser.uid);
    const newUser: Omit<User, 'id'> = {
      nom: name,
      email: email,
      role: role,
      status: 'active',
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      rewardPoints: 0,
      referralsCount: 0,
      isVerified: false,
      onlineStatus: 'offline',
      lastLogin: serverTimestamp() as Timestamp,
      referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    };
    batch.set(userRef, newUser);

    // 2. Create wallet document
    const walletRef = doc(firestore, 'wallets', fbUser.uid);
    batch.set(walletRef, {
        balance: 0,
        currency: 'XOF',
        totalEarned: 0,
        totalSpent: 0,
        status: 'active'
    });

    await batch.commit();
  }

  const logout = () => {
    signOut(auth);
  };

  const value = useMemo(() => ({ 
      user: user as AppUser | null, 
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

    
