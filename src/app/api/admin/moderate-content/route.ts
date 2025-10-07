// /src/app/api/admin/moderate-content/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, updateDoc, doc } from 'firebase-admin/firestore';
import type { ModerationStatus } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        // TODO: Add admin/moderator role verification here for security.

        const { contentId, collectionPath, newStatus } = await request.json();

        if (!contentId || !collectionPath || !newStatus) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes.' }, { status: 400 });
        }

        if (!['approved', 'rejected'].includes(newStatus)) {
            return NextResponse.json({ status: 'error', message: 'Statut invalide.' }, { status: 400 });
        }
        
        if (!['posts', 'products', 'services'].includes(collectionPath)) {
            return NextResponse.json({ status: 'error', message: 'Type de contenu invalide.' }, { status: 400 });
        }

        const contentRef = doc(db, collectionPath, contentId);

        await updateDoc(contentRef, {
            moderationStatus: newStatus as ModerationStatus,
        });

        return NextResponse.json({
            status: 'success', 
            message: `Contenu mis à jour avec le statut : ${newStatus}.`,
        });

    } catch (error: any) {
        console.error("Erreur lors de la modération du contenu:", error);
        return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
    }
}
