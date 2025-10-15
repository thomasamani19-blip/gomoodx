
// /src/app/api/cart/checkout/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, collection, getDocs, writeBatch, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { CartItem, Product, Wallet } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ status: 'error', message: 'Utilisateur non identifié.' }, { status: 400 });
        }

        const cartCollectionRef = collection(db, 'users', userId, 'cart');
        const cartSnapshot = await getDocs(cartCollectionRef);

        if (cartSnapshot.empty) {
            throw new Error("Votre panier est vide.");
        }

        const cartItems = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
        const totalCost = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const memberWalletRef = db.collection('wallets').doc(userId);
        
        const batch = writeBatch(db);

        const memberWalletDoc = await memberWalletRef.get();
        if (!memberWalletDoc.exists || (memberWalletDoc.data() as Wallet).balance < totalCost) {
            throw new Error("Solde insuffisant pour finaliser la commande.");
        }

        // 1. Debit user's wallet and move funds to escrow
        batch.update(memberWalletRef, {
            balance: FieldValue.increment(-totalCost),
            totalSpent: FieldValue.increment(totalCost)
        });

        const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
        batch.update(platformWalletRef, {
            escrowBalance: FieldValue.increment(totalCost)
        });
        
        // Log a single transaction for the whole cart purchase
        const mainDebitTxRef = memberWalletRef.collection('transactions').doc();
        batch.set(mainDebitTxRef, {
            amount: totalCost,
            type: 'purchase',
            description: `Achat de ${cartItems.length} article(s) du panier`,
            status: 'pending_escrow',
            createdAt: Timestamp.now(),
            reference: mainDebitTxRef.id
        });

        // 2. Create a reservation for each physical product
        for (const item of cartItems) {
            const productRef = db.collection('products').doc(item.productId);
            const productDoc = await productRef.get();
            if (!productDoc.exists) throw new Error(`Produit ${item.title} non trouvé.`);
            const productData = productDoc.data() as Product;

            // We only create reservations for physical products from the cart for now.
            if (productData.productType === 'physique') {
                const reservationRef = db.collection('reservations').doc();
                batch.set(reservationRef, {
                    memberId: userId,
                    creatorId: productData.createdBy,
                    annonceId: item.productId,
                    annonceTitle: productData.title,
                    amount: item.price * item.quantity,
                    fee: 0,
                    status: 'pending_delivery',
                    type: 'physical_product_order',
                    createdAt: Timestamp.now(),
                    reservationDate: Timestamp.now(),
                    quantity: item.quantity,
                });
            }

            // 3. Delete item from cart
            const cartItemRef = db.collection('users', userId, 'cart').doc(item.id);
            batch.delete(cartItemRef);
        }

        await batch.commit();

        return NextResponse.json({ status: 'success', message: 'Commandes créées avec succès.' });

    } catch (error: any) {
        console.error("Erreur lors du checkout:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
