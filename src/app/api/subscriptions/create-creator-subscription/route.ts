// /src/app/api/subscriptions/create-creator-subscription/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User, Wallet, Transaction, Settings, SubscriptionTier } from '@/lib/types';
import { add } from 'date-fns';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { memberId, creatorId, tierId, durationMonths } = await request.json();

        if (!memberId || !creatorId || !tierId || !durationMonths) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la souscription.' }, { status: 400 });
        }

        const memberRef = db.collection('users').doc(memberId);
        const creatorRef = db.collection('users').doc(creatorId);
        const memberWalletRef = db.collection('wallets').doc(memberId);
        const creatorWalletRef = db.collection('wallets').doc(creatorId);
        const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
        const settingsRef = db.collection('settings').doc('global');

        const subscriptionResult = await db.runTransaction(async (t) => {
            const creatorDoc = await t.get(creatorRef);
            if (!creatorDoc.exists) throw new Error("Le créateur n'existe pas.");
            const creator = creatorDoc.data() as User;
            
            const selectedTier = creator.subscriptionSettings?.tiers[tierId];
            if (!selectedTier || !selectedTier.isActive) {
                throw new Error("Ce niveau d'abonnement n'est pas valide ou est inactif.");
            }

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) throw new Error("Portefeuille du membre introuvable.");
            const memberWallet = memberWalletDoc.data() as Wallet;

            const settingsDoc = await t.get(settingsRef);
            const settingsData = settingsDoc.data() as Settings;
            const commissionRate = settingsData?.platformCommissionRate || 0.20;
            const firstSaleBonus = settingsData?.rewards?.firstSaleBonus || 0;


            let finalPrice = selectedTier.price * durationMonths;
            let discount = 0;
            if (durationMonths === 3 && selectedTier.discounts?.quarterly) discount = selectedTier.discounts.quarterly;
            if (durationMonths === 6 && selectedTier.discounts?.semiAnnual) discount = selectedTier.discounts.semiAnnual;
            if (durationMonths === 12 && selectedTier.discounts?.annual) discount = selectedTier.discounts.annual;
            if (discount > 0) {
                finalPrice = finalPrice * (1 - discount / 100);
            }

            if (memberWallet.balance < finalPrice) {
                throw new Error("Solde insuffisant.");
            }

            // 1. Débiter le membre
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-finalPrice),
                totalSpent: FieldValue.increment(finalPrice)
            });
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: finalPrice, type: 'subscription_fee', createdAt: Timestamp.now(),
                description: `Abonnement ${durationMonths} mois à ${creator.displayName}`, status: 'success'
            } as Omit<Transaction, 'id'>);

            // 2. Calculer et créditer la commission et le créateur
            const commissionAmount = finalPrice * commissionRate;
            const creatorAmount = finalPrice - commissionAmount;

            t.update(creatorWalletRef, { balance: FieldValue.increment(creatorAmount), totalEarned: FieldValue.increment(creatorAmount) });
            const creditTxRef = creatorWalletRef.collection('transactions').doc();
            const creditTxId = creditTxRef.id;
            t.set(creditTxRef, {
                amount: creatorAmount, type: 'credit', createdAt: Timestamp.now(),
                description: `Revenu abonnement de ${memberId.substring(0,6)}...`, status: 'success'
            } as Omit<Transaction, 'id'>);
            
            t.update(platformWalletRef, { balance: FieldValue.increment(commissionAmount), totalEarned: FieldValue.increment(commissionAmount) });

            // First sale bonus logic
            if (!creator.hasMadeFirstSale && firstSaleBonus > 0) {
                t.update(creatorRef, {
                    rewardPoints: FieldValue.increment(firstSaleBonus),
                    hasMadeFirstSale: true,
                });
                const rewardTxRef = creatorWalletRef.collection('transactions').doc();
                t.set(rewardTxRef, {
                    amount: firstSaleBonus, type: 'reward', createdAt: Timestamp.now(),
                    description: `Bonus pour votre première vente !`, status: 'success', reference: creditTxId
                } as Omit<Transaction, 'id'|'path'>);
            }

            // 3. Mettre à jour le statut d'abonnement du membre (envers ce créateur)
            const startDate = new Date();
            const endDate = add(startDate, { months: durationMonths });

            const subscriptionPath = `creatorSubscriptions.${creatorId}`;
            t.update(memberRef, {
                [subscriptionPath]: {
                    tierId: tierId,
                    tierName: selectedTier.name,
                    status: 'active',
                    startDate: Timestamp.fromDate(startDate),
                    endDate: Timestamp.fromDate(endDate),
                }
            });

            return { message: "Abonnement réussi !" };
        });
        
        return NextResponse.json({ status: 'success', ...subscriptionResult });

    } catch (error: any) {
        console.error("Erreur lors de la souscription d'abonnement:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
