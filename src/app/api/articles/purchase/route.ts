
// /src/app/api/articles/purchase/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { BlogArticle, Wallet, Purchase, Transaction, Settings, User } from '@/lib/types';

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
        const { memberId, articleId } = await request.json();

        if (!memberId || !articleId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour l\'achat.' }, { status: 400 });
        }
        
        const articleRef = db.collection('blog').doc(articleId);
        const memberWalletRef = db.collection('wallets').doc(memberId);
        const settingsRef = db.collection('settings').doc('global');

        const purchaseResult = await db.runTransaction(async (t) => {
            const articleDoc = await t.get(articleRef);
            if (!articleDoc.exists) throw new Error("L'article demandé n'existe pas.");
            const article = articleDoc.data() as BlogArticle;
            
            const articlePrice = article.price || 0;
            if (!article.isPremium || articlePrice <= 0) {
                 throw new Error("Cet article n'est pas payant.");
            }

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) throw new Error("Portefeuille du membre introuvable.");
            const memberWallet = memberWalletDoc.data() as Wallet;
            
            const sellerRef = db.collection('users').doc(article.authorId);
            const sellerDoc = await t.get(sellerRef);
            if (!sellerDoc.exists) throw new Error("Vendeur introuvable.");
            const seller = sellerDoc.data() as User;

            const sellerWalletRef = db.collection('wallets').doc(article.authorId);
            const sellerWalletDoc = await t.get(sellerWalletRef);
            if (!sellerWalletDoc.exists) throw new Error("Portefeuille du vendeur introuvable.");

            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);

            const settingsDoc = await t.get(settingsRef);
            const settingsData = settingsDoc.data() as Settings;
            const commissionRate = settingsData?.platformCommissionRate || 0.20;
            const firstSaleBonus = settingsData?.rewards?.firstSaleBonus || 0;

            
            if (memberWallet.balance < articlePrice) throw new Error("Solde insuffisant pour effectuer cet achat.");
            if (article.authorId === memberId) throw new Error("Vous ne pouvez pas acheter votre propre article.");

            // Vérifier si l'achat existe déjà
            const purchasesQuery = db.collection('purchases')
                                     .where('memberId', '==', memberId)
                                     .where('contentId', '==', articleId)
                                     .where('contentType', '==', 'article');
            const existingPurchase = await t.get(purchasesQuery);
            if (!existingPurchase.empty) {
                return { message: "Article déjà acheté.", status: 'already_purchased' };
            }


            const purchaseId = db.collection('purchases').doc().id;
            const purchaseRef = db.collection('purchases').doc(purchaseId);

            const newPurchase: Omit<Purchase, 'id'> = {
                memberId,
                sellerId: article.authorId,
                contentId: articleId,
                contentType: 'article',
                contentTitle: article.title,
                amount: articlePrice,
                status: 'completed',
                createdAt: Timestamp.now(),
            };
            t.set(purchaseRef, newPurchase);

            t.update(memberWalletRef, {
                balance: FieldValue.increment(-articlePrice),
                totalSpent: FieldValue.increment(articlePrice)
            });

            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: articlePrice, type: 'article_purchase', createdAt: Timestamp.now(),
                description: `Achat article: ${article.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);

            // Commission logic
            const commissionAmount = articlePrice * commissionRate;
            const sellerAmount = articlePrice - commissionAmount;

            // Credit seller
            t.update(sellerWalletRef, {
                balance: FieldValue.increment(sellerAmount),
                totalEarned: FieldValue.increment(sellerAmount)
            });
            const creditTxRef = sellerWalletRef.collection('transactions').doc();
            t.set(creditTxRef, {
                amount: sellerAmount, type: 'credit', createdAt: Timestamp.now(),
                description: `Vente article: ${article.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);

            // Credit platform
            t.update(platformWalletRef, { balance: FieldValue.increment(commissionAmount), totalEarned: FieldValue.increment(commissionAmount) });
            const platformTxRef = platformWalletRef.collection('transactions').doc();
            t.set(platformTxRef, {
                amount: commissionAmount, type: 'commission', createdAt: Timestamp.now(),
                description: `Commission sur vente article: ${article.title}`, status: 'success', reference: purchaseId
            } as Omit<Transaction, 'id'>);
            
            // First sale bonus logic
            if (!seller.hasMadeFirstSale && firstSaleBonus > 0) {
                t.update(sellerRef, {
                    rewardPoints: FieldValue.increment(firstSaleBonus),
                    hasMadeFirstSale: true,
                });
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
        console.error('Erreur lors de l\'achat de l\'article:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
