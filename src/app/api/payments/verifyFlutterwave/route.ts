
// /src/app/api/payments/verifyFlutterwave/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// This should be configured with your service account for production.
// For development, if you're running this with `firebase emulators:exec`,
// GOOGLE_APPLICATION_CREDENTIALS might be set automatically.
try {
  if (!getApps().length) {
    // If you have a service account JSON file, you can use it like this:
    // const serviceAccount = require('../../../../../path/to/your/serviceAccountKey.json');
    // initializeApp({ credential: cert(serviceAccount) });
    
    // For environments like Google Cloud Run/Functions, it might be auto-initialized
    // This will use Application Default Credentials
    initializeApp();
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization error:', e);
}


const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function POST(request: Request) {
  const db = getFirestore();

  try {
    const { transaction_id, tx_ref, user_id, amount, currency } = await request.json();

    if (!transaction_id || !tx_ref || !user_id || !amount || !currency) {
      return NextResponse.json({ status: 'error', message: 'Des champs obligatoires sont manquants.' }, { status: 400 });
    }

    if (!FLUTTERWAVE_SECRET_KEY) {
        throw new Error("La clé secrète Flutterwave n'est pas configurée sur le serveur.");
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    const result = await response.json();
    
    // Perform thorough validation
    if (result.status === 'success' && 
        result.data.status === 'successful' &&
        result.data.tx_ref === tx_ref && 
        result.data.amount >= amount && 
        result.data.currency === currency) {
      
      console.log('Paiement Flutterwave vérifié avec succès:', result.data);

      const walletRef = db.collection('wallets').doc(user_id);
      const transactionRef = walletRef.collection('transactions').doc(result.data.id.toString());

      // Use a Firestore transaction to ensure atomicity
      await db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        const transactionDoc = await t.get(transactionRef);

        // Prevent duplicate processing
        if (transactionDoc.exists) {
            console.warn(`La transaction ${transactionRef.id} a déjà été traitée.`);
            return;
        }
        
        if (!walletDoc.exists) {
            // If wallet doesn't exist, create it.
            t.set(walletRef, {
                balance: result.data.amount, // Use the amount confirmed by Flutterwave
                currency: currency,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            // If wallet exists, update balance.
            t.update(walletRef, {
              balance: FieldValue.increment(result.data.amount),
              updatedAt: FieldValue.serverTimestamp(),
            });
        }
        
        // Create a new transaction record to log the event
        t.set(transactionRef, {
            amount: result.data.amount,
            type: 'deposit',
            createdAt: FieldValue.serverTimestamp(),
            description: `Rechargement via Flutterwave`,
            status: 'success',
            reference: result.data.flw_ref,
        });
      });

      return NextResponse.json({ status: 'success', message: 'Paiement vérifié et portefeuille mis à jour.' });
    } else {
      console.error('La vérification du paiement Flutterwave a échoué:', result);
      return NextResponse.json({ status: 'error', message: result.message || 'La vérification du paiement a échoué.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification du paiement Flutterwave:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
