'use client';

import type { UserRole } from '@/lib/types';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser as useFirebaseUser } from '@/firebase';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: UserRole) => void; // This will be deprecated/removed
  logout: () => void; // This will trigger Firebase sign out
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, manualSetUserRole } = useFirebaseUser();
  
  // These will be replaced by actual Firebase auth calls
  const login = (role: UserRole) => {
    console.warn("login() is a mock function. Use Firebase SDK to sign in.");
    manualSetUserRole(role);
  };

  const logout = () => {
    // In a real app, you would call signOut from 'firebase/auth'
    console.log("Signing out...");
    manualSetUserRole('client'); // For demo, just reset to a default role
  };
  
  const setUserRole = (role: UserRole) => {
    manualSetUserRole(role);
  }

  const value = useMemo(() => ({ 
      user, 
      loading, 
      login, 
      logout, 
      setUserRole 
    }), [user, loading, manualSetUserRole]);

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
