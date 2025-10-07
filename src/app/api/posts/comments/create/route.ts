// /src/app/api/posts/comments/create/route.ts
import { NextResponse } from 'next/server';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, serverTimestamp, FieldValue } from 'firebase-admin/firestore';
import type { Comment } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { postId, authorId, content } = await request.json();

        if (!postId || !authorId || !content) {
            return NextResponse.json({ status: 'error', message: "Informations manquantes pour créer le commentaire." }, { status: 400 });
        }

        const authorDoc = await db.collection('users').doc(authorId).get();
        if (!authorDoc.exists) {
            return NextResponse.json({ status: 'error', message: "Auteur inconnu." }, { status: 404 });
        }
        const authorData = authorDoc.data()!;

        const postRef = db.collection('posts').doc(postId);
        const commentRef = postRef.collection('comments').doc();

        const newComment: Omit<Comment, 'id'> = {
            authorId: authorId,
            authorName: authorData.displayName,
            authorImage: authorData.profileImage || '',
            content: content,
            createdAt: serverTimestamp() as any,
        };
        
        // Use a transaction to ensure atomicity
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) {
                throw new Error("La publication n'existe plus.");
            }
            
            // Create new comment
            transaction.set(commentRef, newComment);
            
            // Increment comments count on the post
            transaction.update(postRef, {
                commentsCount: FieldValue.increment(1)
            });
        });

        return NextResponse.json({ status: 'success', message: 'Commentaire ajouté.', commentId: commentRef.id });

    } catch (error: any) {
        console.error('Erreur lors de la création du commentaire:', error);
        return NextResponse.json({ status: 'error', message: error.message || "Une erreur interne est survenue." }, { status: 500 });
    }
}
