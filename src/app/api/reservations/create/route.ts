
// /src/app/api/reservations/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import type { Annonce, Wallet, Reservation, Transaction, Settings, User } from '@/lib/types';

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
        const { memberId, annonceId, reservationDate, escorts, durationHours, amount, roomType } = await request.json();

        if (!memberId || !annonceId || !reservationDate || !amount === undefined) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la réservation.' }, { status: 400 });
        }
        
        const reservationDateTime = new Date(reservationDate);
        const totalAmount = Number(amount);

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

            const establishmentWalletRef = db.collection('wallets').doc(annonce.createdBy);
            if (!(await t.get(establishmentWalletRef)).exists) throw new Error("Portefeuille de l'établissement introuvable.");

            const platformWalletRef = db.collection('wallets').doc(PLATFORM_WALLET_ID);
            
            const settingsDoc = await t.get(settingsRef);
            const commissionRate = (settingsDoc.data() as Settings)?.platformCommissionRate || 0.20;
            
            if (memberWallet.balance < totalAmount) {
                throw new Error("Solde insuffisant pour effectuer cette réservation.");
            }

            const reservationId = db.collection('reservations').doc().id;
            const reservationRef = db.collection('reservations').doc(reservationId);

            const newReservation: Omit<Reservation, 'id'> = {
                memberId: memberId,
                creatorId: annonce.createdBy, // establishment ID
                annonceId: annonceId,
                annonceTitle: annonce.title,
                amount: totalAmount,
                status: 'pending',
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.fromDate(reservationDateTime),
                durationHours: durationHours || null,
                escorts: escorts || [],
                roomType: roomType,
            };
            t.set(reservationRef, newReservation);

            // Débiter le membre du montant total
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-totalAmount),
                totalSpent: FieldValue.increment(totalAmount)
            });

            // Transaction de débit pour le membre
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: totalAmount, type: 'purchase', createdAt: Timestamp.now(),
                description: `Réservation: ${annonce.title}`, status: 'success', reference: reservationId
            } as Omit<Transaction, 'id'>);

            // Répartition des gains
            const establishmentPricing = (await t.get(db.collection('users').doc(annonce.createdBy))).data()?.establishmentSettings?.pricing;
            if (!establishmentPricing) throw new Error("La tarification de l'établissement est introuvable.");

            const roomPricePerHour = establishmentPricing.basePricePerHour || 0;
            const roomSupplement = establishmentPricing.roomTypes[roomType]?.supplement || 0;
            const establishmentShare = (durationHours * roomPricePerHour) + roomSupplement;
            
            const escortsShareTotal = totalAmount - establishmentShare;

            // Payer l'établissement
            const establishmentCommission = establishmentShare * commissionRate;
            const establishmentNet = establishmentShare - establishmentCommission;
            t.update(establishmentWalletRef, { balance: FieldValue.increment(establishmentNet), totalEarned: FieldValue.increment(establishmentNet) });
            const establishmentCreditTxRef = establishmentWalletRef.collection('transactions').doc();
            t.set(establishmentCreditTxRef, { amount: establishmentNet, type: 'credit', description: `Revenu réservation ${reservationId.substring(0,6)}`, reference: reservationId } as Omit<Transaction, 'id'>);

            // Payer chaque escorte
            for (const escort of (escorts || [])) {
                const escortRate = escort.rate || 0;
                const escortShare = escortRate * durationHours;
                const escortCommission = escortShare * commissionRate;
                const escortNet = escortShare - escortCommission;
                
                const escortWalletRef = db.collection('wallets').doc(escort.id);
                t.update(escortWalletRef, { balance: FieldValue.increment(escortNet), totalEarned: FieldValue.increment(escortNet) });
                const escortCreditTxRef = escortWalletRef.collection('transactions').doc();
                t.set(escortCreditTxRef, { amount: escortNet, type: 'credit', description: `Prestation pour réservation ${reservationId.substring(0,6)}`, reference: reservationId } as Omit<Transaction, 'id'>);
            }
            
            // Payer la plateforme
            const totalCommission = (establishmentShare + escortsShareTotal) * commissionRate;
            t.update(platformWalletRef, { balance: FieldValue.increment(totalCommission), totalEarned: FieldValue.increment(totalCommission) });

            return { reservationId: reservationId, message: "Demande de réservation envoyée avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de la réservation:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
