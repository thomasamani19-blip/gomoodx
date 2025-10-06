// /src/app/api/content/sponsor/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Annonce, Product, Wallet, Transaction, ContentType } from '@/lib/types';

if (!getApps().length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp();
    } else {
        console.warn("Firebase Admin SDK non initialisé. Configurez GOOGLE_APPLICATION_CREDENTIALS.");
    }
}

const db = getFirestore();
const SPONSOR_COST = 10; // Coût de 10€ pour sponsoriser

export async function POST(request: Request) {
    try {
        const { userId, contentId, contentType } = await request.json() as { userId: string, contentId: string, contentType: ContentType };

        if (!userId || !contentId || !contentType) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la sponsorisation.' }, { status: 400 });
        }
        
        const contentCollectionPath = contentType === 'service' ? 'services' : 'products';
        const contentRef = db.collection(contentCollectionPath).doc(contentId);
        const walletRef = db.collection('wallets').doc(userId);

        const sponsorshipResult = await db.runTransaction(async (t) => {
            const contentDoc = await t.get(contentRef);
            if (!contentDoc.exists) {
                throw new Error("Le contenu à sponsoriser n'existe pas.");
            }
            const contentData = contentDoc.data() as Annonce | Product;

            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) {
                throw new Error("Portefeuille de l'utilisateur introuvable.");
            }
            const walletData = walletDoc.data() as Wallet;

            if (contentData.createdBy !== userId) {
                throw new Error("Action non autorisée. Vous n'êtes pas le propriétaire de ce contenu.");
            }

            if (walletData.balance < SPONSOR_COST) {
                throw new Error("Solde insuffisant pour sponsoriser ce contenu.");
            }

            // Débiter le portefeuille
            t.update(walletRef, {
                balance: walletData.balance - SPONSOR_COST,
                totalSpent: (walletData.totalSpent || 0) + SPONSOR_COST
            });
            
            // Créer une transaction de débit
            const debitTxRef = walletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: SPONSOR_COST,
                type: 'debit',
                createdAt: Timestamp.now(),
                description: `Sponsorisation: ${contentData.title}`,
                status: 'success',
                reference: contentId
            } as Omit<Transaction, 'id'>);

            // Mettre à jour le contenu pour le marquer comme sponsorisé
            t.update(contentRef, { isSponsored: true });
            
            return { message: "Contenu sponsorisé avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...sponsorshipResult });

    } catch (error: any) {
        console.error('Erreur lors de la sponsorisation:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
