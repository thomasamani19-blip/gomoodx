// /src/app/api/reservations/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Annonce, Wallet, Reservation, Transaction } from '@/lib/types';

// Assurer l'initialisation de Firebase Admin
if (!getApps().length) {
    // Dans un environnement de production (comme Vercel ou Cloud Run), 
    // les credentials sont généralement fournis via des variables d'environnement.
    // Pour le développement local, vous pouvez utiliser un fichier de clé de service.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp();
    } else {
        // Fallback pour les environnements qui n'ont pas les credentials auto-configurés.
        // Vous devrez peut-être ajuster cela pour votre configuration.
        // initializeApp({ credential: cert(serviceAccount) });
        console.warn("Firebase Admin SDK non initialisé. Configurez GOOGLE_APPLICATION_CREDENTIALS.");
    }
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { memberId, annonceId, reservationDate } = await request.json();

        if (!memberId || !annonceId || !reservationDate) {
            return NextResponse.json({ status: 'error', message: 'Informations manquantes pour la réservation.' }, { status: 400 });
        }
        
        const reservationDateTime = new Date(reservationDate);

        // Références des documents
        const annonceRef = db.collection('services').doc(annonceId);
        const memberWalletRef = db.collection('wallets').doc(memberId);

        // Exécuter une transaction Firestore
        const reservationResult = await db.runTransaction(async (t) => {
            // 1. Lire les documents nécessaires dans la transaction
            const annonceDoc = await t.get(annonceRef);
            if (!annonceDoc.exists) {
                throw new Error("L'annonce demandée n'existe pas.");
            }
            const annonce = annonceDoc.data() as Annonce;

            const memberWalletDoc = await t.get(memberWalletRef);
            if (!memberWalletDoc.exists) {
                throw new Error("Portefeuille du membre introuvable.");
            }
            const memberWallet = memberWalletDoc.data() as Wallet;

            const creatorWalletRef = db.collection('wallets').doc(annonce.createdBy);
            const creatorWalletDoc = await t.get(creatorWalletRef);
            if (!creatorWalletDoc.exists) {
                throw new Error("Portefeuille du créateur introuvable.");
            }

            // 2. Valider la logique métier
            if (memberWallet.balance < annonce.price) {
                throw new Error("Solde insuffisant pour effectuer cette réservation.");
            }

            // 3. Préparer les écritures
            const reservationId = db.collection('reservations').doc().id;
            const reservationRef = db.collection('reservations').doc(reservationId);

            // Créer le document de réservation
            const newReservation: Omit<Reservation, 'id'> = {
                memberId: memberId,
                creatorId: annonce.createdBy,
                annonceId: annonceId,
                annonceTitle: annonce.title,
                amount: annonce.price,
                status: 'confirmed', // ou 'pending' si une confirmation manuelle est requise
                createdAt: Timestamp.now(),
                reservationDate: Timestamp.fromDate(reservationDateTime),
            };
            t.set(reservationRef, newReservation);

            // Mettre à jour le portefeuille du membre (débit)
            t.update(memberWalletRef, {
                balance: FieldValue.increment(-annonce.price),
                totalSpent: FieldValue.increment(annonce.price)
            });

            // Mettre à jour le portefeuille du créateur (crédit)
            t.update(creatorWalletRef, {
                balance: FieldValue.increment(annonce.price),
                totalEarned: FieldValue.increment(annonce.price)
            });
            
            // Créer la transaction de débit pour le membre
            const debitTxRef = memberWalletRef.collection('transactions').doc();
            t.set(debitTxRef, {
                amount: annonce.price,
                type: 'purchase',
                createdAt: Timestamp.now(),
                description: `Achat: ${annonce.title}`,
                status: 'success',
                reference: reservationId
            } as Omit<Transaction, 'id'>);

            // Créer la transaction de crédit pour le créateur
            const creditTxRef = creatorWalletRef.collection('transactions').doc();
            t.set(creditTxRef, {
                amount: annonce.price,
                type: 'credit',
                createdAt: Timestamp.now(),
                description: `Vente: ${annonce.title}`,
                status: 'success',
                reference: reservationId
            } as Omit<Transaction, 'id'>);
            
            // Retourner les informations utiles
            return { reservationId: reservationId, message: "Réservation confirmée avec succès." };
        });
        
        return NextResponse.json({ status: 'success', ...reservationResult });

    } catch (error: any) {
        console.error('Erreur lors de la création de la réservation:', error);
        // Renvoyer un message d'erreur clair au client
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
