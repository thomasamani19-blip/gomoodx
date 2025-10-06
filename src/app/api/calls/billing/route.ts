
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

// ID du portefeuille de la plateforme (à créer dans Firestore)
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { callId, duration } = await request.json() as { callId: string, duration: number };

        if (!callId || duration === undefined || duration <= 0) {
            return NextResponse.json({ status: 'error', message: 'ID d\'appel ou durée invalide.' }, { status: 400 });
        }
        
        const callRef = db.collection('calls').doc(callId);

        const transactionResult = await db.runTransaction(async (t) => {
            const callDoc = await t.get(callRef);
            if (!callDoc.exists) throw new Error("L'appel n'existe pas.");
            
            const callData = callDoc.data() as Call;

            // Only bill for calls with a defined price and positive duration
            if (!callData.pricePerMinute || callData.pricePerMinute <= 0) {
                 t.update(callRef, { billedDuration: duration });
                return { message: "Aucune facturation requise pour cet appel.", totalCost: 0 };
            }

            const minutesBilled = Math.ceil(duration / 60);
            const totalCost = minutesBilled * callData.pricePerMinute;

            const callerWalletRef = db.collection('wallets').doc(callData.callerId);
            const callerWalletDoc = await t.get(callerWalletRef);
            if (!callerWalletDoc.exists) throw new Error("Portefeuille de l'appelant introuvable.");
            const callerWallet = callerWalletDoc.data() as Wallet;
            if (callerWallet.balance < totalCost) {
                throw new Error("Solde insuffisant pour la durée de l'appel.");
            }

            // Débiter l'appelant
            t.update(callerWalletRef, {
                balance: callerWallet.balance - totalCost,
                totalSpent: (callerWallet.totalSpent || 0) + totalCost,
            });

            // Créer la transaction de débit pour l'appelant
            const debitTxRef = callerWalletRef.collection('transactions').doc();
            const debitTx: Omit<Transaction, 'id'> = {
                amount: totalCost,
                type: 'call_fee',
                createdAt: Timestamp.now(),
                description: `Appel ${callData.type} (${minutesBilled} min)`,
                status: 'success',
                reference: callId,
            };
            t.set(debitTxRef, debitTx);

            // Fetch receiver's user data to check their role
            const receiverUserRef = db.collection('users').doc(callData.receiverId);
            const receiverUserDoc = await t.get(receiverUserRef);
            if (!receiverUserDoc.exists) throw new Error("Le destinataire de l'appel est introuvable.");
            const receiverUser = receiverUserDoc.data() as User;
            
            let finalReceiverWalletRef;
            let finalReceiverDescription: string;

            // Déterminer qui reçoit les fonds
            if (callData.type === 'voice' || (callData.type === 'video' && receiverUser.role === 'partenaire' && receiverUser.partnerType === 'producer')) {
                // Les revenus vont à la plateforme
                finalReceiverWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                finalReceiverDescription = `Revenu Appel ${callData.type} de ${callData.callerName} vers ${receiverUser.displayName}`;
            } else {
                // Les revenus vont au destinataire (cas normal: appel vidéo à une escorte)
                finalReceiverWalletRef = db.collection('wallets').doc(callData.receiverId);
                 finalReceiverDescription = `Revenu appel ${callData.type} de ${callData.callerName}`;
            }

            const finalReceiverWalletDoc = await t.get(finalReceiverWalletRef);
             if (!finalReceiverWalletDoc.exists) {
                // Si le portefeuille de la plateforme n'existe pas, on le crée
                 if (finalReceiverWalletRef.id === PLATFORM_WALLET_ID) {
                    t.set(finalReceiverWalletRef, {
                        balance: totalCost,
                        currency: 'EUR',
                        totalEarned: totalCost,
                        totalSpent: 0,
                        status: 'active',
                        createdAt: Timestamp.now(),
                    });
                 } else {
                    throw new Error(`Portefeuille du destinataire final (${finalReceiverWalletRef.id}) introuvable.`);
                 }
            } else {
                const finalReceiverWallet = finalReceiverWalletDoc.data() as Wallet;
                 t.update(finalReceiverWalletRef, {
                    balance: finalReceiverWallet.balance + totalCost,
                    totalEarned: (finalReceiverWallet.totalEarned || 0) + totalCost,
                });
            }

            // Créer une transaction de crédit pour le destinataire final (plateforme ou créateur)
            const creditTxRef = finalReceiverWalletRef.collection('transactions').doc();
            const creditTx: Omit<Transaction, 'id'> = {
                amount: totalCost,
                type: 'credit',
                createdAt: Timestamp.now(),
                description: finalReceiverDescription,
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
