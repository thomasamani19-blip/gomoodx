
// /src/app/api/calls/billing/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Call, Wallet, Transaction, User } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { callId, duration } = await request.json() as { callId: string, duration: number };

        if (!callId || duration === undefined || duration < 0) {
            return NextResponse.json({ status: 'error', message: 'ID d\'appel ou durée invalide.' }, { status: 400 });
        }
        
        const callRef = db.collection('calls').doc(callId);

        const transactionResult = await db.runTransaction(async (t) => {
            const callDoc = await t.get(callRef);
            if (!callDoc.exists) throw new Error("L'appel n'existe pas.");
            
            const callData = callDoc.data() as Call;

            // Only bill for video calls with a defined price and positive duration
            if (callData.type !== 'video' || !callData.pricePerMinute || callData.pricePerMinute <= 0 || duration <= 0) {
                t.update(callRef, { billedDuration: duration });
                return { message: "Aucune facturation requise pour cet appel.", totalCost: 0 };
            }

            const minutesBilled = Math.ceil(duration / 60);
            const totalCost = minutesBilled * callData.pricePerMinute;

            const callerWalletRef = db.collection('wallets').doc(callData.callerId);
            const receiverWalletRef = db.collection('wallets').doc(callData.receiverId);
            
            const [callerWalletDoc, receiverWalletDoc] = await Promise.all([
                t.get(callerWalletRef),
                t.get(receiverWalletRef)
            ]);

            if (!callerWalletDoc.exists) throw new Error("Portefeuille de l'appelant introuvable.");
            if (!receiverWalletDoc.exists) throw new Error("Portefeuille du destinataire introuvable.");

            const callerWallet = callerWalletDoc.data() as Wallet;
            if (callerWallet.balance < totalCost) {
                // This is a fallback; primary checks should be on the client.
                // Here we might charge the available balance or handle as an error.
                // For now, we throw, but in production you might want partial billing.
                throw new Error("Solde insuffisant pour la durée de l'appel.");
            }

            // Débiter l'appelant
            t.update(callerWalletRef, {
                balance: callerWallet.balance - totalCost,
                totalSpent: (callerWallet.totalSpent || 0) + totalCost,
            });

            // Créditer le destinataire
            const receiverWallet = receiverWalletDoc.data() as Wallet;
            t.update(receiverWalletRef, {
                balance: receiverWallet.balance + totalCost,
                totalEarned: (receiverWallet.totalEarned || 0) + totalCost,
            });

            // Créer une transaction de débit pour l'appelant
            const debitTxRef = callerWalletRef.collection('transactions').doc();
            const debitTx: Omit<Transaction, 'id'> = {
                amount: totalCost,
                type: 'call_fee',
                createdAt: Timestamp.now(),
                description: `Appel vidéo (${minutesBilled} min)`,
                status: 'success',
                reference: callId,
            };
            t.set(debitTxRef, debitTx);

            // Créer une transaction de crédit pour le destinataire
            const creditTxRef = receiverWalletRef.collection('transactions').doc();
             const creditTx: Omit<Transaction, 'id'> = {
                amount: totalCost,
                type: 'credit',
                createdAt: Timestamp.now(),
                description: `Revenu appel vidéo (${minutesBilled} min)`,
                status: 'success',
                reference: callId,
            };
            t.set(creditTxRef, creditTx);
            
            // Mettre à jour l'appel avec la durée facturée
            t.update(callRef, { billedDuration: duration });
            
            return { message: "Facturation de l'appel réussie.", totalCost };
        });
        
        return NextResponse.json({ status: 'success', ...transactionResult });

    } catch (error: any) {
        console.error('Erreur lors de la facturation de l\'appel:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
