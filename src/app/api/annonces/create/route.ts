

// /src/app/api/annonces/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, doc, writeBatch, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Annonce, User, Settings } from '@/lib/types';
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
        const isTravelIncluded = formData.get('isTravelIncluded') === 'true';
        const category = formData.get('category') as string;
        const location = formData.get('location') as string;
        const imageFile = formData.get('image') as File | null;

        if (!authorId || !title || !description || isNaN(price) || !category || !location || !imageFile) {
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
            typeContenu: 'Annonce',
        });

        const imagePath = `services/${authorId}/${Date.now()}_${imageFile.name}`;
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        
        const file = storage.bucket().file(imagePath);
        await file.save(buffer, { metadata: { contentType: imageFile.type } });
        await file.makePublic();
        const imageUrl = file.publicUrl();

        const newAnnonce: Omit<Annonce, 'id'> = {
            title,
            description,
            price,
            originalPrice,
            isTravelIncluded,
            category,
            location,
            imageUrl,
            createdBy: authorId,
            status: 'active',
            rating: 0,
            ratingCount: 0,
            views: 0,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
            isSponsored: false,
            moderationStatus: moderationResult.status,
            moderationReason: moderationResult.raison,
        };
        
        const batch = db.batch();
        const annonceRef = db.collection('services').doc();
        batch.set(annonceRef, newAnnonce);

        // First content bonus logic
        if (!authorData.hasPostedFirstContent) {
            const settingsDoc = await db.collection('settings').doc('global').get();
            const firstContentBonus = (settingsDoc.data() as Settings)?.rewards?.firstContentBonus || 0;
            
            if (firstContentBonus > 0) {
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
                    reference: annonceRef.id,
                });
            } else {
                 batch.update(authorRef, { hasPostedFirstContent: true });
            }
        }
        
        await batch.commit();

        return NextResponse.json({ status: 'success', message: 'Annonce créée.', annonceId: annonceRef.id });

    } catch (error: any) {
        console.error("Erreur lors de la création de l'annonce :", error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
