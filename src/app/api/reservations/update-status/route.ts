
// /src/app/api/reservations/update-status/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Reservation, ReservationStatus } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { reservationId, userId, newStatus } = await request.json() as { reservationId: string, userId: string, newStatus: ReservationStatus };

        if (!reservationId || !userId || !newStatus || !['confirmed', 'cancelled', 'completed'].includes(newStatus)) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
        }
        
        const reservationRef = db.collection('reservations').doc(reservationId);

        await db.runTransaction(async (t) => {
            const reservationDoc = await t.get(reservationRef);
            if (!reservationDoc.exists) {
                throw new Error("La réservation n'existe pas.");
            }
            const reservation = reservationDoc.data() as Reservation;

            // Authorization checks
            const isMember = reservation.memberId === userId;
            const isCreator = reservation.creatorId === userId;

            if (!isMember && !isCreator) {
                throw new Error("Action non autorisée.");
            }
            
            if (newStatus === 'confirmed') {
                if (!isCreator) throw new Error("Seul le créateur peut confirmer une réservation.");
                if (reservation.status !== 'pending') throw new Error("La réservation doit être en attente pour être confirmée.");
                
                t.update(reservationRef, {
                    status: 'confirmed',
                });

            } else if (newStatus === 'cancelled') {
                 if (reservation.status !== 'pending') throw new Error("Seules les réservations en attente peuvent être annulées.");
                 t.update(reservationRef, { status: 'cancelled' });
                 
                 // TODO: Rembourser le membre. Pour l'instant, on met à jour le statut.
                 // Cette logique sera plus complexe (rembourser le portefeuille, gérer les frais, etc.)
            }
        });
        
        return NextResponse.json({ status: 'success', message: `Statut de la réservation mis à jour.` });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
