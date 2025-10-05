// /src/app/api/payments/verifyFlutterwave/route.ts
import { NextResponse } from 'next/server';
// import { firestore } from '@/lib/firebase';
// import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const { transaction_id, tx_ref, user_id, amount, currency } = await request.json();

    if (!transaction_id || !user_id) {
      return NextResponse.json({ error: 'Transaction ID and User ID are required' }, { status: 400 });
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

    if (result.status === 'success' && result.data.tx_ref === tx_ref && result.data.amount >= amount && result.data.currency === currency) {
      // Transaction is successful and valid
      console.log('Flutterwave payment successful:', result.data);

      // TODO: Implement Firestore logic here
      // 1. Get user wallet reference
      // const walletRef = doc(firestore, `wallet/${user_id}`);
      // 2. Update user wallet balance
      // await updateDoc(walletRef, { balance: increment(amount) });
      // 3. Add transaction to subcollection
      // const transactionRef = doc(collection(walletRef, 'transactions'));
      // await setDoc(transactionRef, { ... });

      return NextResponse.json({ status: 'success', message: 'Payment verified and wallet updated' });
    } else {
      // Transaction failed or was tampered with
      console.error('Flutterwave payment verification failed:', result);
      return NextResponse.json({ status: 'error', message: 'Payment verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying Flutterwave payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
