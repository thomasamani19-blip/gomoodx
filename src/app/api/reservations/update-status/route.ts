
// /src/app/api/reservations/update-status/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Reservation, ReservationStatus, Wallet } from '@/lib/types';

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

        if (!reservationId || !userId || !newStatus || !['confirmed', 'cancelled'].includes(newStatus)) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes ou statut invalide.' }, { status: 400 });
        }
        
        const reservationRef = db.collection('reservations').doc(reservationId);

        await db.runTransaction(async (t) => {
            const reservationDoc = await t.get(reservationRef);
            if (!reservationDoc.exists) {
                throw new Error("La réservation/commande n'existe pas.");
            }
            const reservation = reservationDoc.data() as Reservation;

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
                 if (reservation.status === 'completed' || reservation.status === 'cancelled') {
                    throw new Error("Cette réservation/commande ne peut plus être annulée.");
                 }

                 // Refund logic
                 const memberWalletRef = db.collection('wallets').doc(reservation.memberId);
                 t.update(memberWalletRef, { balance: FieldValue.increment(reservation.amount) });
                 
                 const refundTxRef = memberWalletRef.collection('transactions').doc();
                 t.set(refundTxRef, {
                    amount: reservation.amount,
                    type: 'debit', 
                    description: `Remboursement annulation: ${reservation.annonceTitle}`,
                    status: 'success',
                    createdAt: Timestamp.now(),
                    reference: reservation.id
                 });

                 // If funds were in escrow, remove them
                 const wasInEscrow = reservation.status === 'pending_delivery' || reservation.status === 'confirmed';
                 if(wasInEscrow) {
                     const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                     const platformWalletDoc = await t.get(platformWalletRef);
                     if (platformWalletDoc.exists) {
                        const platformWallet = platformWalletDoc.data() as Wallet;
                        if ((platformWallet.escrowBalance || 0) >= reservation.amount) {
                            t.update(platformWalletRef, { escrowBalance: FieldValue.increment(-reservation.amount) });
                        }
                     }
                 }

                 t.update(reservationRef, { status: 'cancelled' });
            }
        });
        
        return NextResponse.json({ status: 'success', message: `Statut de la réservation mis à jour.` });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
