// /src/app/api/admin/update-settings/route.ts
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
        // 1. Authenticate and authorize the admin
        const idToken = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ status: 'error', message: 'Accès non autorisé.' }, { status: 401 });
        }

        const decodedToken = await auth.verifyIdToken(idToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        
        if (!userDoc.exists || !['founder', 'administrateur'].includes(userDoc.data()?.role)) {
             return NextResponse.json({ status: 'error', message: 'Permissions insuffisantes.' }, { status: 403 });
        }


        // 2. Get and validate the new settings data
        const newSettings = await request.json() as Partial<Settings>;

        if (!newSettings || Object.keys(newSettings).length === 0) {
            return NextResponse.json({ status: 'error', message: 'Aucun paramètre à mettre à jour fourni.' }, { status: 400 });
        }
        
        // 3. Update the document in Firestore
        const settingsRef = doc(db, 'settings', 'global');
        
        // Using a flat object for updateDoc
        const updateData: { [key: string]: any } = {};
        
        if (newSettings.rewards) {
            for (const [key, value] of Object.entries(newSettings.rewards)) {
                if (typeof value === 'number' && value >= 0) {
                     updateData[`rewards.${key}`] = value;
                }
            }
        }
        
        if (newSettings.callRates) {
            for (const [key, value] of Object.entries(newSettings.callRates)) {
                if (typeof value === 'number' && value >= 0) {
                     updateData[`callRates.${key}`] = value;
                }
            }
        }

        if (typeof newSettings.platformCommissionRate === 'number') {
            updateData.platformCommissionRate = newSettings.platformCommissionRate;
        }
        if (typeof newSettings.platformFee === 'number') {
            updateData.platformFee = newSettings.platformFee;
        }
         if (typeof newSettings.welcomeBonusAmount === 'number') {
            updateData.welcomeBonusAmount = newSettings.welcomeBonusAmount;
        }
         if (typeof newSettings.withdrawalMinAmount === 'number') {
            updateData.withdrawalMinAmount = newSettings.withdrawalMinAmount;
        }
         if (typeof newSettings.withdrawalMaxAmount === 'number') {
            updateData.withdrawalMaxAmount = newSettings.withdrawalMaxAmount;
        }

        if(Object.keys(updateData).length === 0) {
             return NextResponse.json({ status: 'error', message: 'Données de paramètres non valides.' }, { status: 400 });
        }

        await updateDoc(settingsRef, updateData);

        return NextResponse.json({
            status: 'success', 
            message: 'Les paramètres de la plateforme ont été mis à jour.',
        });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour des paramètres:", error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ status: 'error', message: 'Session expirée, veuillez vous reconnecter.' }, { status: 401 });
        }
        return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
    }
}
