
'use client';

import { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import type { User, PartnerType, UserRole, Settings } from '@/lib/types';
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
    writeBatch,
    collection,
    query,
    where,
    getDocs,
    limit,
    updateDoc,
    increment,
    getDoc
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
  };

  const signup = async (formData: Record<string, any>) => {
    const { email, password, role, referredBy: referralCode, ...profileData } = formData;
    
    if (role === 'partenaire') {
        const partnerRequestRef = doc(collection(firestore, 'partnerRequests'));
        await setDoc(partnerRequestRef, {
            type: profileData.partnerType as PartnerType,
            companyName: profileData.companyName,
            registerNumber: profileData.registerNumber || '',
            country: profileData.country,
            city: profileData.city,
            address: profileData.address,
            companyEmail: profileData.companyEmail,
            phone: profileData.phone,
            website: profileData.website || '',
            description: profileData.description || '',
            managerName: profileData.managerName || '',
            managerEmail: profileData.managerEmail || '',
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        return; 
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: fbUser } = userCredential;
    
    const batch = writeBatch(firestore);
    const userDocRef = doc(firestore, 'users', fbUser.uid);

    let referrerId: string | undefined = undefined;
    if (referralCode) {
        const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCode.toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            const settingsDoc = await getDoc(doc(firestore, 'settings', 'global'));
            const referralBonus = (settingsDoc.data() as Settings)?.rewards?.referralBonus || 0;

            referrerId = referrerDoc.id;
            const referrerRef = doc(firestore, 'users', referrerId);
            
            if (referralBonus > 0) {
                 batch.update(referrerRef, { 
                    referralsCount: increment(1),
                    rewardPoints: increment(referralBonus),
                 });
                 // Log transaction for referrer
                 const referrerWalletRef = collection(firestore, 'wallets', referrerId, 'transactions');
                 batch.set(doc(referrerWalletRef), {
                     amount: referralBonus,
                     type: 'reward',
                     description: `Bonus de parrainage - Nouvel utilisateur: ${profileData.displayName}`,
                     status: 'success',
                     createdAt: serverTimestamp()
                 });

            } else {
                 batch.update(referrerRef, { referralsCount: increment(1) });
            }

        } else {
            console.warn(`Referral code "${referralCode}" not found.`);
        }
    }

    const newUser: Partial<User> = {
      displayName: profileData.displayName,
      email: fbUser.email,
      role: role as UserRole,
      status: role === 'escorte' ? 'pending' : 'active',
      verificationStatus: role === 'escorte' ? 'pending' : undefined,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isVerified: false,
      onlineStatus: 'offline',
      rewardPoints: 0,
      referralsCount: 0,
      referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      profileImage: `https://picsum.photos/seed/${fbUser.uid}/400/400`,
      referredBy: referrerId,
      ...profileData,
    };
    
    batch.set(userDocRef, newUser, { merge: true });

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
  };
  
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    router.push('/');
  };

  const value = useMemo(() => ({ 
      user, 
      firebaseUser,
      loading,
      login, 
      signup,
      logout, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [user, firebaseUser, loading]);

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
