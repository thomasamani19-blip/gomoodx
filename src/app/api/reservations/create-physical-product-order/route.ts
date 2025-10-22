
// /src/app/api/reservations/create-physical-product-order/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Reservation, Wallet, Transaction, User, Settings, Product } from '@/lib/types';

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
            return NextResponse.json({ status: 'error', message: 'Informations de commande manquantes.' }, { status: 400 });
        }

        const memberWalletRef = db.collection('wallets').doc(memberId);
        const productRef = db.collection('products').doc(productId);
        
        const reservationResult = await db.runTransaction(async (t) => {
            const memberWalletDoc = await t.get(memberWalletRef);
            
            const productDoc = await t.get(productRef);
            if (!productDoc.exists) throw new Error("Produit introuvable.");
            const productData = productDoc.data()! as Product;
            const amount = productData.price;

            // Stock check
            if (productData.productType === 'physique') {
                const currentQuantity = productData.quantity ?? 0;
                if (currentQuantity < 1) {
                    throw new Error(`Le produit "${productData.title}" est en rupture de stock.`);
                }
            }
            
            if (!memberWalletDoc.exists || (memberWalletDoc.data() as Wallet).balance < amount) {
                throw new Error("Solde insuffisant ou portefeuille introuvable.");
            }

            // Débiter le portefeuille du membre pour le montant total et placer en séquestre
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-amount),
                totalSpent: FieldValue.increment(amount)
            });

            // Créer une transaction de débit
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            const txId = debitTxRef.id;
            t.set(debitTxRef, {
                amount,
                type: 'purchase',
                description: `Achat produit: ${productData.title}`,
                status: 'pending_escrow',
                createdAt: Timestamp.now(),
                reference: txId
            } as Omit<Transaction, 'id' | 'path'>);
            
            // Placer les fonds dans le compte de séquestre de la plateforme
            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
            t.update(platformWalletRef, {
                escrowBalance: FieldValue.increment(amount)
            });


            // Créer la "réservation" qui représente la commande
            const reservationRef = db.collection('reservations').doc();
            
            const newReservation: Partial<Reservation> = {
                memberId,
                creatorId: productData.createdBy, // Seller ID
                annonceId: productId,
                annonceTitle: productData.title,
                amount: amount,
                fee: 0, // No specific service fee, handled by commission later
                status: 'pending_delivery',
                type: 'physical_product_order',
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.now(), // Use current date for order time
                quantity: 1, // Direct purchase is always for 1 item
            };
            t.set(reservationRef, newReservation);
            
            // Decrement stock if physical
            if (productData.productType === 'physique') {
                t.update(productRef, { quantity: FieldValue.increment(-1) });
            }

            return { reservationId: reservationRef.id, message: "Commande passée avec succès. En attente de livraison." };
        });

        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error("Erreur lors de la création de la commande:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
