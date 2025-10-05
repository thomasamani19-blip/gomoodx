'use client';

import type { UserRole } from '@/lib/types';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser as useFirebaseUserHook } from '@/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface UserWithId extends User {
    id: string;
}

interface AuthContextType {
  user: UserWithId | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, loading, manualSetUserRole } = useFirebaseUserHook();
  
  const login = (role: UserRole) => {
    console.warn("login() is a mock function. Use Firebase SDK to sign in.");
    manualSetUserRole(role);
  };

  const logout = () => {
    console.log("Signing out... (mock)");
    manualSetUserRole('client');
  };
  
  const setUserRole = (role: UserRole) => {
    manualSetUserRole(role);
  }

  const value = useMemo(() => ({ 
      user: user as UserWithId | null, 
      firebaseUser,
      loading, 
      login, 
      logout, 
      setUserRole 
    }), [user, firebaseUser, loading, manualSetUserRole]);

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
