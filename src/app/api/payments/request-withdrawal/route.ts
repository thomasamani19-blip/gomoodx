
// /src/app/api/payments/request-withdrawal/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User, Wallet, Transaction } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, amount } = await request.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
        }

        const userRef = db.collection('users').doc(userId);
        const walletRef = db.collection('wallets').doc(userId);

        const withdrawalResult = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("Utilisateur introuvable.");
            const user = userDoc.data() as User;

            if (user.role !== 'escorte' && user.role !== 'partenaire') {
                throw new Error("Action non autorisée. Seuls les créateurs et partenaires peuvent effectuer des retraits.");
            }
            
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) throw new Error("Portefeuille introuvable.");
            const wallet = walletDoc.data() as Wallet;

            if (wallet.balance < amount) {
                throw new Error("Solde insuffisant pour ce retrait.");
            }

            // Mettre à jour le solde
            t.update(walletRef, {
                balance: FieldValue.increment(-amount),
            });
            
            // Créer une transaction de retrait en attente
            const withdrawalTxRef = walletRef.collection('transactions').doc();
            const transactionData: Omit<Transaction, 'id'> = {
                amount: amount,
                type: 'withdrawal',
                createdAt: Timestamp.now(),
                description: `Demande de retrait`,
                status: 'pending', // L'admin devra confirmer et exécuter le paiement
                reference: withdrawalTxRef.id,
            };
            t.set(withdrawalTxRef, transactionData);
            
            return { transactionId: withdrawalTxRef.id, message: "Demande de retrait enregistrée." };
        });
        
        return NextResponse.json({ status: 'success', ...withdrawalResult });

    } catch (error: any) {
        console.error("Erreur lors de la demande de retrait:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
