
// /src/app/api/reservations/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import type { User, Wallet, Reservation, Transaction, Settings } from '@/lib/types';

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
        const { memberId, creatorId, reservationDate, durationHours, location, notes, amount } = await request.json();

        if (!memberId || !creatorId || !reservationDate || !durationHours || !location || amount === undefined) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la réservation.' }, { status: 400 });
        }
        
        const reservationDateTime = new Date(reservationDate);
        const totalAmount = Number(amount);

        const creatorRef = db.collection('users').doc(creatorId);
        const memberWalletRef = db.collection('wallets').doc(memberId);
        const settingsRef = db.collection('settings').doc('global');

        const reservationResult = await db.runTransaction(async (t) => {
            const creatorDoc = await t.get(creatorRef);
            if (!creatorDoc.exists || creatorDoc.data()?.role !== 'escorte') throw new Error("Le créateur demandé n'existe pas ou n'est pas une escorte.");
            const creator = creatorDoc.data() as User;

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) throw new Error("Portefeuille du membre introuvable.");
            const memberWallet = memberWalletDoc.data() as Wallet;
            
            const settingsDoc = await t.get(settingsRef);
            const serviceFee = (settingsDoc.data() as Settings)?.platformFee || 20;
            const creatorRate = creator.rates?.escortPerHour || 0;
            if (creatorRate <= 0) throw new Error("Le tarif du créateur n'est pas défini.");

            // Recalculate price on server to prevent tampering
            const serverCalculatedAmount = (creatorRate * durationHours) + serviceFee;
            if (Math.abs(serverCalculatedAmount - totalAmount) > 0.01) { // Allow for floating point inaccuracies
                throw new Error("Le montant de la réservation ne correspond pas au calcul du serveur.");
            }
            
            if (memberWallet.balance < totalAmount) {
                throw new Error("Solde insuffisant pour effectuer cette réservation.");
            }
            
            // 1. Debit member's wallet
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-totalAmount),
                totalSpent: FieldValue.increment(totalAmount)
            });

            // 2. Create reservation document
            const reservationId = db.collection('reservations').doc().id;
            const reservationRef = db.collection('reservations').doc(reservationId);
            
            const newReservation: Omit<Reservation, 'id'> = {
                memberId: memberId,
                creatorId: creatorId, 
                annonceId: `reservation-${creatorId}`,
                annonceTitle: `Rendez-vous avec ${creator.displayName}`,
                amount: totalAmount,
                status: 'pending',
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.fromDate(reservationDateTime),
                durationHours: durationHours,
                location: location,
                notes: notes,
                fee: serviceFee,
                escorts: [], // Not applicable for escort booking
                establishmentConfirmed: true, // Auto-confirmed for this flow
                escortConfirmations: {
                    [creatorId]: {
                        status: 'pending'
                    }
                },
                memberPresenceConfirmed: false,
                establishmentPresenceConfirmed: false, // Not applicable, creator confirms
            };
            t.set(reservationRef, newReservation);

            // 3. Create a debit transaction for the member
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: totalAmount, type: 'debit', createdAt: Timestamp.now(),
                description: `Paiement RDV: ${creator.displayName}`, status: 'success', reference: reservationId
            } as Omit<Transaction, 'id'>);
            
            return { reservationId: reservationId, message: "Demande de réservation envoyée avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de la réservation:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
