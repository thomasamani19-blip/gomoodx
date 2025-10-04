'use client';

import type { UserRole } from '@/lib/types';
import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface User {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  client: { name: 'Alex Martin', email: 'alex.martin@example.com', role: 'client', avatar: 'https://picsum.photos/seed/avatar2/100/100' },
  escorte: { name: 'Marie Dubois', email: 'marie.dubois@example.com', role: 'escorte', avatar: 'https://picsum.photos/seed/avatar1/100/100' },
  partenaire: { name: 'Hôtel Luxe', email: 'contact@hotelluxe.com', role: 'partenaire', avatar: 'https://picsum.photos/seed/avatar3/100/100' },
  administrateur: { name: 'Admin', email: 'admin@elixir-sensuel.com', role: 'administrateur', avatar: 'https://picsum.photos/seed/avatar4/100/100' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to 'escorte' to showcase the most features
  const [user, setUser] = useState<User | null>(mockUsers.escorte);

  const login = (role: UserRole) => {
    if (role) {
      setUser(mockUsers[role]);
    }
  };

  const logout = () => {
    setUser(null);
  };
  
  const setUserRole = (role: UserRole) => {
    if(role) {
      setUser(mockUsers[role]);
    } else {
      setUser(null);
    }
  }

  const value = useMemo(() => ({ user, login, logout, setUserRole }), [user]);

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
