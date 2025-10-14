

// /src/app/api/payments/verifyFlutterwave/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, doc } from 'firebase-admin/firestore';
import type { User, Settings, Transaction } from '@/lib/types';

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization error:', e);
}

const creditPacksEUR = [
  { name: 'Essentiel', price: 20, bonus: 0 },
  { name: 'Confort', price: 50, bonus: 5 },
  { name: 'Premium', price: 100, bonus: 15 },
  { name: 'Élite', price: 250, bonus: 50 },
];

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const REFERRAL_BONUS_POINTS = 500; // 500 points = 5 EUR

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
      const amountEUR = paymentData.meta?.amountEUR;
      
      if (!userId || amountEUR === undefined) {
        throw new Error("Les métadonnées de la transaction sont incomplètes (userId ou amountEUR).");
      }

      console.log('Paiement Flutterwave vérifié avec succès:', paymentData);

      const walletRef = db.collection('wallets').doc(userId);
      const userRef = db.collection('users').doc(userId);
      const settingsRef = doc(db, 'settings', 'global');
      const transactionRef = walletRef.collection('transactions').doc(paymentData.id.toString());
      
      // Use a Firestore transaction to ensure atomicity
      const creditedAmountFinal = await db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        const userDoc = await t.get(userRef);
        const settingsDoc = await t.get(settingsRef);
        const transactionDoc = await t.get(transactionRef);

        // Prevent duplicate processing
        if (transactionDoc.exists) {
            console.warn(`La transaction ${transactionRef.id} a déjà été traitée.`);
            const existingTransactionData = transactionDoc.data();
            return existingTransactionData?.amount || 0;
        }

        if (!userDoc.exists) {
            throw new Error("Utilisateur introuvable.");
        }

        const userData = userDoc.data() as User;
        const settingsData = settingsDoc.data() as Settings;

        // Check for a matching pack to add a bonus based on EUR amount
        const pack = creditPacksEUR.find(p => p.price === amountEUR);
        let creditedAmount = amountEUR + (pack ? pack.bonus : 0);
        let transactionDescription = `Rechargement ${pack ? `Pack ${pack.name}` : ''} (${amountEUR}€ ${pack && pack.bonus > 0 ? `+ ${pack.bonus}€ bonus` : ''})`;
        
        // Check for first deposit bonus
        const isFirstDeposit = !userData.hasMadeFirstDeposit;
        if (isFirstDeposit && settingsData.welcomeBonusAmount && settingsData.welcomeBonusAmount > 0) {
            creditedAmount += settingsData.welcomeBonusAmount;
            transactionDescription += ` + ${settingsData.welcomeBonusAmount}€ bonus de bienvenue`;
        }
        
        if (!walletDoc.exists) {
            t.set(walletRef, {
                balance: creditedAmount,
                currency: 'EUR',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                totalEarned: 0,
                totalSpent: 0,
                status: 'active'
            });
        } else {
            t.update(walletRef, {
              balance: FieldValue.increment(creditedAmount),
              updatedAt: FieldValue.serverTimestamp(),
            });
        }

        if (isFirstDeposit) {
            t.update(userRef, { hasMadeFirstDeposit: true });
             // Handle referral reward
            if (userData.referredBy) {
                const referrerRef = db.collection('users').doc(userData.referredBy);
                
                t.update(referrerRef, { 
                  rewardPoints: FieldValue.increment(REFERRAL_BONUS_POINTS), 
                  referralsCount: FieldValue.increment(1) 
                });
                
                // Add a transaction to the referrer's wallet history for clarity
                const referrerWalletRef = db.collection('wallets').doc(userData.referredBy);
                const rewardTxRef = referrerWalletRef.collection('transactions').doc();
                t.set(rewardTxRef, {
                  amount: REFERRAL_BONUS_POINTS,
                  type: 'reward',
                  description: `Récompense de parrainage: ${userData.displayName}`,
                  status: 'success',
                  createdAt: FieldValue.serverTimestamp(),
                  reference: userId, // Reference to the user who made the deposit
                } as Omit<Transaction, 'id' | 'path'>);
            }
        }
        
        // Create a new transaction record to log the event
        t.set(transactionRef, {
            amount: creditedAmount,
            type: 'deposit',
            createdAt: FieldValue.serverTimestamp(),
            description: transactionDescription,
            status: 'success',
            reference: paymentData.flw_ref,
        });

        return creditedAmount;
      });

      return NextResponse.json({ status: 'success', message: 'Paiement vérifié et portefeuille mis à jour.', creditedAmount: creditedAmountFinal });
    } else {
      console.error('La vérification du paiement Flutterwave a échoué:', result);
      return NextResponse.json({ status: 'error', message: result.message || 'La vérification du paiement a échoué.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification du paiement Flutterwave:', error);
    return NextResponse.json({ status: 'error', message: error.message || 'Erreur Interne du Serveur' }, { status: 500 });
  }
}
