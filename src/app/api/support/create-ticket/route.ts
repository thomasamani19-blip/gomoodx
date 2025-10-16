// /src/app/api/support/create-ticket/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, addDoc, collection } from 'firebase-admin/firestore';
import type { SupportTicket } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, subject, message, relatedId } = await request.json();

        if (!userId || !subject || !message) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes.' }, { status: 400 });
        }

        const newTicket: Omit<SupportTicket, 'id'> = {
            userId,
            subject,
            message,
            relatedId: relatedId || null,
            status: 'open',
            createdAt: serverTimestamp() as any,
        };

        const ticketRef = await addDoc(collection(db, 'supportTickets'), newTicket);

        return NextResponse.json({ status: 'success', message: 'Ticket créé.', ticketId: ticketRef.id });
    } catch (error: any) {
        console.error("Erreur lors de la création du ticket:", error);
        return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
    }
}
