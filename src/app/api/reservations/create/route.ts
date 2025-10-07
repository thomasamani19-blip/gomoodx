
// /src/app/api/reservations/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, WriteBatch } from 'firebase-admin/firestore';
import type { Annonce, Wallet, Reservation, Transaction, Settings, User, EscortConfirmation } from '@/lib/types';

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

        if (!memberId || !annonceId || !reservationDate || amount === undefined) {
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
            
            const establishmentUserDoc = await t.get(db.collection('users').doc(annonce.createdBy));
            if (!establishmentUserDoc.exists) throw new Error("L'établissement est introuvable.");
            const establishmentUser = establishmentUserDoc.data() as User;
            const establishmentPricing = establishmentUser.establishmentSettings?.pricing;
            if (!establishmentPricing) throw new Error("La tarification de l'établissement est introuvable.");


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
            
            // Recalculate price on server to prevent tampering
            const roomPricePerHour = establishmentPricing.basePricePerHour || 0;
            const roomSupplement = establishmentPricing.roomTypes[roomType as keyof typeof establishmentPricing.roomTypes]?.supplement || 0;
            const establishmentShare = (durationHours * roomPricePerHour) + roomSupplement;
            
            let escortsShareTotal = 0;
            if (escorts && escorts.length > 0) {
                 escortsShareTotal = escorts.reduce((acc: number, escort: any) => acc + (escort.rate * durationHours), 0);
            }
            
            const serverCalculatedAmount = establishmentShare + escortsShareTotal;
            if (Math.abs(serverCalculatedAmount - totalAmount) > 0.01) { // Allow for floating point inaccuracies
                throw new Error("Le montant de la réservation ne correspond pas au calcul du serveur.");
            }


            const reservationId = db.collection('reservations').doc().id;
            const reservationRef = db.collection('reservations').doc(reservationId);

            // Initialize escort confirmations
            const escortConfirmations: { [key: string]: EscortConfirmation } = {};
            if (escorts && escorts.length > 0) {
                for (const escort of escorts) {
                    escortConfirmations[escort.id] = {
                        status: 'pending'
                    };
                }
            }


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
                establishmentConfirmed: false,
                escortConfirmations: escortConfirmations,
                memberPresenceConfirmed: false,
                establishmentPresenceConfirmed: false,
            };
            t.set(reservationRef, newReservation);

            // Pour l'instant, on ne gère pas le paiement final ici, car il dépend des confirmations.
            // On pourrait créer une transaction en attente ou simplement la gérer plus tard.
            // Pour ce prototype, nous nous concentrons sur la création de la réservation avec les bons statuts.

            return { reservationId: reservationId, message: "Demande de réservation envoyée avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de la réservation:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
