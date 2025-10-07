// /src/app/api/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { User, Wallet, Transaction } from '@/lib/types';
import { add } from 'date-fns';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault()
    });
}
const db = getFirestore();

export async function POST(request: Request) {
    // This functionality is deprecated in favor of /api/subscriptions/create-platform-subscription
    // The code is left here for reference but will not be executed.
    return NextResponse.json({ status: 'error', message: "La fonctionnalité d'abonnement membre a été désactivée." }, { status: 410 });
}
