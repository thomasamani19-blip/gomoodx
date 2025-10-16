
// /src/app/api/payments/verifyKkiapay/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, doc } from 'firebase-admin/firestore';
import Kkiapay from 'kkiapay';
import type { User, Settings, Transaction } from '@/lib/types';

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization error:', e);
}

const kkiapay = new Kkiapay(
    process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '',
    process.env.KKIAPAY_PRIVATE_KEY || '',
    process.env.KKIAPAY_SECRET_KEY || '',
    { sandbox: true } 
);

const XOF_TO_EUR_RATE = 1 / 655.957;

const creditPacksEUR = [
  { name: 'Essentiel', price: 20, bonus: 0 },
  { name: 'Confort', price: 50, bonus: 5 },
  { name: 'Premium', price: 100, bonus: 15 },
  { name: 'Élite', price: 250, bonus: 50 },
];

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
      const amountXOF = Number(transaction.amount);
      const amountEUR = amountXOF * XOF_TO_EUR_RATE;

      const walletRef = db.collection('wallets').doc(userId);
      const userRef = db.collection('users').doc(userId);
      const settingsRef = doc(db, 'settings', 'global');
      const transactionRef = walletRef.collection('transactions').doc(transaction.id);

      await db.runTransaction(async (t) => {
        const walletDoc = await t.get(walletRef);
        const userDoc = await t.get(userRef);
        const settingsDoc = await t.get(settingsRef);
        const txDoc = await t.get(transactionRef);

        if (txDoc.exists) {
            console.warn(`La transaction KkiaPay ${transactionRef.id} a déjà été traitée.`);
            return;
        }

        if (!userDoc.exists) throw new Error("Utilisateur introuvable.");
        
        const userData = userDoc.data() as User;
        const settingsData = settingsDoc.data() as Settings;
        const referralBonus = settingsData?.rewards?.referralBonus || 0;
        const welcomeBonusAmount = settingsData?.welcomeBonusAmount || 0;

        // Find closest pack to determine bonus
        const pack = creditPacksEUR.reduce((prev, curr) => 
            (Math.abs(curr.price - amountEUR) < Math.abs(prev.price - amountEUR) ? curr : prev)
        );
        let bonusEUR = 0;
        // Apply bonus only if amount is close to pack price
        if (Math.abs(pack.price - amountEUR) < 5) {
            bonusEUR = pack.bonus;
        }
        
        let creditedAmount = amountEUR + bonusEUR;
        let transactionDescription = `Rechargement KkiaPay (${amountXOF} XOF ~ ${amountEUR.toFixed(2)}€ ${bonusEUR > 0 ? `+ ${bonusEUR}€ bonus` : ''})`;
        
        const isFirstDeposit = !userData.hasMadeFirstDeposit;
        if (isFirstDeposit && welcomeBonusAmount > 0) {
            creditedAmount += welcomeBonusAmount;
            transactionDescription += ` + ${welcomeBonusAmount}€ bonus de bienvenue`;
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
        
        if(isFirstDeposit) {
            t.update(userRef, { hasMadeFirstDeposit: true });
            // Handle referral reward
            if (userData.referredBy && referralBonus > 0) {
                const referrerRef = db.collection('users').doc(userData.referredBy);
                
                t.update(referrerRef, { 
                    rewardPoints: FieldValue.increment(referralBonus), 
                    referralsCount: FieldValue.increment(1) 
                });

                // Add a transaction to the referrer's wallet history for clarity
                const referrerWalletRef = db.collection('wallets').doc(userData.referredBy);
                const rewardTxRef = referrerWalletRef.collection('transactions').doc();
                t.set(rewardTxRef, {
                  amount: referralBonus,
                  type: 'reward',
                  description: `Récompense de parrainage: ${userData.displayName}`,
                  status: 'success',
                  createdAt: FieldValue.serverTimestamp(),
                  reference: userId, // Reference to the user who made the deposit
                });
            }
        }
        
        t.set(transactionRef, {
            amount: creditedAmount,
            type: 'deposit',
            createdAt: FieldValue.serverTimestamp(),
            description: transactionDescription,
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
