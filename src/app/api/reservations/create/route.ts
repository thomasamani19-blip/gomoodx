
// /src/app/api/reservations/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Annonce, Wallet, Reservation, Transaction, Settings } from '@/lib/types';

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
        const { memberId, annonceId, reservationDate, escorts, durationHours } = await request.json();

        if (!memberId || !annonceId || !reservationDate) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la réservation.' }, { status: 400 });
        }
        
        const reservationDateTime = new Date(reservationDate);

        const annonceRef = db.collection('services').doc(annonceId);
        const memberWalletRef = db.collection('wallets').doc(memberId);
        const settingsRef = db.collection('settings').doc('global');

        const reservationResult = await db.runTransaction(async (t) => {
            const annonceDoc = await t.get(annonceRef);
            if (!annonceDoc.exists) throw new Error("L'annonce demandée n'existe pas.");
            const annonce = annonceDoc.data() as Annonce;

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) throw new Error("Portefeuille du membre introuvable.");
            const memberWallet = memberWalletDoc.data() as Wallet;

            const creatorWalletRef = db.collection('wallets').doc(annonce.createdBy);
            const creatorWalletDoc = await t.get(creatorWalletRef);
            if (!creatorWalletDoc.exists) throw new Error("Portefeuille du créateur introuvable.");
            
            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
            
            const settingsDoc = await t.get(settingsRef);
            const commissionRate = (settingsDoc.data() as Settings)?.platformCommissionRate || 0;
            
            const numberOfPeople = 1 + (escorts?.length || 0);
            const totalAmount = annonce.price * numberOfPeople;

            if (memberWallet.balance < totalAmount) {
                throw new Error("Solde insuffisant pour effectuer cette réservation.");
            }

            const reservationId = db.collection('reservations').doc().id;
            const reservationRef = db.collection('reservations').doc(reservationId);

            const newReservation: Omit<Reservation, 'id'> = {
                memberId: memberId,
                creatorId: annonce.createdBy,
                annonceId: annonceId,
                annonceTitle: annonce.title,
                amount: totalAmount,
                status: 'pending', // Reservations now need confirmation
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.fromDate(reservationDateTime),
                durationHours: durationHours || null,
                escorts: escorts || [],
            };
            t.set(reservationRef, newReservation);

            t.update(memberWalletRef, {
                balance: FieldValue.increment(-totalAmount),
                totalSpent: FieldValue.increment(totalAmount)
            });

            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: totalAmount, type: 'purchase', createdAt: Timestamp.now(),
                description: `Réservation: ${annonce.title}`, status: 'success', reference: reservationId
            } as Omit<Transaction, 'id'>);

            const commissionAmount = totalAmount * commissionRate;
            const creatorAmount = totalAmount - commissionAmount;

            t.update(creatorWalletRef, {
                balance: FieldValue.increment(creatorAmount),
                totalEarned: FieldValue.increment(creatorAmount)
            });

            const creditTxRef = creatorWalletRef.collection('transactions').doc();
            t.set(creditTxRef, {
                amount: creatorAmount, type: 'credit', createdAt: Timestamp.now(),
                description: `Revenu réservation: ${annonce.title}`, status: 'success', reference: reservationId
            } as Omit<Transaction, 'id'>);

            t.update(platformWalletRef, { balance: FieldValue.increment(commissionAmount), totalEarned: FieldValue.increment(commissionAmount) });
            const platformTxRef = platformWalletRef.collection('transactions').doc();
            t.set(platformTxRef, {
                amount: commissionAmount, type: 'commission', createdAt: Timestamp.now(),
                description: `Commission sur réservation: ${annonce.title}`, status: 'success', reference: reservationId
            } as Omit<Transaction, 'id'>);
            
            return { reservationId: reservationId, message: "Demande de réservation envoyée avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de la réservation:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
