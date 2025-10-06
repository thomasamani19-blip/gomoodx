
// /src/app/api/admin/approve-partner/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, WriteBatch } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { PartnerRequest, User } from '@/lib/types';
import { randomBytes } from 'crypto';

// Initialize Firebase Admin SDK if not already done
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({
        credential: applicationDefault(),
    });
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

// Helper to generate a random password
const generatePassword = (length = 12) => {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

export async function POST(request: Request) {
  try {
    // TODO: Add admin role verification here for security by checking the request headers for an auth token.
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ status: 'error', message: 'ID de la demande manquant.' }, { status: 400 });
    }

    const requestRef = db.collection('partnerRequests').doc(requestId);
    const partnerRequestDoc = await requestRef.get();

    if (!partnerRequestDoc.exists) {
      throw new Error("La demande de partenariat n'existe pas.");
    }

    const partnerRequest = partnerRequestDoc.data() as PartnerRequest;

    if (partnerRequest.status === 'approved') {
        throw new Error("Cette demande a déjà été approuvée.");
    }

    // 1. Create Firebase Auth user
    const password = generatePassword();
    const userRecord = await auth.createUser({
      email: partnerRequest.companyEmail,
      emailVerified: true, // Assume email is verified
      password: password,
      displayName: partnerRequest.companyName,
      disabled: false,
    });
    
    console.log(`Mot de passe temporaire pour ${partnerRequest.companyName}: ${password}`); // Log password for admin
    // In a real app, you would email this password to the user.

    const batch: WriteBatch = db.batch();

    // 2. Create user document in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const newUser: Partial<User> = {
      displayName: partnerRequest.companyName,
      email: partnerRequest.companyEmail,
      phone: partnerRequest.phone,
      role: 'partenaire',
      partnerType: partnerRequest.type,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isVerified: true, // Partner is verified on approval
      onlineStatus: 'offline',
      referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      profileImage: `https://picsum.photos/seed/${userRecord.uid}/400/400`,
      bio: partnerRequest.description || `Partenaire officiel de GoMoodX.`,
      location: partnerRequest.address || `${partnerRequest.city}, ${partnerRequest.country}`,
      city: partnerRequest.city,
      country: partnerRequest.country,
      referralsCount: 0,
      rewardPoints: 0,
    };
    batch.set(userRef, newUser);

    // 3. Create wallet for the new user
    const walletRef = db.collection('wallets').doc(userRecord.uid);
    batch.set(walletRef, {
      balance: 0,
      currency: 'EUR',
      totalEarned: 0,
      totalSpent: 0,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. Update the original partner request status
    batch.update(requestRef, { status: 'approved', reviewedBy: 'admin' /* TODO: use actual admin id */ });

    // Commit all writes at once
    await batch.commit();

    return NextResponse.json({
        status: 'success', 
        message: 'Partenaire approuvé et compte créé.',
        userId: userRecord.uid,
        companyName: partnerRequest.companyName,
    });

  } catch (error: any) {
    console.error("Erreur lors de l'approbation du partenaire:", error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
