
// /src/app/api/messages/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, addDoc, collection, writeBatch, doc } from 'firebase-admin/firestore';
import type { Message, Notification } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { senderId, receiverId, message } = await request.json();

        if (!senderId || !receiverId || !message) {
            return NextResponse.json({ status: 'error', message: "Informations manquantes pour envoyer le message." }, { status: 400 });
        }
        
        const senderDoc = await db.collection('users').doc(senderId).get();
        if (!senderDoc.exists) {
            return NextResponse.json({ status: 'error', message: "Expéditeur inconnu." }, { status: 404 });
        }
        const senderName = senderDoc.data()?.displayName || 'Quelqu\'un';

        const batch = writeBatch(db);

        // 1. Create Message
        const messageRef = doc(collection(db, 'messages'));
        const messageData: Omit<Message, 'id'> = {
            message,
            senderId,
            receiverId,
            createdAt: serverTimestamp() as any,
            isRead: false,
            type: 'text',
        };
        batch.set(messageRef, messageData);

        // 2. Create Notification for receiver
        const notificationRef = doc(collection(db, 'notifications'));
        const notificationData: Omit<Notification, 'id'> = {
            userId: receiverId,
            type: 'new_message',
            message: `Vous avez un nouveau message de ${senderName}.`,
            link: `/messagerie?contact=${senderId}`,
            isRead: false,
            createdAt: serverTimestamp() as any,
        };
        batch.set(notificationRef, notificationData);

        await batch.commit();

        return NextResponse.json({ status: 'success', message: 'Message envoyé.', messageId: messageRef.id });

    } catch (error: any) {
        console.error("Erreur lors de l'envoi du message:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
