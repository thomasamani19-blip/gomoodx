
'use client';

import { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import type { User, PartnerType, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    type User as FirebaseUser
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    serverTimestamp,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (formData: Record<string, any>) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { auth, firestore } = initializeFirebase();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
            const userDocRef = doc(firestore, 'users', fbUser.uid);
            const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUser({ id: doc.id, ...doc.data() } as User);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user document:", error);
                setUser(null);
                setLoading(false);
            });
            return () => unsubscribeFirestore();
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth();
  }, [auth, firestore]);


  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle the rest
  };

  const signup = async (formData: Record<string, any>) => {
    const { email, password, role, ...profileData } = formData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: fbUser } = userCredential;
    
    const batch = writeBatch(firestore);

    // Create user document
    const userDocRef = doc(firestore, 'users', fbUser.uid);
    const newUser: Partial<User> = {
      displayName: profileData.displayName,
      email: fbUser.email,
      role: role as UserRole,
      status: role === 'escorte' || role === 'partenaire' ? 'pending' : 'active',
      verificationStatus: role === 'escorte' ? 'pending' : undefined,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isVerified: false,
      onlineStatus: 'offline',
      rewardPoints: 0,
      referralsCount: 0,
      referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      profileImage: `https://picsum.photos/seed/${fbUser.uid}/400/400`,
      ...profileData,
    };
    
    if (role === 'partenaire') {
        const partnerRequestRef = doc(collection(firestore, 'partnerRequests'));
        batch.set(partnerRequestRef, {
            type: profileData.partnerType as PartnerType,
            companyName: profileData.companyName,
            registerNumber: profileData.registerNumber,
            country: profileData.country,
            city: profileData.city,
            address: profileData.address,
            companyEmail: profileData.companyEmail,
            phone: profileData.phone,
            website: profileData.website,
            description: profileData.description,
            managerName: profileData.managerName,
            managerEmail: profileData.managerEmail,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        // Partners don't get a user doc immediately, just the request.
        // We'll sign them out after creating the request.
        await signOut(auth);
        await batch.commit();
        return; // End here for partners
    }

    if (profileData.referralCode) {
        // Find user with this referral code
        // This is a simplified search. For production, use a more robust method like a dedicated collection.
        // const q = query(collection(firestore, 'users'), where('referralCode', '==', profileData.referralCode), limit(1));
        // const querySnapshot = await getDocs(q);
        // if (!querySnapshot.empty) {
        //     newUser.referredBy = querySnapshot.docs[0].id;
        // }
    }
    
    batch.set(userDocRef, newUser, { merge: true });

    // Create wallet for the new user
    const walletRef = doc(firestore, 'wallets', fbUser.uid);
    batch.set(walletRef, {
      balance: 0,
      currency: 'EUR',
      totalEarned: 0,
      totalSpent: 0,
      status: 'active',
      createdAt: serverTimestamp(),
    });
    
    await batch.commit();
    // onAuthStateChanged will handle setting the user state.
  };
  
  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const value = useMemo(() => ({ 
      user, 
      firebaseUser,
      loading,
      login, 
      signup,
      logout, 
    }), [user, firebaseUser, loading, router]);

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
