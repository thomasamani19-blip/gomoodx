// /src/app/api/posts/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, doc, writeBatch, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Post, User, Settings } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';
import { modererContenu } from '@/ai/flows/moderer-contenu';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
        storageBucket: firebaseConfig.storageBucket,
    });
}

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const content = formData.get('content') as string;
        const authorId = formData.get('authorId') as string;
        const imageFile = formData.get('image') as File | null;

        // Basic validation
        if (!authorId) {
            return NextResponse.json({ status: 'error', message: "L'auteur de la publication est manquant." }, { status: 400 });
        }
        if (!content && !imageFile) {
            return NextResponse.json({ status: 'error', message: "Le contenu de la publication est vide." }, { status: 400 });
        }
        
        const authorRef = db.collection('users').doc(authorId);
        const authorDoc = await authorRef.get();
        if (!authorDoc.exists) {
            return NextResponse.json({ status: 'error', message: "Auteur inconnu." }, { status: 404 });
        }
        const authorData = authorDoc.data() as User;

        // AI Content Moderation
        const moderationResult = await modererContenu({
            texte: content,
            typeContenu: 'Post',
        });

        let imageUrl: string | undefined = undefined;

        if (imageFile) {
            const imagePath = `posts/${authorId}/${Date.now()}_${imageFile.name}`;
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            
            const file = storage.bucket().file(imagePath);
            await file.save(buffer, {
                metadata: {
                    contentType: imageFile.type,
                },
            });
            await file.makePublic();
            imageUrl = file.publicUrl();
        }

        const newPost: Omit<Post, 'id'> = {
            authorId,
            authorName: authorData.displayName,
            authorImage: authorData.profileImage || '',
            content: content,
            type: imageFile ? 'image' : 'text',
            mediaUrl: imageUrl,
            likes: [],
            commentsCount: 0,
            createdAt: serverTimestamp() as any,
            moderationStatus: moderationResult.status,
            moderationReason: moderationResult.raison,
        };
        
        const batch = db.batch();
        const postRef = db.collection('posts').doc();
        batch.set(postRef, newPost);

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
                    reference: postRef.id,
                });
            } else {
                 batch.update(authorRef, { hasPostedFirstContent: true });
            }
        }
        
        await batch.commit();

        return NextResponse.json({ status: 'success', message: 'Publication créée.', postId: postRef.id });

    } catch (error: any) {
        console.error('Erreur lors de la création de la publication:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
