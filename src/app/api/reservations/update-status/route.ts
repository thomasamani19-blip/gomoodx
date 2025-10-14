
// /src/app/api/reservations/update-status/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Reservation, ReservationStatus, Settings, Product, User } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { reservationId, userId, newStatus } = await request.json() as { reservationId: string, userId: string, newStatus: ReservationStatus };

        if (!reservationId || !userId || !newStatus || !['confirmed', 'cancelled', 'completed'].includes(newStatus)) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
        }
        
        const reservationRef = db.collection('reservations').doc(reservationId);

        await db.runTransaction(async (t) => {
            const reservationDoc = await t.get(reservationRef);
            if (!reservationDoc.exists) {
                throw new Error("La réservation/commande n'existe pas.");
            }
            const reservation = reservationDoc.data() as Reservation;

            // Authorization checks
            const isMember = reservation.memberId === userId;
            const isCreator = reservation.creatorId === userId;

            if (!isMember && !isCreator) {
                throw new Error("Action non autorisée.");
            }
            
            if (newStatus === 'confirmed') {
                if (!isCreator) throw new Error("Seul le créateur peut confirmer une réservation.");
                if (reservation.status !== 'pending') throw new Error("La réservation doit être en attente pour être confirmée.");
                
                t.update(reservationRef, { status: 'confirmed' });

            } else if (newStatus === 'cancelled') {
                 if (reservation.status === 'completed') {
                    throw new Error("Cette réservation/commande ne peut plus être annulée.");
                 }
                 // Refund logic
                 const memberWalletRef = db.collection('wallets').doc(reservation.memberId);
                 t.update(memberWalletRef, { balance: FieldValue.increment(reservation.amount) });
                 
                 // Log refund transaction
                 const refundTxRef = memberWalletRef.collection('transactions').doc();
                 t.set(refundTxRef, {
                    amount: reservation.amount,
                    type: 'debit', 
                    description: `Remboursement annulation: ${reservation.annonceTitle}`,
                    status: 'success',
                    createdAt: Timestamp.now(),
                    reference: reservation.id
                 });
                 
                 // Reclaim from escrow if applicable
                 if(reservation.status === 'pending_delivery') {
                     const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                     t.update(platformWalletRef, { escrowBalance: FieldValue.increment(-reservation.amount) });
                 }

                 t.update(reservationRef, { status: 'cancelled' });
            } else if (newStatus === 'completed') {
                if (!isMember) throw new Error("Seul le client peut confirmer la finalisation.");
                if (reservation.type !== 'physical_product_order') throw new Error("Cette action n'est valable que pour les commandes de produits physiques.");
                if (reservation.status !== 'pending_delivery') throw new Error("La commande doit être en attente de livraison pour être complétée.");

                t.update(reservationRef, { status: 'completed' });
                
                // Release funds from escrow to seller
                const settingsDoc = await t.get(db.collection('settings').doc('global'));
                const settings = settingsDoc.data() as Settings;
                const commissionRate = settings?.platformCommissionRate || 0.20;
                const firstSaleBonus = settings?.rewards?.firstSaleBonus || 0;
                
                const productRef = db.collection('products').doc(reservation.annonceId);
                const productDoc = await t.get(productRef);
                const product = productDoc.data() as Product;

                const sellerRef = db.collection('users').doc(reservation.creatorId);
                const sellerDoc = await t.get(sellerRef);
                const seller = sellerDoc.data() as User;
                
                const totalAmount = reservation.amount;
                const commissionAmount = totalAmount * commissionRate;
                const sellerAmount = totalAmount - commissionAmount;

                // Move from escrow to platform and seller
                const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                t.update(platformWalletRef, { 
                    escrowBalance: FieldValue.increment(-totalAmount),
                    balance: FieldValue.increment(commissionAmount),
                    totalEarned: FieldValue.increment(commissionAmount)
                });
                const sellerWalletRef = db.collection('wallets').doc(reservation.creatorId);
                t.update(sellerWalletRef, {
                    balance: FieldValue.increment(sellerAmount),
                    totalEarned: FieldValue.increment(sellerAmount)
                });
                
                // Log transactions
                const platformTxRef = platformWalletRef.collection('transactions').doc();
                t.set(platformTxRef, { amount: commissionAmount, type: 'commission', description: `Commission sur vente: ${product.title}`, status: 'success', createdAt: Timestamp.now(), reference: reservation.id });

                const sellerTxRef = sellerWalletRef.collection('transactions').doc();
                t.set(sellerTxRef, { amount: sellerAmount, type: 'credit', description: `Vente: ${product.title}`, status: 'success', createdAt: Timestamp.now(), reference: reservation.id });
                
                // First sale bonus logic
                if (!seller.hasMadeFirstSale && firstSaleBonus > 0) {
                    t.update(sellerRef, {
                        rewardPoints: FieldValue.increment(firstSaleBonus),
                        hasMadeFirstSale: true,
                    });
                    const rewardTxRef = sellerWalletRef.collection('transactions').doc();
                    t.set(rewardTxRef, { amount: firstSaleBonus, type: 'reward', description: `Bonus pour votre première vente !`, status: 'success', createdAt: Timestamp.now(), reference: reservation.id });
                }

            }
        });
        
        return NextResponse.json({ status: 'success', message: `Statut de la réservation mis à jour.` });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
