
// /src/app/api/reservations/confirm-presence/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Reservation, Settings, Transaction } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';

export async function POST(request: Request) {
    try {
        const { reservationId, userId } = await request.json();

        if (!reservationId || !userId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes.' }, { status: 400 });
        }
        
        const reservationRef = db.collection('reservations').doc(reservationId);
        
        const transactionResult = await db.runTransaction(async (t) => {
            const reservationDoc = await t.get(reservationRef);
            if (!reservationDoc.exists) throw new Error("La réservation n'existe pas.");
            const reservation = reservationDoc.data() as Reservation;

            if (reservation.status !== 'confirmed') {
                throw new Error("La réservation doit être confirmée pour pouvoir valider la présence.");
            }

            const isMember = reservation.memberId === userId;
            const isCreator = reservation.creatorId === userId;

            if (!isMember && !isCreator) {
                throw new Error("Action non autorisée.");
            }

            // Update presence status
            let memberConfirmed = reservation.memberPresenceConfirmed;
            let creatorConfirmed = reservation.escortConfirmations[reservation.creatorId]?.presenceConfirmed;

            if (isMember) {
                if (reservation.memberPresenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence.");
                t.update(reservationRef, { memberPresenceConfirmed: true });
                memberConfirmed = true;
            }

            if (isCreator) {
                if (reservation.escortConfirmations[reservation.creatorId]?.presenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence.");
                t.update(reservationRef, { [`escortConfirmations.${userId}.presenceConfirmed`]: true });
                creatorConfirmed = true;
            }

            // If both parties have now confirmed, complete the transaction
            if (memberConfirmed && creatorConfirmed) {
                t.update(reservationRef, { status: 'completed' });
                
                const settingsRef = db.collection('settings').doc('global');
                const settingsDoc = await t.get(settingsRef);
                const settings = settingsDoc.data() as Settings;
                const commissionRate = settings.platformCommissionRate || 0.20;

                const totalAmount = reservation.amount;
                const serviceFee = reservation.fee || settings.platformFee || 0;
                const creatorBookingAmount = totalAmount - serviceFee;
                
                const commissionAmount = creatorBookingAmount * commissionRate;
                const creatorAmount = creatorBookingAmount - commissionAmount;

                // Credit Creator's wallet
                const creatorWalletRef = db.collection('wallets').doc(reservation.creatorId);
                t.update(creatorWalletRef, {
                    balance: FieldValue.increment(creatorAmount),
                    totalEarned: FieldValue.increment(creatorAmount)
                });
                const creditTxRef = creatorWalletRef.collection('transactions').doc();
                t.set(creditTxRef, {
                    amount: creatorAmount, type: 'credit', createdAt: Timestamp.now(),
                    description: `Revenu RDV: ${reservation.annonceTitle}`, status: 'success', reference: reservation.id
                } as Omit<Transaction, 'id'>);


                // Credit Platform's wallet with commission + service fee
                const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                const platformTotal = commissionAmount + serviceFee;
                t.update(platformWalletRef, { balance: FieldValue.increment(platformTotal), totalEarned: FieldValue.increment(platformTotal) });
                const platformTxRef = platformWalletRef.collection('transactions').doc();
                t.set(platformTxRef, {
                    amount: platformTotal, type: 'commission', createdAt: Timestamp.now(),
                    description: `Commission & Frais RDV: ${reservation.annonceTitle}`, status: 'success', reference: reservation.id
                } as Omit<Transaction, 'id'>);
                
                return { message: "Présence confirmée. La réservation est terminée et les fonds ont été transférés." };
            }
            
            return { message: "Présence confirmée. En attente de l'autre participant." };
        });
        
        return NextResponse.json({ status: 'success', ...transactionResult });

    } catch (error: any) {
        console.error("Erreur lors de la confirmation de présence:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
