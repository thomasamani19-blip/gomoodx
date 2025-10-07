// /src/app/api/admin/process-withdrawal/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, WriteBatch } from 'firebase-admin/firestore';
import type { Transaction, TransactionStatus } from '@/lib/types';

// Initialize Firebase Admin SDK if not already done
if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    // TODO: Add founder role verification here for security
    const { userId, transactionId, newStatus } = await request.json();

    if (!userId || !transactionId || !newStatus || !['completed', 'failed'].includes(newStatus)) {
      return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
    }

    const walletRef = db.collection('wallets').doc(userId);
    const transactionRef = walletRef.collection('transactions').doc(transactionId);
    
    await db.runTransaction(async (t) => {
        const txDoc = await t.get(transactionRef);
        if (!txDoc.exists) throw new Error("Transaction de retrait introuvable.");

        const transaction = txDoc.data() as Transaction;
        if (transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
            throw new Error("Cette transaction n'est pas une demande de retrait en attente.");
        }

        if (newStatus === 'failed') {
            // Refund the user if the withdrawal failed
            t.update(walletRef, {
                balance: FieldValue.increment(transaction.amount)
            });
            
            // Update the original transaction
             t.update(transactionRef, { 
                status: 'failed',
                description: `Demande de retrait (Échouée)`
            });
        } else { // 'completed'
            // The money has been manually sent. Just update the status.
            t.update(transactionRef, { 
                status: 'completed',
                description: `Retrait complété`
            });
        }
    });

    return NextResponse.json({
        status: 'success', 
        message: `La demande de retrait a été marquée comme : ${newStatus}.`,
    });

  } catch (error: any) {
    console.error("Erreur lors du traitement du retrait:", error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
