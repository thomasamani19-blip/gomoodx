
// /src/app/api/lives/purchase-ticket/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { LiveSession, Wallet, Purchase, Transaction, Settings } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { userId, sessionId } = await request.json();

        if (!userId || !sessionId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour l\'achat.' }, { status: 400 });
        }
        
        const sessionRef = db.collection('lives').doc(sessionId);
        const userWalletRef = db.collection('wallets').doc(userId);
        const settingsRef = db.collection('settings').doc('global');

        const purchaseResult = await db.runTransaction(async (t) => {
            const sessionDoc = await t.get(sessionRef);
            if (!sessionDoc.exists) throw new Error("La session live n'existe pas.");
            const session = sessionDoc.data() as LiveSession;
            
            const ticketPrice = session.ticketPrice || 0;
            if (session.liveType !== 'creator' || ticketPrice <= 0) {
                 throw new Error("Cette session n'est pas payante.");
            }

            const userWalletDoc = await t.get(userWalletRef);
            if (!userWalletDoc.exists) throw new Error("Portefeuille de l'utilisateur introuvable.");
            const userWallet = userWalletDoc.data() as Wallet;
            
            const hostWalletRef = db.collection('wallets').doc(session.hostId);
            const hostWalletDoc = await t.get(hostWalletRef);
            if (!hostWalletDoc.exists) throw new Error("Portefeuille du créateur introuvable.");

            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);

            const settingsDoc = await t.get(settingsRef);
            const commissionRate = (settingsDoc.data() as Settings)?.platformCommissionRate || 0.20;
            
            if (userWallet.balance < ticketPrice) throw new Error("Solde insuffisant pour acheter ce ticket.");
            
            const purchasesQuery = db.collection('purchases')
                .where('memberId', '==', userId)
                .where('contentId', '==', sessionId)
                .where('contentType', '==', 'live_ticket');
            const existingPurchase = await t.get(purchasesQuery);
            if (!existingPurchase.empty) {
                return { message: "Ticket déjà acheté.", status: 'already_purchased' };
            }

            if (session.hostId === userId) throw new Error("Vous ne pouvez pas acheter un ticket pour votre propre live.");
            

            const purchaseId = db.collection('purchases').doc().id;
            const purchaseRef = db.collection('purchases').doc(purchaseId);

            const newPurchase: Omit<Purchase, 'id'> = {
                memberId: userId,
                sellerId: session.hostId,
                contentId: sessionId,
                contentType: 'live_ticket',
                contentTitle: session.title,
                amount: ticketPrice,
                status: 'completed',
                createdAt: Timestamp.now(),
            };
            t.set(purchaseRef, newPurchase);

            t.update(userWalletRef, {
                balance: FieldValue.increment(-ticketPrice),
                totalSpent: FieldValue.increment(ticketPrice)
            });

            const debitTxRef = userWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: ticketPrice, type: 'live_ticket', createdAt: Timestamp.now(),
                description: `Ticket Live: ${session.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);

            // Commission logic
            const commissionAmount = ticketPrice * commissionRate;
            const hostAmount = ticketPrice - commissionAmount;

            // Credit host
            t.update(hostWalletRef, {
                balance: FieldValue.increment(hostAmount),
                totalEarned: FieldValue.increment(hostAmount)
            });
            const creditTxRef = hostWalletRef.collection('transactions').doc();
            t.set(creditTxRef, {
                amount: hostAmount, type: 'credit', createdAt: Timestamp.now(),
                description: `Vente ticket live: ${session.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);

            // Credit platform
            t.update(platformWalletRef, { balance: FieldValue.increment(commissionAmount), totalEarned: FieldValue.increment(commissionAmount) });
            const platformTxRef = platformWalletRef.collection('transactions').doc();
            t.set(platformTxRef, {
                amount: commissionAmount, type: 'commission', createdAt: Timestamp.now(),
                description: `Commission sur ticket live: ${session.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);
            
            return { purchaseId: purchaseId, message: "Achat de ticket réussi." };
        });
        
        return NextResponse.json({ status: 'success', ...purchaseResult });

    } catch (error: any) {
        console.error("Erreur lors de l'achat du ticket:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
