
// /src/app/api/reservations/confirm-presence/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Reservation, Settings, Transaction, Product, User, Wallet } from '@/lib/types';

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
            let reservation = reservationDoc.data() as Reservation;

            if (reservation.status !== 'confirmed' && reservation.status !== 'pending_delivery') {
                throw new Error("La réservation doit être confirmée ou en attente de livraison pour pouvoir valider la présence/livraison.");
            }

            const isMember = reservation.memberId === userId;
            const isCreator = reservation.creatorId === userId;
            const isInvitedEscort = reservation.escorts?.some(e => e.id === userId);


            if (!isMember && !isCreator && !isInvitedEscort) {
                throw new Error("Action non autorisée.");
            }
            
            // Update presence/delivery status
            if (isMember) {
                if (reservation.memberPresenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence/réception.");
                t.update(reservationRef, { memberPresenceConfirmed: true });
            }

            if (isCreator) {
                if (reservation.establishmentPresenceConfirmed) throw new Error("Vous avez déjà confirmé la présence du client.");
                t.update(reservationRef, { establishmentPresenceConfirmed: true });
            }
            
            if (isInvitedEscort) {
                 if (reservation.escortConfirmations[userId]?.presenceConfirmed) throw new Error("Vous avez déjà confirmé votre présence.");
                 const updatePath = `escortConfirmations.${userId}.presenceConfirmed`;
                 t.update(reservationRef, { [updatePath]: true });
            }

            // --- Check if all participants have now confirmed ---
            const updatedReservationDoc = await t.get(reservationRef); // Re-fetch to get updated data within transaction
            const updatedReservation = updatedReservationDoc.data() as Reservation;

            const confirmedAndParticipatingEscorts = updatedReservation.escorts?.filter(e => updatedReservation.escortConfirmations[e.id]?.status === 'confirmed') || [];
            const allInvitedEscortsConfirmedPresence = confirmedAndParticipatingEscorts.every(e => updatedReservation.escortConfirmations[e.id]?.presenceConfirmed) ?? true;
            
            const creatorConfirmed = updatedReservation.establishmentPresenceConfirmed;
            const memberConfirmed = updatedReservation.memberPresenceConfirmed;

            // Logic for a physical product order
            if (updatedReservation.type === 'physical_product_order') {
                if (memberConfirmed && creatorConfirmed) {
                     // Both buyer and seller confirmed, release funds
                    t.update(reservationRef, { status: 'completed' });
                    
                    const settingsDoc = await t.get(db.collection('settings').doc('global'));
                    const settings = settingsDoc.data() as Settings;
                    const commissionRate = settings?.platformCommissionRate || 0.20;
                    const firstSaleBonus = settings?.rewards?.firstSaleBonus || 0;

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
                    t.set(platformTxRef, { amount: commissionAmount, type: 'commission', description: `Commission sur vente: ${reservation.annonceTitle}`, status: 'success', createdAt: Timestamp.now(), reference: reservation.id });

                    const sellerTxRef = sellerWalletRef.collection('transactions').doc();
                    t.set(sellerTxRef, { amount: sellerAmount, type: 'credit', description: `Vente: ${reservation.annonceTitle}`, status: 'success', createdAt: Timestamp.now(), reference: reservation.id });
                    
                    // First sale bonus logic
                    if (!seller.hasMadeFirstSale && firstSaleBonus > 0) {
                        t.update(sellerRef, {
                            rewardPoints: FieldValue.increment(firstSaleBonus),
                            hasMadeFirstSale: true,
                        });
                        const rewardTxRef = sellerWalletRef.collection('transactions').doc();
                        t.set(rewardTxRef, { amount: firstSaleBonus, type: 'reward', description: `Bonus pour votre première vente !`, status: 'success', createdAt: Timestamp.now(), reference: reservation.id });
                    }

                    return { message: "Livraison confirmée des deux côtés. La commande est terminée et les fonds ont été transférés." };
                }

            } else { // Logic for service/establishment booking
                if (memberConfirmed && creatorConfirmed && allInvitedEscortsConfirmedPresence) {
                    t.update(reservationRef, { status: 'completed' });
                    
                    // Release funds from escrow
                    const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
                    t.update(platformWalletRef, { escrowBalance: FieldValue.increment(-reservation.amount) });
                    
                    // Credit platform with service fee
                    const serviceFee = reservation.fee || 0;
                    if (serviceFee > 0) {
                        t.update(platformWalletRef, { balance: FieldValue.increment(serviceFee), totalEarned: FieldValue.increment(serviceFee) });
                        const platformFeeTxRef = platformWalletRef.collection('transactions').doc();
                        t.set(platformFeeTxRef, { amount: serviceFee, type: 'commission', description: `Frais de service RDV: ${reservation.annonceTitle}`, status: 'success', reference: reservation.id });
                    }

                    // Calculate net revenue and distribute
                    const netRevenue = reservation.amount - serviceFee;
                    const settingsDoc = await t.get(db.collection('settings').doc('global'));
                    const settings = settingsDoc.data() as Settings;
                    const commissionRate = settings.platformCommissionRate || 0.20;
                    
                    let establishmentShare = netRevenue;
                    
                    // Pay invited escorts first
                    if (reservation.escorts) {
                        for(const escort of reservation.escorts) {
                             if(updatedReservation.escortConfirmations[escort.id]?.status === 'confirmed' && updatedReservation.escortConfirmations[escort.id]?.presenceConfirmed){
                                const escortTotal = (escort.rate || 0) * (reservation.durationHours || 1);
                                establishmentShare -= escortTotal;
                                
                                const commissionOnEscort = escortTotal * commissionRate;
                                const escortAmount = escortTotal - commissionOnEscort;

                                t.update(platformWalletRef, { balance: FieldValue.increment(commissionOnEscort), totalEarned: FieldValue.increment(commissionOnEscort) });
                                
                                const escortWalletRef = db.collection('wallets').doc(escort.id);
                                t.update(escortWalletRef, { balance: FieldValue.increment(escortAmount), totalEarned: FieldValue.increment(escortAmount) });
                             }
                        }
                    }

                    // Pay the main creator/establishment
                    const commissionOnCreator = establishmentShare * commissionRate;
                    const creatorAmount = establishmentShare - commissionOnCreator;
                    
                    t.update(platformWalletRef, { balance: FieldValue.increment(commissionOnCreator), totalEarned: FieldValue.increment(commissionOnCreator) });
                    const creatorWalletRef = db.collection('wallets').doc(reservation.creatorId);
                    t.update(creatorWalletRef, { balance: FieldValue.increment(creatorAmount), totalEarned: FieldValue.increment(creatorAmount) });

                    return { message: "Présence confirmée par toutes les parties. La réservation est terminée et les fonds ont été transférés." };
                }
            }
            
            return { message: "Confirmation enregistrée. En attente des autres participants." };
        });
        
        return NextResponse.json({ status: 'success', ...transactionResult });

    } catch (error: any) {
        console.error("Erreur lors de la confirmation de présence:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
