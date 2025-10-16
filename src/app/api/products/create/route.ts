// /src/app/api/products/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, doc, writeBatch, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Product, User, ProductType, Settings } from '@/lib/types';
import { modererContenu } from '@/ai/flows/moderer-contenu';
import { firebaseConfig } from '@/firebase/config';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
        storageBucket: firebaseConfig.storageBucket,
    });
}

const db = getFirestore();
const storage = getStorage();

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const authorId = formData.get('authorId') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = parseFloat(formData.get('price') as string);
        const originalPrice = formData.get('originalPrice') ? parseFloat(formData.get('originalPrice') as string) : undefined;
        const productType = formData.get('productType') as ProductType;
        const quantity = formData.get('quantity') ? parseInt(formData.get('quantity') as string, 10) : undefined;
        const imageFile = formData.get('image') as File | null;
        const isCollaborative = formData.get('isCollaborative') === 'true';
        const revenueSharesStr = formData.get('revenueShares') as string | null;

        if (!authorId || !title || !description || isNaN(price) || !productType || !imageFile) {
            return NextResponse.json({ status: 'error', message: 'Données du formulaire invalides ou manquantes.' }, { status: 400 });
        }
        
        const authorRef = db.collection('users').doc(authorId);
        const authorDoc = await authorRef.get();
        if (!authorDoc.exists) {
            return NextResponse.json({ status: 'error', message: 'Auteur inconnu.' }, { status: 404 });
        }
        const authorData = authorDoc.data() as User;

        const moderationResult = await modererContenu({
            texte: `${title} - ${description}`,
            typeContenu: 'Produit',
        });

        const imagePath = `products/${authorId}/${Date.now()}_${imageFile.name}`;
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        
        const file = storage.bucket().file(imagePath);
        await file.save(buffer, { metadata: { contentType: imageFile.type } });
        await file.makePublic();
        const imageUrl = file.publicUrl();
        
        let revenueShares = [];
        if (isCollaborative && revenueSharesStr) {
            try {
                revenueShares = JSON.parse(revenueSharesStr);
                const totalPercentage = revenueShares.reduce((sum, share) => sum + (share.percentage || 0), 0);
                if (totalPercentage !== 100) {
                     throw new Error("La somme des pourcentages de revenus doit être de 100%.");
                }
            } catch(e) {
                return NextResponse.json({ status: 'error', message: 'Format de partage des revenus invalide.' }, { status: 400 });
            }
        }

        const newProductData: Omit<Product, 'id'> = {
            title,
            description,
            price,
            originalPrice,
            productType,
            imageUrl,
            createdBy: authorId,
            createdAt: serverTimestamp() as any,
            isCollaborative,
            revenueShares,
            moderationStatus: moderationResult.status,
            moderationReason: moderationResult.raison,
        };

        if (productType === 'physique' && quantity !== undefined && quantity > 0) {
            newProductData.quantity = quantity;
            newProductData.initialQuantity = quantity;
        }
        
        const batch = db.batch();
        const productRef = db.collection('products').doc();
        batch.set(productRef, newProductData);

        // First content bonus logic
        if (!authorData.hasPostedFirstContent) {
            const settingsDoc = await db.collection('settings').doc('global').get();
            const firstContentBonus = (settingsDoc.data() as Settings)?.rewards?.firstContentBonus || 0;

            if(firstContentBonus > 0) {
                const walletRef = db.collection('wallets').doc(authorId);
                const rewardTxRef = walletRef.collection('transactions').doc();
                
                batch.update(authorRef, { 
                    hasPostedFirstContent: true,
                    rewardPoints: FieldValue.increment(firstContentBonus)
                });
                
                batch.set(rewardTxRef, {
                    amount: firstContentBonus,
                    type: 'reward',
                    description: 'Bonus pour votre premier contenu !',
                    status: 'success',
                    createdAt: serverTimestamp(),
                    reference: productRef.id,
                });
            } else {
                 batch.update(authorRef, { hasPostedFirstContent: true });
            }
        }
        
        await batch.commit();

        return NextResponse.json({ status: 'success', message: 'Produit créé.', productId: productRef.id });

    } catch (error: any) {
        console.error("Erreur lors de la création du produit :", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
