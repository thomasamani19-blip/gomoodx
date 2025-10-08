
// /src/app/api/admin/process-withdrawal/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, WriteBatch } from 'firebase-admin/firestore';
import type { Transaction, TransactionStatus, User } from '@/lib/types';
import { randomBytes } from 'crypto';


// Initialize Firebase Admin SDK if not already done
if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3';


// Function to call Flutterwave Transfer API
async function createFlutterwaveTransfer(user: User, transaction: Transaction) {
    if (!FLUTTERWAVE_SECRET_KEY) {
        throw new Error("La clé secrète Flutterwave n'est pas configurée.");
    }
    if (!user.bankDetails?.accountNumber || !user.bankDetails.bankCode) {
        // This case is now handled before calling, but kept as a safeguard.
        throw new Error("Les détails bancaires de l'utilisateur sont incomplets.");
    }

    const transferData = {
        account_bank: user.bankDetails.bankCode,
        account_number: user.bankDetails.accountNumber,
        amount: transaction.amount,
        narration: `Retrait GoMoodX - ${user.displayName}`,
        currency: 'EUR', // Assuming EUR for now, could be dynamic
        reference: `gomoodx_withdrawal_${transaction.id}_${Date.now()}`,
        callback_url: "https://gomoodx.com/api/webhooks/flutterwave", // Your webhook URL
        debit_currency: 'EUR'
    };

    const response = await fetch(`${FLUTTERWAVE_API_URL}/transfers`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
    });

    const result = await response.json();
    if (result.status !== 'success') {
        throw new Error(`Échec du transfert Flutterwave: ${result.message}`);
    }
    
    console.log("Flutterwave transfer initiated:", result.data);
    return result.data;
}


export async function POST(request: Request) {
  try {
    // TODO: Add founder role verification here for security
    const { userId, transactionId, newStatus } = await request.json();

    if (!userId || !transactionId || !newStatus || !['completed', 'failed'].includes(newStatus)) {
      return NextResponse.json({ status: 'error', message: 'Informations manquantes ou invalides.' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(userId);
    const walletRef = db.collection('wallets').doc(userId);
    const transactionRef = walletRef.collection('transactions').doc(transactionId);
    
    await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("Utilisateur introuvable.");
        const user = userDoc.data() as User;

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
            const hasBankDetails = user.bankDetails?.accountNumber && user.bankDetails.bankCode;

            if (hasBankDetails) {
                // Attempt to make the transfer via Flutterwave
                try {
                    await createFlutterwaveTransfer(user, transaction);
                    // If successful, mark the transaction as completed.
                    t.update(transactionRef, { 
                        status: 'completed',
                        description: `Retrait complété (Automatique)`
                    });
                } catch (apiError: any) {
                    console.error("Erreur de l'API Flutterwave:", apiError);
                    // If API fails, we must refund the user and mark the tx as failed
                    t.update(walletRef, {
                        balance: FieldValue.increment(transaction.amount)
                    });
                    t.update(transactionRef, { 
                        status: 'failed',
                        description: `Retrait échoué: ${apiError.message}`
                    });
                    // Re-throw to abort the Firestore transaction and inform the admin
                    throw new Error(`Le virement automatique a échoué: ${apiError.message}`);
                }
            } else {
                // If no bank details, assume manual processing and just update status
                t.update(transactionRef, {
                    status: 'completed',
                    description: `Retrait complété (Manuel)`
                });
            }
        }
    });

    return NextResponse.json({
        status: 'success', 
        message: `La demande de retrait a été traitée.`,
    });

  } catch (error: any) {
    console.error("Erreur lors du traitement du retrait:", error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
