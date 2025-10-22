
// /src/app/api/cart/update/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, productId, quantity } = await request.json();

        if (!userId || !productId || quantity === undefined || quantity < 0) {
            return NextResponse.json({ status: 'error', message: "Informations manquantes ou invalides." }, { status: 400 });
        }
        
        // In the cart, the document ID is the product ID
        const cartItemRef = doc(db, 'users', userId, 'cart', productId);

        if (quantity === 0) {
             await deleteDoc(cartItemRef);
        } else {
            await updateDoc(cartItemRef, {
                quantity: quantity,
                updatedAt: serverTimestamp(),
            });
        }

        return NextResponse.json({ status: 'success', message: 'Quantité mise à jour.' });

    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du panier:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
