
// /src/app/api/admin/update-subscription-settings/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, updateDoc, doc } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Settings } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();
const auth = getAuth();

export async function POST(request: Request) {
    try {
        const idToken = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ status: 'error', message: 'Accès non autorisé.' }, { status: 401 });
        }

        const decodedToken = await auth.verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists || !['founder', 'administrateur'].includes(userDoc.data()?.role)) {
             return NextResponse.json({ status: 'error', message: 'Permissions insuffisantes.' }, { status: 403 });
        }

        const newSettings = await request.json() as Partial<Settings>;

        if (!newSettings.platformPlans) {
            return NextResponse.json({ status: 'error', message: 'Données de plans manquantes.' }, { status: 400 });
        }
        
        const settingsRef = doc(db, 'settings', 'global');
        
        await updateDoc(settingsRef, {
            platformPlans: newSettings.platformPlans
        });

        return NextResponse.json({
            status: 'success', 
            message: 'Les plans d\'abonnement ont été mis à jour.',
        });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour des abonnements:", error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ status: 'error', message: 'Session expirée, veuillez vous reconnecter.' }, { status: 401 });
        }
        return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
    }
}
