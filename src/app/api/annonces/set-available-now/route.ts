// /src/app/api/annonces/set-available-now/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Annonce, Wallet, Transaction } from '@/lib/types';
import { addHours } from 'date-fns';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}

const db = getFirestore();
const FEATURE_COST = 5; // Coût de 5€
const DURATION_HOURS = 24;

export async function POST(request: Request) {
    try {
        const { userId, annonceId } = await request.json();

        if (!userId || !annonceId) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes.' }, { status: 400 });
        }
        
        const annonceRef = db.collection('services').doc(annonceId);
        const walletRef = db.collection('wallets').doc(userId);

        const activationResult = await db.runTransaction(async (t) => {
            const annonceDoc = await t.get(annonceRef);
            if (!annonceDoc.exists) throw new Error("L'annonce n'existe pas.");
            const annonceData = annonceDoc.data() as Annonce;

            if (annonceData.createdBy !== userId) {
                throw new Error("Action non autorisée.");
            }

            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) throw new Error("Portefeuille introuvable.");
            const walletData = walletDoc.data() as Wallet;

            if (walletData.balance < FEATURE_COST) {
                throw new Error("Solde insuffisant.");
            }

            // Débiter le portefeuille
            t.update(walletRef, {
                balance: walletData.balance - FEATURE_COST,
                totalSpent: (walletData.totalSpent || 0) + FEATURE_COST
            });
            
            // Créer une transaction de débit
            const debitTxRef = walletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: FEATURE_COST,
                type: 'debit',
                createdAt: Timestamp.now(),
                description: `Activation "Disponible maintenant" pour: ${annonceData.title}`,
                status: 'success',
                reference: annonceId
            } as Omit<Transaction, 'id'>);
            
            // Activer le statut sur l'annonce
            const expirationDate = addHours(new Date(), DURATION_HOURS);
            t.update(annonceRef, { 
                availableNowUntil: Timestamp.fromDate(expirationDate)
            });
            
            return { message: "Statut 'Disponible maintenant' activé pour 24h.", expiresAt: expirationDate.toISOString() };
        });
        
        return NextResponse.json({ status: 'success', ...activationResult });

    } catch (error: any) {
        console.error("Erreur lors de l'activation du statut:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
