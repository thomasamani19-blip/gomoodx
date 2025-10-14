
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
            const isInvitedEscort = reservation.escorts?.some(e => e.id === userId);


            if (!isMember && !isCreator && !isInvitedEscort) {
                throw new Error("Action non autorisée.");
            }
            
            let allParticipantsConfirmed = false;

            // Update presence status
            if (isMember) {
                if (reservation.memberPresenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence.");
                t.update(reservationRef, { memberPresenceConfirmed: true });
            }

            if (isCreator) {
                if (reservation.establishmentPresenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence.");
                t.update(reservationRef, { establishmentPresenceConfirmed: true });
            }
            
            if (isInvitedEscort) {
                 if (reservation.escortConfirmations[userId]?.presenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence.");
                 const updatePath = `escortConfirmations.${userId}.presenceConfirmed`;
                 t.update(reservationRef, { [updatePath]: true });
            }

            // Check if all participants have now confirmed
            const updatedReservationDoc = await t.get(reservationRef); // Re-fetch to get updated data within transaction
            const updatedReservation = updatedReservationDoc.data() as Reservation;

            const allEscortsConfirmed = updatedReservation.escorts?.every(e => updatedReservation.escortConfirmations[e.id]?.presenceConfirmed) ?? true;
            
            if (updatedReservation.creatorId) { // For establishment booking
                 allParticipantsConfirmed = updatedReservation.memberPresenceConfirmed && updatedReservation.establishmentPresenceConfirmed && allEscortsConfirmed;
            } else { // For direct escort booking
                 allParticipantsConfirmed = updatedReservation.memberPresenceConfirmed && allEscortsConfirmed; // Assuming creator is also an escort here
            }

            // If all parties have now confirmed, complete the transaction
            if (allParticipantsConfirmed) {
                t.update(reservationRef, { status: 'completed' });
                
                const settingsRef = db.collection('settings').doc('global');
                const settingsDoc = await t.get(settingsRef);
                const settings = settingsDoc.data() as Settings;
                const commissionRate = settings.platformCommissionRate || 0.20;

                const totalAmount = reservation.amount;
                const serviceFee = reservation.fee || 0;
                const netRevenue = totalAmount - serviceFee;

                // Credit Platform's wallet with service fee
                 const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                 if (serviceFee > 0) {
                    t.update(platformWalletRef, { balance: FieldValue.increment(serviceFee), totalEarned: FieldValue.increment(serviceFee) });
                     const platformFeeTxRef = platformWalletRef.collection('transactions').doc();
                    t.set(platformFeeTxRef, {
                        amount: serviceFee, type: 'commission', createdAt: Timestamp.now(),
                        description: `Frais de service RDV: ${reservation.annonceTitle}`, status: 'success', reference: reservation.id
                    } as Omit<Transaction, 'id'>);
                 }

                // Distribute revenue between creator (establishment) and escorts
                const establishmentShare = reservation.escorts ? (netRevenue - (reservation.escorts.reduce((sum, e) => sum + (e.rate * (reservation.durationHours || 1)), 0))) : netRevenue;
                const commissionOnEstablishment = establishmentShare * commissionRate;
                const establishmentAmount = establishmentShare - commissionOnEstablishment;
                
                t.update(platformWalletRef, { balance: FieldValue.increment(commissionOnEstablishment), totalEarned: FieldValue.increment(commissionOnEstablishment) });
                 const platformCommTxRef = platformWalletRef.collection('transactions').doc();
                 t.set(platformCommTxRef, {
                    amount: commissionOnEstablishment, type: 'commission', createdAt: Timestamp.now(),
                    description: `Commission RDV: ${reservation.annonceTitle}`, status: 'success', reference: reservation.id
                } as Omit<Transaction, 'id'>);
                
                const creatorWalletRef = db.collection('wallets').doc(reservation.creatorId);
                t.update(creatorWalletRef, { balance: FieldValue.increment(establishmentAmount), totalEarned: FieldValue.increment(establishmentAmount) });
                 const creatorCreditTxRef = creatorWalletRef.collection('transactions').doc();
                 t.set(creatorCreditTxRef, {
                    amount: establishmentAmount, type: 'credit', createdAt: Timestamp.now(),
                    description: `Revenu RDV: ${reservation.annonceTitle}`, status: 'success', reference: reservation.id
                } as Omit<Transaction, 'id'>);

                if (reservation.escorts) {
                    for(const escort of reservation.escorts) {
                        const escortTotal = escort.rate * (reservation.durationHours || 1);
                        const commissionOnEscort = escortTotal * commissionRate;
                        const escortAmount = escortTotal - commissionOnEscort;

                        t.update(platformWalletRef, { balance: FieldValue.increment(commissionOnEscort), totalEarned: FieldValue.increment(commissionOnEscort) });
                        
                        const escortWalletRef = db.collection('wallets').doc(escort.id);
                        t.update(escortWalletRef, { balance: FieldValue.increment(escortAmount), totalEarned: FieldValue.increment(escortAmount) });
                    }
                }
                
                return { message: "Présence confirmée. La réservation est terminée et les fonds ont été transférés." };
            }
            
            return { message: "Présence confirmée. En attente des autres participants." };
        });
        
        return NextResponse.json({ status: 'success', ...transactionResult });

    } catch (error: any) {
        console.error("Erreur lors de la confirmation de présence:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
