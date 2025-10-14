
// /src/app/api/subscriptions/create-platform-subscription/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User, Wallet, Transaction, Settings, UserSubscription } from '@/lib/types';
import { add } from 'date-fns';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

// Define platform plans on the server-side to prevent tampering
const platformPlans = {
    essential: { name: 'Essentiel', price: 9.99 },
    advanced: { name: 'Avancé', price: 24.99 },
    premium: { name: 'Premium', price: 49.99 },
    elite: { name: 'Élite', price: 99.99 },
};

export async function POST(request: Request) {
    try {
        const { userId, planId, durationMonths } = await request.json() as { userId: string, planId: keyof typeof platformPlans, durationMonths: number };

        if (!userId || !planId || !durationMonths) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la souscription.' }, { status: 400 });
        }

        const userRef = db.collection('users').doc(userId);
        const walletRef = db.collection('wallets').doc(userId);
        const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
        
        const subscriptionResult = await db.runTransaction(async (t) => {
            const selectedPlan = platformPlans[planId];
            if (!selectedPlan) {
                throw new Error("Ce plan d'abonnement n'est pas valide.");
            }

            const userWalletDoc = await t.get(walletRef);
            if (!userWalletDoc.exists) throw new Error("Portefeuille de l'utilisateur introuvable.");
            const userWallet = userWalletDoc.data() as Wallet;

            let finalPrice = selectedPlan.price * durationMonths;
            let discount = 0;
            if (durationMonths === 3) discount = 10;
            if (durationMonths === 6) discount = 15;
            if (durationMonths === 12) discount = 20;

            if (discount > 0) {
                finalPrice = finalPrice * (1 - discount / 100);
            }

            if (userWallet.balance < finalPrice) {
                throw new Error("Solde insuffisant pour cet abonnement.");
            }

            // 1. Débiter l'utilisateur
            t.update(walletRef, {
                balance: FieldValue.increment(-finalPrice),
                totalSpent: FieldValue.increment(finalPrice)
            });
            const debitTxRef = walletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: finalPrice, type: 'subscription_fee', createdAt: Timestamp.now(),
                description: `Abonnement ${durationMonths} mois - ${selectedPlan.name}`, status: 'success'
            } as Omit<Transaction, 'id'>);

            // 2. Créditer la plateforme
            t.update(platformWalletRef, {
                balance: FieldValue.increment(finalPrice),
                totalEarned: FieldValue.increment(finalPrice)
            });

            // 3. Mettre à jour le statut d'abonnement de l'utilisateur
            const startDate = new Date();
            const endDate = add(startDate, { months: durationMonths });

            const subscriptionData: UserSubscription = {
                type: planId,
                status: 'active',
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
            };
            
            t.update(userRef, { subscription: subscriptionData });

            return { message: "Abonnement à la plateforme réussi !" };
        });
        
        return NextResponse.json({ status: 'success', ...subscriptionResult });

    } catch (error: any) {
        console.error("Erreur lors de la souscription d'abonnement plateforme:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
