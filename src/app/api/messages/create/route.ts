// /src/app/api/messages/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, addDoc, collection } from 'firebase-admin/firestore';
import type { Message } from '@/lib/types';

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
        
        const messageData: Omit<Message, 'id'> = {
            message,
            senderId,
            receiverId,
            createdAt: serverTimestamp() as any,
            isRead: false,
            type: 'text',
        };

        const messageRef = await addDoc(collection(db, 'messages'), messageData);

        // TODO: Ajouter la logique de notification ici

        return NextResponse.json({ status: 'success', message: 'Message envoyé.', messageId: messageRef.id });

    } catch (error: any) {
        console.error("Erreur lors de l'envoi du message:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
