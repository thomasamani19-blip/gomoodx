
// /src/app/api/cart/remove/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, doc, deleteDoc } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, productId } = await request.json();

        if (!userId || !productId) {
            return NextResponse.json({ status: 'error', message: "Informations manquantes." }, { status: 400 });
        }
        
        const cartItemRef = doc(db, 'users', userId, 'cart', productId);
        
        await deleteDoc(cartItemRef);

        return NextResponse.json({ status: 'success', message: 'Produit retiré du panier.' });

    } catch (error: any) {
        console.error("Erreur lors de la suppression du panier:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
