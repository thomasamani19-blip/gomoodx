
// /src/app/api/payments/verifyKkiapay/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Kkiapay from 'kkiapay';

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization error:', e);
}

const kkiapay = new Kkiapay(
    process.env.KKIAPAY_PUBLIC_KEY || '',
    process.env.KKIAPAY_PRIVATE_KEY || '',
    process.env.KKIAPAY_SECRET_KEY || '',
    { sandbox: true } 
);

export async function POST(request: Request) {
  const db = getFirestore();

  try {
    const { transactionId, userId, amount, currency } = await request.json();

    if (!transactionId || !userId || !amount || !currency) {
      return NextResponse.json({ status: 'error', message: 'Des champs obligatoires sont manquants.' }, { status: 400 });
    }
    
    const transaction = await kkiapay.verifyTransaction(transactionId);
    
    if (transaction.status === 'SUCCESS' && transaction.amount >= amount) {
      
      console.log('Paiement KkiaPay vérifié avec succès:', transaction);

      const walletRef = db.collection('wallets').doc(userId);
      const transactionRef = walletRef.collection('transactions').doc(transaction.id);

      await db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        const transactionDoc = await t.get(transactionRef);

        if (transactionDoc.exists) {
            console.warn(`La transaction ${transactionRef.id} a déjà été traitée.`);
            return;
        }
        
        if (!walletDoc.exists) {
            t.set(walletRef, {
                balance: transaction.amount,
                currency: currency,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            t.update(walletRef, {
              balance: FieldValue.increment(transaction.amount),
              updatedAt: FieldValue.serverTimestamp(),
            });
        }
        
        t.set(transactionRef, {
            amount: transaction.amount,
            type: 'deposit',
            createdAt: FieldValue.serverTimestamp(),
            description: `Rechargement via KkiaPay`,
            status: 'success',
            reference: transaction.id,
        });
      });

      return NextResponse.json({ status: 'success', message: 'Paiement vérifié et portefeuille mis à jour.' });
    } else {
      console.error('La vérification du paiement KkiaPay a échoué:', transaction);
      return NextResponse.json({ status: 'error', message: transaction.reason || 'La vérification du paiement KkiaPay a échoué.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification du paiement KkiaPay:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
