// /src/app/api/reservations/create-establishment/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Reservation, Wallet, Transaction, User, Settings, EscortConfirmation } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();
const PLATFORM_WALLET_ID = 'platform_wallet';


export async function POST(request: Request) {
    try {
        const { memberId, annonceId, reservationDate, durationHours, escorts, amount, roomType, notes } = await request.json();

        if (!memberId || !annonceId || !reservationDate || !durationHours || !amount) {
            return NextResponse.json({ status: 'error', message: 'Informations de réservation manquantes.' }, { status: 400 });
        }

        const memberWalletRef = db.collection('wallets').doc(memberId);
        const annonceRef = db.collection('services').doc(annonceId);
        
        const reservationResult = await db.runTransaction(async (t) => {
            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists || (memberWalletDoc.data() as Wallet).balance < amount) {
                throw new Error("Solde insuffisant ou portefeuille introuvable.");
            }
            
            const annonceDoc = await t.get(annonceRef);
            if (!annonceDoc.exists) throw new Error("Annonce introuvable.");
            const annonceData = annonceDoc.data()!;

            const settingsDoc = await t.get(db.collection('settings').doc('global'));
            const platformFee = (settingsDoc.data() as Settings)?.platformFee || 0;

            // Débiter le portefeuille du membre pour le montant total
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-amount),
                totalSpent: FieldValue.increment(amount)
            });

            // Placer les fonds dans le compte de séquestre de la plateforme
            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
            t.update(platformWalletRef, {
                escrowBalance: FieldValue.increment(amount)
            });

            // Créer une transaction de débit
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount,
                type: 'debit',
                description: `Paiement réservation: ${annonceData.title}`,
                status: 'pending_escrow',
                createdAt: Timestamp.now(),
                reference: debitTxRef.id
            } as Omit<Transaction, 'id' | 'path'>);
            

            // Créer la réservation
            const reservationRef = db.collection('reservations').doc();
            
            const escortConfirmations: { [key: string]: EscortConfirmation } = {};
            if (escorts && escorts.length > 0) {
                escorts.forEach((escort: {id: string}) => {
                    escortConfirmations[escort.id] = { status: 'pending' };
                });
            }

            const newReservation: Omit<Reservation, 'id'> = {
                memberId,
                creatorId: annonceData.createdBy,
                annonceId,
                annonceTitle: annonceData.title,
                amount,
                fee: platformFee,
                status: 'pending',
                type: 'establishment',
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.fromDate(new Date(reservationDate)),
                durationHours,
                location: annonceData.location,
                notes,
                roomType,
                escorts,
                establishmentConfirmed: false,
                escortConfirmations,
                memberPresenceConfirmed: false,
                establishmentPresenceConfirmed: false,
            };
            t.set(reservationRef, newReservation);

            return { reservationId: reservationRef.id, message: "Demande de réservation envoyée." };
        });

        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error("Erreur lors de la création de la réservation d'établissement:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
