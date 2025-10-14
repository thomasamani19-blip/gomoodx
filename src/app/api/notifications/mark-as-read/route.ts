
// /src/app/api/notifications/mark-as-read/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, writeBatch, doc } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, notificationIds } = await request.json();

        if (!userId || !notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
        }
        
        // Firestore batch writes are limited to 500 operations.
        // If you expect more, you would need to chunk the array.
        if (notificationIds.length > 500) {
            return NextResponse.json({ status: 'error', message: 'Trop de notifications à mettre à jour en une seule fois.' }, { status: 400 });
        }

        const batch = writeBatch(db);

        for (const notifId of notificationIds) {
            const notifRef = doc(db, 'notifications', notifId);
            // In a real app, you would add a security rule to check if the notification belongs to the userId
            batch.update(notifRef, { isRead: true });
        }

        await batch.commit();

        return NextResponse.json({ status: 'success', message: 'Notifications marquées comme lues.' });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour des notifications:", error);
        return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
    }
}
