
// /src/app/api/products/purchase-contact-pass/route.ts
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
        const { userId, sellerId } = await request.json();

        if (!userId || !sellerId) {
            return NextResponse.json({ status: 'error', message: 'Informations utilisateur manquantes.' }, { status: 400 });
        }

        const userRef = db.collection('users').doc(userId);
        const sellerRef = db.collection('users').doc(sellerId);
        const walletRef = db.collection('wallets').doc(userId);
        const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
        const settingsRef = db.collection('settings').doc('global');

        const purchaseResult = await db.runTransaction(async (t) => {
            const settingsDoc = await t.get(settingsRef);
            const settingsData = settingsDoc.data() as Settings;
            const passPrice = settingsData?.passContact?.price;
            const firstSaleBonus = settingsData?.rewards?.firstSaleBonus || 0;

            if (!passPrice || passPrice <= 0) {
                throw new Error("Le prix du Pass Contact n'est pas configuré.");
            }

            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new Error("Utilisateur acheteur introuvable.");
            const user = userDoc.data() as User;

            const sellerDoc = await t.get(sellerRef);
            if (!sellerDoc.exists) throw new Error("Vendeur introuvable.");
            const seller = sellerDoc.data() as User;

            if (user.unlockedContacts?.includes(sellerId)) {
                return { message: "Contact déjà débloqué.", status: 'already_unlocked' };
            }
            
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) throw new Error("Portefeuille de l'utilisateur introuvable.");
            const wallet = walletDoc.data() as Wallet;

            if (wallet.balance < passPrice) {
                throw new Error("Solde insuffisant pour acheter le Pass Contact.");
            }

            // Débiter le portefeuille de l'utilisateur
            t.update(walletRef, {
                balance: FieldValue.increment(-passPrice),
                totalSpent: FieldValue.increment(passPrice),
            });

            // Créditer le portefeuille de la plateforme
            t.update(platformWalletRef, {
                balance: FieldValue.increment(passPrice),
                totalEarned: FieldValue.increment(passPrice),
            });

            // Créer la transaction de débit pour l'utilisateur
            const debitTxRef = walletRef.collection('transactions').doc();
            const txId = debitTxRef.id;
            const debitTx: Omit<Transaction, 'id'> = {
                amount: passPrice,
                type: 'contact_pass',
                createdAt: Timestamp.now(),
                description: `Achat Pass Contact pour ${seller.displayName}`,
                status: 'success',
                reference: txId,
            };
            t.set(debitTxRef, debitTx);

            // Ajouter le vendeur à la liste des contacts débloqués de l'acheteur
            t.update(userRef, {
                unlockedContacts: FieldValue.arrayUnion(sellerId)
            });
            
            // First sale bonus logic for the seller
            if (!seller.hasMadeFirstSale && firstSaleBonus > 0) {
                t.update(sellerRef, {
                    rewardPoints: FieldValue.increment(firstSaleBonus),
                    hasMadeFirstSale: true,
                });
                const sellerWalletRef = db.collection('wallets').doc(sellerId);
                const rewardTxRef = sellerWalletRef.collection('transactions').doc();
                t.set(rewardTxRef, {
                    amount: firstSaleBonus, type: 'reward', createdAt: Timestamp.now(),
                    description: `Bonus pour votre première vente !`, status: 'success', reference: txId
                } as Omit<Transaction, 'id'|'path'>);
            }


            return {
                message: "Pass Contact acheté avec succès. Vous pouvez maintenant contacter le vendeur.",
                status: 'success',
            };
        });

        return NextResponse.json(purchaseResult);

    } catch (error: any) {
        console.error("Erreur lors de l'achat du Pass Contact:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
