
// /src/app/api/calls/log-duration/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { User } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, duration, callId } = await request.json() as { userId: string, duration: number, callId?: string };

        if (!userId || duration === undefined || duration < 0) {
            return NextResponse.json({ status: 'error', message: 'ID utilisateur ou durée invalide.' }, { status: 400 });
        }
        
        const userRef = db.collection('users').doc(userId);
        
        const transactionResult = await db.runTransaction(async (t) => {
            // Log billed duration on the call itself, regardless of payment type
            if (callId) {
                 const callRef = db.collection('calls').doc(callId);
                 t.update(callRef, { billedDuration: duration });
            }
            
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("L'utilisateur n'existe pas.");
            
            const userData = userDoc.data() as User;
            const quota = userData.dailyVoiceCallQuota;
            const now = new Date();
            const minutesUsed = Math.ceil(duration / 60);

            if (quota && quota.lastReset) {
                const lastResetDate = quota.lastReset.toDate();
                // Si la dernière réinitialisation date d'un jour précédent
                if (now.toDateString() !== lastResetDate.toDateString()) {
                    t.update(userRef, {
                        'dailyVoiceCallQuota.minutesUsed': minutesUsed,
                        'dailyVoiceCallQuota.lastReset': Timestamp.now()
                    });
                } else {
                    t.update(userRef, {
                        'dailyVoiceCallQuota.minutesUsed': FieldValue.increment(minutesUsed)
                    });
                }
            } else {
                // Si le quota n'existe pas, on le crée
                t.update(userRef, {
                    dailyVoiceCallQuota: {
                        minutesUsed: minutesUsed,
                        lastReset: Timestamp.now()
                    }
                });
            }
            return { message: "Durée de l'appel gratuit enregistrée." };
        });
        
        return NextResponse.json({ status: 'success', ...transactionResult });

    } catch (error: any) {
        console.error('Erreur lors de l\'enregistrement de la durée:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
