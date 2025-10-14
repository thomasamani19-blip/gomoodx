// /src/app/api/products/purchase/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Product, Wallet, Purchase, Transaction, Settings, User } from '@/lib/types';

// Assurer l'initialisation de Firebase Admin
if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}

const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { memberId, productId } = await request.json();

        if (!memberId || !productId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour l\'achat.' }, { status: 400 });
        }
        
        const productRef = db.collection('products').doc(productId);
        const memberWalletRef = db.collection('wallets').doc(memberId);
        const settingsRef = db.collection('settings').doc('global');

        const purchaseResult = await db.runTransaction(async (t) => {
            const productDoc = await t.get(productRef);
            if (!productDoc.exists) throw new Error("Le produit demandé n'existe pas.");
            const product = productDoc.data() as Product;

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) throw new Error("Portefeuille du membre introuvable.");
            const memberWallet = memberWalletDoc.data() as Wallet;
            
            const sellerRef = db.collection('users').doc(product.createdBy);
            const sellerDoc = await t.get(sellerRef);
            if (!sellerDoc.exists) throw new Error("Vendeur introuvable.");
            const seller = sellerDoc.data() as User;

            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);

            const settingsDoc = await t.get(settingsRef);
            const settingsData = settingsDoc.data() as Settings;
            const commissionRate = settingsData?.platformCommissionRate || 0.20;
            const firstSaleBonus = settingsData?.rewards?.firstSaleBonus || 0;
            
            if (memberWallet.balance < product.price) throw new Error("Solde insuffisant pour effectuer cet achat.");
            if (product.createdBy === memberId) throw new Error("Vous ne pouvez pas acheter votre propre produit.");

            const purchaseId = db.collection('purchases').doc().id;
            const purchaseRef = db.collection('purchases').doc(purchaseId);

            const newPurchase: Omit<Purchase, 'id'> = {
                memberId,
                sellerId: product.createdBy,
                contentId: productId,
                contentType: 'product',
                contentTitle: product.title,
                amount: product.price,
                status: 'completed',
                createdAt: Timestamp.now(),
            };
            t.set(purchaseRef, newPurchase);

            // 1. Débiter le portefeuille de l'acheteur
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-product.price),
                totalSpent: FieldValue.increment(product.price)
            });
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: product.price, type: 'purchase', createdAt: Timestamp.now(),
                description: `Achat: ${product.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);

            // 2. Calculer la commission de la plateforme
            const commissionAmount = product.price * commissionRate;
            t.update(platformWalletRef, { balance: FieldValue.increment(commissionAmount), totalEarned: FieldValue.increment(commissionAmount) });
            const platformTxRef = platformWalletRef.collection('transactions').doc();
            t.set(platformTxRef, {
                amount: commissionAmount, type: 'commission', createdAt: Timestamp.now(),
                description: `Commission sur vente: ${product.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);
            
            // 3. Distribuer le reste des revenus
            const netRevenue = product.price - commissionAmount;

            if (product.isCollaborative && product.revenueShares && product.revenueShares.length > 0) {
                // Contenu collaboratif avec partage de revenus
                for (const share of product.revenueShares) {
                    const participantAmount = netRevenue * (share.percentage / 100);
                    const participantWalletRef = db.collection('wallets').doc(share.userId);
                    
                    t.update(participantWalletRef, {
                        balance: FieldValue.increment(participantAmount),
                        totalEarned: FieldValue.increment(participantAmount)
                    });

                    const creditTxRef = participantWalletRef.collection('transactions').doc();
                    t.set(creditTxRef, {
                        amount: participantAmount, type: 'credit', createdAt: Timestamp.now(),
                        description: `Revenu collaboratif: ${product.title}`, status: 'success', reference: purchaseId
                    } as Omit<Transaction, 'id'>);
                }

            } else {
                // Vente simple, 100% du revenu net au vendeur principal
                const sellerWalletRef = db.collection('wallets').doc(product.createdBy);
                t.update(sellerWalletRef, {
                    balance: FieldValue.increment(netRevenue),
                    totalEarned: FieldValue.increment(netRevenue)
                });
                const creditTxRef = sellerWalletRef.collection('transactions').doc();
                t.set(creditTxRef, {
                    amount: netRevenue, type: 'credit', createdAt: Timestamp.now(),
                    description: `Vente: ${product.title}`, status: 'success', reference: purchaseId
                } as Omit<Transaction, 'id'>);
            }
            
            // First sale bonus logic
            if (!seller.hasMadeFirstSale && firstSaleBonus > 0) {
                t.update(sellerRef, {
                    rewardPoints: FieldValue.increment(firstSaleBonus),
                    hasMadeFirstSale: true,
                });
                // We'll add the reward to the main seller's wallet
                const sellerWalletRef = db.collection('wallets').doc(product.createdBy);
                const rewardTxRef = sellerWalletRef.collection('transactions').doc();
                t.set(rewardTxRef, {
                    amount: firstSaleBonus, type: 'reward', createdAt: Timestamp.now(),
                    description: `Bonus pour votre première vente !`, status: 'success', reference: purchaseId
                } as Omit<Transaction, 'id'|'path'>);
            }

            return { purchaseId: purchaseId, message: "Achat effectué avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...purchaseResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de l\'achat:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
