
'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import type { User, UserRole, PlatformSubscriptionType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

// Mocked Founder User for unrestricted development access
const MOCKED_USER: User = {
  id: 'dev_founder_id',
  displayName: 'Founder (Dev)',
  email: 'founder@gomoodx.com',
  role: 'founder',
  status: 'active',
  isVerified: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  rewardPoints: 9999,
  referralCode: 'DEVMODE',
  referralsCount: 42,
  onlineStatus: 'online',
  profileImage: 'https://picsum.photos/seed/founder/400/400',
  bannerImage: 'https://picsum.photos/seed/founder-banner/1200/400',
  bio: 'Accès développeur avec tous les droits.',
  hasMadeFirstDeposit: true,
  subscription: {
    type: 'elite',
    status: 'active',
    startDate: Timestamp.now(),
    endDate: Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
  subscriptionSettings: {
    enabled: true,
    tiers: {
      tier1: { id: 'tier1', name: 'Bronze', price: 10, description: 'Accès de base', isActive: true },
      tier2: { id: 'tier2', name: 'Argent', price: 25, description: 'Accès exclusif', isActive: true },
      tier3: { id: 'tier3', name: 'Or', price: 50, description: 'Accès VIP', isActive: true },
    }
  },
  rates: {
    escortPerHour: 200,
    escortOvernight: 1200,
    videoCallPerMinute: 10,
  }
};


interface AuthContextType {
  user: User | null;
  firebaseUser: any | null; // Mocking FirebaseUser as well
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (formData: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const login = async (email: string, pass: string) => {
    console.log('Login attempt (dev mode, no action):', email);
    // In dev mode, we just stay on the dashboard
    router.push('/dashboard');
  };

  const signup = async (formData: any) => {
    console.log('Signup attempt (dev mode, no action):', formData);
    // In dev mode, we just stay on the dashboard
    router.push('/dashboard');
    return MOCKED_USER;
  };
  
  const logout = () => {
    console.log('Logout attempt (dev mode, no action)');
    // In dev mode, logout does nothing to keep the session
  };

  const value = useMemo(() => ({ 
      user: MOCKED_USER, 
      firebaseUser: { uid: MOCKED_USER.id, email: MOCKED_USER.email }, // Mock firebase user
      loading: false, // Never in loading state in dev mode
      login, 
      signup,
      logout, 
    }), [router]);

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
