
// /src/app/api/payments/verifyFlutterwave/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// Important: This requires GOOGLE_APPLICATION_CREDENTIALS to be set in your environment
try {
  if (!getApps().length) {
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

    if (!transaction_id || !user_id || !amount || !currency) {
      return NextResponse.json({ error: 'Des champs obligatoires sont manquants.' }, { status: 400 });
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
    
    // Basic validation
    if (result.status === 'success' && result.data.tx_ref === tx_ref && result.data.amount >= amount && result.data.currency === currency) {
      console.log('Paiement Flutterwave vérifié avec succès:', result.data);

      const walletRef = db.collection('wallets').doc(user_id);
      const transactionRef = walletRef.collection('transactions').doc(result.data.id.toString());

      // Use a Firestore transaction to ensure atomicity
      await db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        
        if (!walletDoc.exists) {
            // If wallet doesn't exist, create it.
            t.set(walletRef, {
                balance: amount,
                currency: currency,
                totalEarned: 0,
                totalSpent: 0,
                status: 'active'
            });
        } else {
            // If wallet exists, update balance.
            t.update(walletRef, {
              balance: FieldValue.increment(amount),
            });
        }
        
        // Create a new transaction record
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
      return NextResponse.json({ status: 'error', message: 'La vérification du paiement a échoué.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du paiement Flutterwave:', error);
    return NextResponse.json({ error: 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
