// /src/app/api/reservations/create-escort/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Reservation, Wallet, Transaction, User, Settings } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { memberId, creatorId, reservationDate, durationHours, location, notes, amount } = await request.json();

        if (!memberId || !creatorId || !reservationDate || !durationHours || !amount) {
            return NextResponse.json({ status: 'error', message: 'Informations de réservation manquantes.' }, { status: 400 });
        }

        const memberWalletRef = db.collection('wallets').doc(memberId);
        
        const reservationResult = await db.runTransaction(async (t) => {
            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists || (memberWalletDoc.data() as Wallet).balance < amount) {
                throw new Error("Solde insuffisant ou portefeuille introuvable.");
            }
            
            const settingsDoc = await t.get(db.collection('settings').doc('global'));
            const platformFee = (settingsDoc.data() as Settings)?.platformFee || 0;

            // Débiter le portefeuille du membre pour le montant total
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-amount),
                totalSpent: FieldValue.increment(amount)
            });

            // Créer une transaction de débit
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount,
                type: 'debit',
                createdAt: Timestamp.now(),
                description: `Paiement réservation`,
                status: 'success',
                reference: debitTxRef.id
            } as Omit<Transaction, 'id' | 'path'>);

            // Créer la réservation
            const reservationRef = db.collection('reservations').doc();
            
            const newReservation: Omit<Reservation, 'id'> = {
                memberId,
                creatorId,
                annonceId: '', // Pas d'annonce spécifique pour un RDV direct
                annonceTitle: `Rendez-vous avec ${creatorId}`,
                amount,
                fee: platformFee,
                status: 'pending',
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.fromDate(new Date(reservationDate)),
                durationHours,
                location,
                notes,
                escortConfirmations: {},
                memberPresenceConfirmed: false,
                establishmentConfirmed: false, // Not an establishment booking
                establishmentPresenceConfirmed: false
            };
            t.set(reservationRef, newReservation);

            return { reservationId: reservationRef.id, message: "Demande de réservation envoyée." };
        });

        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error("Erreur lors de la création de la réservation:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
