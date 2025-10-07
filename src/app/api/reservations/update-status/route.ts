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
            const isEstablishment = reservation.creatorId === userId;

            if (!isMember && !isEstablishment) {
                throw new Error("Action non autorisée.");
            }
            
            if (newStatus === 'confirmed') {
                if (!isEstablishment) throw new Error("Seul l'établissement peut confirmer une réservation.");
                if (reservation.status !== 'pending') throw new Error("La réservation doit être en attente pour être confirmée.");
                
                // Check if all escorts have confirmed
                const allEscortsConfirmed = reservation.escorts?.every(e => reservation.escortConfirmations[e.id]?.status === 'confirmed') ?? true;
                if (!allEscortsConfirmed) {
                    throw new Error("Toutes les escortes n'ont pas encore confirmé leur participation.");
                }

                t.update(reservationRef, {
                    status: 'confirmed',
                    establishmentConfirmed: true,
                    establishmentConfirmedAt: Timestamp.now()
                });

            } else if (newStatus === 'cancelled') {
                 if (reservation.status !== 'pending') throw new Error("Seules les réservations en attente peuvent être annulées.");
                 t.update(reservationRef, { status: 'cancelled' });
            }
        });
        
        return NextResponse.json({ status: 'success', message: `Statut de la réservation mis à jour.` });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
