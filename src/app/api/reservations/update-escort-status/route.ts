// /src/app/api/reservations/update-escort-status/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Reservation, ConfirmationStatus } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { reservationId, escortId, status } = await request.json() as { reservationId: string, escortId: string, status: ConfirmationStatus };

        if (!reservationId || !escortId || !status || !['confirmed', 'declined'].includes(status)) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
        }
        
        const reservationRef = db.collection('reservations').doc(reservationId);

        await db.runTransaction(async (t) => {
            const reservationDoc = await t.get(reservationRef);
            if (!reservationDoc.exists) {
                throw new Error("La réservation n'existe pas.");
            }
            const reservation = reservationDoc.data() as Reservation;

            // Check if the user is part of the reservation
            if (!reservation.escorts?.some(e => e.id === escortId)) {
                 throw new Error("Action non autorisée. L'escorte ne fait pas partie de cette réservation.");
            }

            // Check if status is already set
            if (reservation.escortConfirmations[escortId]?.status !== 'pending') {
                throw new Error("Le statut de cette invitation a déjà été défini.");
            }

            const updatePath = `escortConfirmations.${escortId}.status`;
            const confirmationTimePath = `escortConfirmations.${escortId}.confirmedAt`;

            t.update(reservationRef, {
                [updatePath]: status,
                [confirmationTimePath]: Timestamp.now()
            });
        });
        
        return NextResponse.json({ status: 'success', message: `Invitation ${status === 'confirmed' ? 'acceptée' : 'refusée'}.` });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut de l'escorte:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
