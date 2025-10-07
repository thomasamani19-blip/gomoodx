
// /src/app/api/posts/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, serverTimestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Post } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

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
        
        // You should verify the authorId against the authenticated user token
        // For simplicity, we trust the client for now.
        const authorDoc = await db.collection('users').doc(authorId).get();
        if (!authorDoc.exists) {
            return NextResponse.json({ status: 'error', message: "Auteur inconnu." }, { status: 404 });
        }
        const authorData = authorDoc.data()!;

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
            // Make the file public to get a persistent URL
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
        };

        const postRef = await db.collection('posts').add(newPost);

        return NextResponse.json({ status: 'success', message: 'Publication créée.', postId: postRef.id });

    } catch (error: any) {
        console.error('Erreur lors de la création de la publication:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
