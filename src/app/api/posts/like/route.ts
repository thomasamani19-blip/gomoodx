// /src/app/api/posts/like/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Post } from '@/lib/types';

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { postId, userId } = await request.json();

        if (!postId || !userId) {
            return NextResponse.json({ status: 'error', message: 'ID du post ou de l\'utilisateur manquant.' }, { status: 400 });
        }

        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return NextResponse.json({ status: 'error', message: 'La publication n\'existe pas.' }, { status: 404 });
        }

        const post = postDoc.data() as Post;
        const likes = post.likes || [];
        const isLiked = likes.includes(userId);

        if (isLiked) {
            // Un-like
            await postRef.update({
                likes: FieldValue.arrayRemove(userId)
            });
            return NextResponse.json({ status: 'success', message: 'Like retiré.' });
        } else {
            // Like
            await postRef.update({
                likes: FieldValue.arrayUnion(userId)
            });
            return NextResponse.json({ status: 'success', message: 'Post aimé.' });
        }

    } catch (error: any) {
        console.error('Erreur lors du like de la publication:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
