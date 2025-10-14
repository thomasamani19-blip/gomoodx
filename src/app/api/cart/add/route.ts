
// /src/app/api/cart/add/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase-admin/firestore';
import type { Product } from '@/lib/types';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { userId, productId, quantity } = await request.json();

        if (!userId || !productId || !quantity || quantity <= 0) {
            return NextResponse.json({ status: 'error', message: "Informations manquantes ou invalides." }, { status: 400 });
        }
        
        const productRef = doc(db, 'products', productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists()) {
            return NextResponse.json({ status: 'error', message: "Produit non trouvé." }, { status: 404 });
        }
        const product = productDoc.data() as Product;
        
        const cartItemRef = doc(db, 'users', userId, 'cart', productId);
        
        await setDoc(cartItemRef, {
            productId: productId,
            title: product.title,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: quantity,
            addedAt: serverTimestamp(),
        }, { merge: true }); // Use merge to update quantity if item already in cart

        return NextResponse.json({ status: 'success', message: 'Produit ajouté au panier.' });

    } catch (error: any) {
        console.error("Erreur lors de l'ajout au panier:", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
