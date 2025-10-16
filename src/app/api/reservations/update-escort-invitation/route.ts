
// /src/app/api/reservations/update-escort-invitation/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Reservation, Wallet, Transaction } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { reservationId, memberId, escortIdToRemove } = await request.json();

        if (!reservationId || !memberId || !escortIdToRemove) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes.' }, { status: 400 });
        }
        
        const reservationRef = db.collection('reservations').doc(reservationId);
        const memberWalletRef = db.collection('wallets').doc(memberId);
        
        await db.runTransaction(async (t) => {
            const reservationDoc = await t.get(reservationRef);
            if (!reservationDoc.exists) throw new Error("La réservation n'existe pas.");
            
            const reservation = reservationDoc.data() as Reservation;

            if (reservation.memberId !== memberId) {
                throw new Error("Action non autorisée.");
            }
            if (reservation.status !== 'pending') {
                throw new Error("Vous ne pouvez modifier que les réservations en attente.");
            }

            const escortToRemove = reservation.escorts?.find(e => e.id === escortIdToRemove);
            if (!escortToRemove) {
                throw new Error("L'escorte à retirer ne fait pas partie de cette réservation.");
            }

            const escortStatus = reservation.escortConfirmations[escortIdToRemove]?.status;
            if (escortStatus !== 'pending') {
                throw new Error(`Vous ne pouvez pas retirer une escorte qui a déjà ${escortStatus === 'confirmed' ? 'accepté' : 'refusé'} l'invitation.`);
            }

            // --- Logic to remove the escort and refund the cost ---
            
            // 1. Calculate the cost to refund
            const costToRefund = (escortToRemove.rate || 0) * (reservation.durationHours || 1);
            if (costToRefund <= 0) {
                 throw new Error("Erreur lors du calcul du remboursement.");
            }
            
            // 2. Refund the client's wallet
            t.update(memberWalletRef, {
                balance: FieldValue.increment(costToRefund)
            });
            
            // 3. Remove the money from escrow
            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
            t.update(platformWalletRef, {
                escrowBalance: FieldValue.increment(-costToRefund)
            });

            // 4. Update the reservation object
            const newEscorts = reservation.escorts?.filter(e => e.id !== escortIdToRemove);
            const newEscortConfirmations = { ...reservation.escortConfirmations };
            delete newEscortConfirmations[escortIdToRemove];
            
            t.update(reservationRef, {
                escorts: newEscorts,
                escortConfirmations: newEscortConfirmations,
                amount: FieldValue.increment(-costToRefund)
            });
            
            // 5. Log the refund transaction
            const refundTxRef = memberWalletRef.collection('transactions').doc();
            t.set(refundTxRef, {
                amount: costToRefund,
                type: 'credit',
                description: `Remboursement - annulation invitation de ${escortToRemove.name}`,
                status: 'success',
                createdAt: FieldValue.serverTimestamp(),
                reference: reservationId,
            } as Omit<Transaction, 'id'|'path'>);
            
        });
        
        return NextResponse.json({ status: 'success', message: 'L\'invitation a été annulée et les fonds remboursés.' });

    } catch (error: any) {
        console.error("Erreur lors de la modification de l'invitation:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
