// /src/app/api/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User, Wallet, Transaction } from '@/lib/types';
import { add } from 'date-fns';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

const PLATFORM_WALLET_ID = 'platform_wallet';
const PREMIUM_MEMBER_BONUS = 20; // 20€ bonus

export async function POST(request: Request) {
    try {
        const { userId, amount, tx_ref } = await request.json();

        if (!userId || !amount || !tx_ref) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour créer l\'abonnement.' }, { status: 400 });
        }

        const userRef = db.collection('users').doc(userId);
        const walletRef = db.collection('wallets').doc(userId);
        const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);

        const subscriptionResult = await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("Utilisateur introuvable.");

            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) throw new Error("Portefeuille de l'utilisateur introuvable.");

            const platformWalletDoc = await t.get(platformWalletRef);
            if (!platformWalletDoc.exists) throw new Error("Portefeuille de la plateforme introuvable.");
            const platformWallet = platformWalletDoc.data() as Wallet;
            
            // 1. Mettre à jour le statut de l'abonnement de l'utilisateur
            const now = new Date();
            const subscriptionEndDate = add(now, { months: 1 });

            t.update(userRef, {
                'subscription.type': 'premium_member',
                'subscription.status': 'active',
                'subscription.startDate': Timestamp.fromDate(now),
                'subscription.endDate': Timestamp.fromDate(subscriptionEndDate),
                'updatedAt': Timestamp.now()
            });

            // 2. Transférer le coût de l'abonnement au portefeuille de la plateforme
            t.update(platformWalletRef, {
                balance: FieldValue.increment(amount),
                totalEarned: FieldValue.increment(amount),
            });

            const platformTxRef = platformWalletRef.collection('transactions').doc();
            t.set(platformTxRef, {
                amount: amount, type: 'subscription_fee', createdAt: Timestamp.now(),
                description: `Abonnement de ${userDoc.data()?.displayName}`, status: 'success', reference: tx_ref
            } as Omit<Transaction, 'id'>);


            // 3. Créditer le portefeuille de l'utilisateur avec le bonus
            if (platformWallet.balance < PREMIUM_MEMBER_BONUS) {
                // Pas assez dans le portefeuille de la plateforme pour donner le bonus, mais l'abonnement est quand même actif.
                // Logguer une erreur pour une action manuelle.
                console.error(`Solde de la plateforme insuffisant (${platformWallet.balance}€) pour créditer le bonus de ${PREMIUM_MEMBER_BONUS}€ à l'utilisateur ${userId}.`);
            } else {
                 t.update(platformWalletRef, {
                    balance: FieldValue.increment(-PREMIUM_MEMBER_BONUS)
                });
                t.update(walletRef, {
                    balance: FieldValue.increment(PREMIUM_MEMBER_BONUS),
                });

                const bonusTxRef = walletRef.collection('transactions').doc();
                t.set(bonusTxRef, {
                    amount: PREMIUM_MEMBER_BONUS, type: 'credit', createdAt: Timestamp.now(),
                    description: `Bonus Abonnement Premium`, status: 'success', reference: tx_ref
                } as Omit<Transaction, 'id'>);
            }
            
            return { message: "Abonnement activé et bonus crédité avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...subscriptionResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de l\'abonnement:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
