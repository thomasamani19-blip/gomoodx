
// /src/app/api/products/purchase/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Product, Wallet, Purchase, Transaction } from '@/lib/types';

// Assurer l'initialisation de Firebase Admin
if (!getApps().length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp();
    } else {
        console.warn("Firebase Admin SDK non initialisé. Configurez GOOGLE_APPLICATION_CREDENTIALS.");
    }
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { memberId, productId } = await request.json();

        if (!memberId || !productId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour l\'achat.' }, { status: 400 });
        }
        
        // Références des documents
        const productRef = db.collection('products').doc(productId);
        const memberWalletRef = db.collection('wallets').doc(memberId);

        // Exécuter une transaction Firestore
        const purchaseResult = await db.runTransaction(async (t) => {
            // 1. Lire les documents nécessaires dans la transaction
            const productDoc = await t.get(productRef);
            if (!productDoc.exists) {
                throw new Error("Le produit demandé n'existe pas.");
            }
            const product = productDoc.data() as Product;

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) {
                throw new Error("Portefeuille du membre introuvable.");
            }
            const memberWallet = memberWalletDoc.data() as Wallet;

            const sellerWalletRef = db.collection('wallets').doc(product.createdBy);
            const sellerWalletDoc = await t.get(sellerWalletRef);
            if (!sellerWalletDoc.exists) {
                throw new Error("Portefeuille du vendeur introuvable.");
            }

            // 2. Valider la logique métier
            if (memberWallet.balance < product.price) {
                throw new Error("Solde insuffisant pour effectuer cet achat.");
            }
            
            if (product.createdBy === memberId) {
                throw new Error("Vous ne pouvez pas acheter votre propre produit.");
            }

            // 3. Préparer les écritures
            const purchaseId = db.collection('purchases').doc().id;
            const purchaseRef = db.collection('purchases').doc(purchaseId);

            // Créer le document d'achat
            const newPurchase: Omit<Purchase, 'id'> = {
                memberId,
                sellerId: product.createdBy,
                productId,
                productTitle: product.title,
                amount: product.price,
                status: 'completed', // 'shipped' could be another status for physical goods
                createdAt: Timestamp.now(),
            };
            t.set(purchaseRef, newPurchase);

            // Mettre à jour le portefeuille du membre (débit)
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-product.price),
                totalSpent: FieldValue.increment(product.price)
            });

            // Mettre à jour le portefeuille du vendeur (crédit)
            t.update(sellerWalletRef, {
                balance: FieldValue.increment(product.price),
                totalEarned: FieldValue.increment(product.price)
            });
            
            // Créer la transaction de débit pour le membre
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: product.price,
                type: 'purchase',
                createdAt: Timestamp.now(),
                description: `Achat: ${product.title}`,
                status: 'success',
                reference: purchaseId
            } as Omit<Transaction, 'id'>);

            // Créer la transaction de crédit pour le vendeur
            const creditTxRef = sellerWalletRef.collection('transactions').doc();
            t.set(creditTxRef, {
                amount: product.price,
                type: 'credit',
                createdAt: Timestamp.now(),
                description: `Vente: ${product.title}`,
                status: 'success',
                reference: purchaseId
            } as Omit<Transaction, 'id'>);
            
            return { purchaseId: purchaseId, message: "Achat effectué avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...purchaseResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de l\'achat:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
