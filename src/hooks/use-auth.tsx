

'use client';

import type { UserRole, PartnerType } from '@/lib/types';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser as useFirebaseUserHook, useAuth as useFirebaseAuthHook, useStorage, useFirestore } from '@/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch, type Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { uploadFile } from '@/lib/storage';


// 🧠 Fonction utilitaire — Vérification âge minimum
function isAdult(dateOfBirth: string | Date) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}


interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (formData: any) => Promise<FirebaseUser | string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser: fbUser, loading } = useFirebaseUserHook();
  const auth = useFirebaseAuthHook();
  const firestore = useFirestore();
  const storage = useStorage();
  
  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (formData: any) => {
    const { role } = formData;
    if (role === 'client') {
        return registerClient(formData);
    } else if (role === 'escorte') {
        // Assuming verificationFiles come from a different source
        return registerEscort(formData, null); 
    } else if (role === 'partenaire') {
        return registerPartner(formData);
    }
    throw new Error('Invalid role selected');
  }

  const registerClient = async (form: any) => {
    const { email, password, displayName, dateOfBirth, country, phone, gender } = form;
  
    if (!isAdult(dateOfBirth)) {
      throw new Error("Vous devez avoir au moins 18 ans pour vous inscrire.");
    }
  
    // Création compte Firebase Auth
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
  
    // Création du document Firestore
    await setDoc(doc(firestore, "users", user.uid), {
      displayName,
      email,
      role: "client",
      dateOfBirth,
      country,
      phone,
      gender,
      status: "active",
      rewardPoints: 0,
      referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      referralsCount: 0,
      createdAt: serverTimestamp(),
    });
  
    return user;
  }

  const registerEscort = async (form: any, verificationFiles: any) => {
    const {
      displayName,
      email,
      password,
      dateOfBirth,
      country,
      city,
      phone,
      gender,
      verificationType = "selfie" // "selfie" ou "complete"
    } = form;
  
    if (!isAdult(dateOfBirth)) {
      throw new Error("Vous devez avoir au moins 18 ans pour vous inscrire.");
    }
  
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
  
    // 🔥 Enregistrement Firestore
    await setDoc(doc(firestore, "users", user.uid), {
      displayName,
      email,
      role: "escorte",
      dateOfBirth,
      country,
      city,
      phone,
      gender,
      verificationStatus: "pending",
      verificationType,
      status: "pending",
      rewardPoints: 0,
      referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      referralsCount: 0,
      createdAt: serverTimestamp(),
    });
  
    // 🧾 Upload fichiers de vérification (si disponibles)
    if (storage && verificationFiles) {
      const { selfieVideo, idCard } = verificationFiles;
  
      if (selfieVideo) {
        await uploadFile(storage, `verifications/selfie/${user.uid}.mp4`, selfieVideo);
      }
      if (verificationType === "complete" && idCard) {
        await uploadFile(storage, `verifications/id/${user.uid}.jpg`, idCard);
      }
    }
  
    return user;
  }

  const registerPartner = async (form: any) => {
    const {
      partnerType, // "establishment" ou "producer"
      displayName, // companyName
      email, // companyEmail
      phone,
    } = form;
  
    const uid = crypto.randomUUID(); // Génère un ID unique pour la demande
  
    await setDoc(doc(firestore, "partnerRequests", uid), {
      type: partnerType,
      companyName: displayName,
      companyEmail: email,
      phone: phone,
      status: "pending",
      reviewedBy: null,
      createdAt: serverTimestamp(),
    });
  
    // For partners, we don't create a user account until approval.
    // We just log the request.
    return uid;
  }


  const logout = () => {
    signOut(auth);
  };

  const value = useMemo(() => ({ 
      user: user as User | null, 
      firebaseUser: fbUser as FirebaseUser | null,
      loading, 
      login, 
      signup,
      logout, 
    }), [user, fbUser, loading]);

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

