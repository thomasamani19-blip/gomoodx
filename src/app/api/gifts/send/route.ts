// /src/app/api/gifts/send/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User, Wallet, Transaction, Settings } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { senderId, receiverId, gift, sessionId } = await request.json();

        if (!senderId || !receiverId || !gift || !gift.price || !sessionId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour envoyer le cadeau.' }, { status: 400 });
        }
        
        if (senderId === receiverId) {
            throw new Error("Vous ne pouvez pas vous envoyer un cadeau à vous-même.");
        }

        const senderWalletRef = db.collection('wallets').doc(senderId);
        const receiverWalletRef = db.collection('wallets').doc(receiverId);
        const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
        const settingsRef = db.collection('settings').doc('global');
        
        const giftResult = await db.runTransaction(async (t) => {
            const senderWalletDoc = await t.get(senderWalletRef);
            if (!senderWalletDoc.exists) throw new Error("Portefeuille de l'expéditeur introuvable.");
            const senderWallet = senderWalletDoc.data() as Wallet;
            
            if (senderWallet.balance < gift.price) {
                throw new Error("Solde insuffisant pour envoyer ce cadeau.");
            }

            const receiverWalletDoc = await t.get(receiverWalletRef);
             if (!receiverWalletDoc.exists) throw new Error("Portefeuille du destinataire introuvable.");

            const settingsDoc = await t.get(settingsRef);
            const commissionRate = (settingsDoc.data() as Settings)?.platformCommissionRate || 0.20;

            // 1. Débiter l'expéditeur
            t.update(senderWalletRef, {
                balance: FieldValue.increment(-gift.price),
                totalSpent: FieldValue.increment(gift.price)
            });

            // 2. Créer la transaction de débit pour l'expéditeur
            const debitTxRef = senderWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: gift.price, type: 'debit', createdAt: Timestamp.now(),
                description: `Cadeau "${gift.name}" envoyé`, status: 'success', reference: sessionId
            } as Omit<Transaction, 'id'>);

            // 3. Calculer et créditer le créateur et la plateforme
            const commissionAmount = gift.price * commissionRate;
            const receiverAmount = gift.price - commissionAmount;

            // Créditer le destinataire
            t.update(receiverWalletRef, {
                balance: FieldValue.increment(receiverAmount),
                totalEarned: FieldValue.increment(receiverAmount)
            });
             const creditTxRef = receiverWalletRef.collection('transactions').doc();
             t.set(creditTxRef, {
                 amount: receiverAmount, type: 'credit', createdAt: Timestamp.now(),
                 description: `Cadeau "${gift.name}" reçu`, status: 'success', reference: sessionId
             } as Omit<Transaction, 'id'>);

            // Créditer la plateforme
            t.update(platformWalletRef, { balance: FieldValue.increment(commissionAmount), totalEarned: FieldValue.increment(commissionAmount) });

            return { message: "Cadeau envoyé avec succès !" };
        });
        
        return NextResponse.json({ status: 'success', ...giftResult });

    } catch (error: any) {
        console.error("Erreur lors de l'envoi du cadeau:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
