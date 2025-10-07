
// /src/app/api/payments/verifyFlutterwave/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization error:', e);
}

const creditPacks = [
  { name: 'Essentiel', price: 20, bonus: 0 },
  { name: 'Confort', price: 50, bonus: 5 },
  { name: 'Premium', price: 100, bonus: 15 },
  { name: 'Élite', price: 250, bonus: 50 },
];

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function POST(request: Request) {
  const db = getFirestore();

  try {
    const { transaction_id, tx_ref } = await request.json();

    if (!transaction_id || !tx_ref) {
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
    const paymentData = result.data;
    
    // Perform thorough validation
    if (result.status === 'success' && 
        paymentData.status === 'successful' &&
        paymentData.tx_ref === tx_ref) {
      
      const userId = paymentData.meta?.userId;
      const paidAmount = paymentData.amount;
      const currency = paymentData.currency;
      
      if (!userId) {
        throw new Error("L'ID de l'utilisateur est manquant dans les métadonnées de la transaction.");
      }

      console.log('Paiement Flutterwave vérifié avec succès:', paymentData);
      
      // Check for a matching pack to add a bonus
      const pack = creditPacks.find(p => p.price === paidAmount);
      const bonus = pack ? pack.bonus : 0;
      const creditedAmount = paidAmount + bonus;

      const walletRef = db.collection('wallets').doc(userId);
      const transactionRef = walletRef.collection('transactions').doc(paymentData.id.toString());

      // Use a Firestore transaction to ensure atomicity
      const creditedAmountFinal = await db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        const transactionDoc = await t.get(transactionRef);

        // Prevent duplicate processing
        if (transactionDoc.exists) {
            console.warn(`La transaction ${transactionRef.id} a déjà été traitée.`);
            return walletDoc.data()?.balance || 0;
        }
        
        if (!walletDoc.exists) {
            // If wallet doesn't exist, create it.
            t.set(walletRef, {
                balance: creditedAmount,
                currency: currency,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            // If wallet exists, update balance.
            t.update(walletRef, {
              balance: FieldValue.increment(creditedAmount),
              updatedAt: FieldValue.serverTimestamp(),
            });
        }
        
        // Create a new transaction record to log the event
        t.set(transactionRef, {
            amount: creditedAmount,
            type: 'deposit',
            createdAt: FieldValue.serverTimestamp(),
            description: `Rechargement ${pack ? `Pack ${pack.name}` : ''} (${paidAmount}€ + ${bonus}€ bonus)`,
            status: 'success',
            reference: paymentData.flw_ref,
        });

        return (walletDoc.data()?.balance || 0) + creditedAmount;
      });

      return NextResponse.json({ status: 'success', message: 'Paiement vérifié et portefeuille mis à jour.', creditedAmount });
    } else {
      console.error('La vérification du paiement Flutterwave a échoué:', result);
      return NextResponse.json({ status: 'error', message: result.message || 'La vérification du paiement a échoué.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification du paiement Flutterwave:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
