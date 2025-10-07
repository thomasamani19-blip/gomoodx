'use client';

import type { Post, Comment } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc, runTransaction, doc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';


function CommentSection({ postId }: { postId: string }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const commentsQuery = useMemo(() => firestore ? query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')) : null, [firestore, postId]);
    const { data: comments, loading: commentsLoading } = useCollection<Comment>(commentsQuery);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Connexion requise", description: "Vous devez être connecté pour commenter.", variant: "destructive" });
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        
        try {
            if (!firestore) throw new Error("Firestore not available");
            
            const postRef = doc(firestore, 'posts', postId);
            const commentsColRef = collection(postRef, 'comments');
            
            await runTransaction(firestore, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    throw new Error("Cette publication n'existe plus.");
                }

                const newCommentRef = doc(commentsColRef);
                transaction.set(newCommentRef, {
                    authorId: user.id,
                    authorName: user.displayName,
                    authorImage: user.profileImage,
                    content: newComment,
                    createdAt: serverTimestamp(),
                });

                transaction.update(postRef, {
                    commentsCount: (postDoc.data().commentsCount || 0) + 1
                });
            });

            setNewComment('');

        } catch (error: any) {
            toast({ title: "Erreur", description: error.message || "Impossible d'envoyer le commentaire.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-4 mt-4 border-t">
            {commentsLoading && <Skeleton className="h-10 w-full" />}
            
            <div className="space-y-4 mb-4">
                {comments && comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.authorImage} />
                            <AvatarFallback>{comment.authorName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-lg flex-1">
                            <div className="flex items-baseline gap-2">
                                 <Link href={`/profil/${comment.authorId}`} className="font-semibold text-sm hover:underline">{comment.authorName}</Link>
                                 <p className="text-xs text-muted-foreground">{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { locale: fr, addSuffix: true }) : ''}</p>
                            </div>
                           <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {user && (
                <form onSubmit={handleCommentSubmit} className="flex items-start gap-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="relative flex-1">
                        <Textarea 
                            placeholder="Écrivez un commentaire..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={1}
                            className="min-h-[40px] pr-12"
                        />
                        <Button type="submit" size="icon" variant="ghost" className="absolute top-1 right-1 h-8 w-8" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}


export default function PostCard({ post }: { post: Post }) {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
    const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        setIsLiked(user ? post.likes.includes(user.id) : false);
        setLikeCount(post.likes?.length || 0);
    }, [post.likes, user]);

    const formattedDate = post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...';

    const handleLike = async () => {
        if (!user) {
            toast({ title: "Connexion requise", description: "Vous devez être connecté pour aimer une publication.", variant: "destructive" });
            router.push('/connexion');
            return;
        }
        if (isLiking) return;

        setIsLiking(true);

        const originallyLiked = isLiked;
        setIsLiked(!originallyLiked);
        setLikeCount(prev => originallyLiked ? prev - 1 : prev + 1);

        try {
            const response = await fetch('/api/posts/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id, userId: user.id }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Une erreur est survenue.");
            }
        } catch (error: any) {
            setIsLiked(originallyLiked);
            setLikeCount(prev => originallyLiked ? prev + 1 : prev - 1);
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Link href={`/profil/${post.authorId}`}>
                        <Avatar>
                            <AvatarImage src={post.authorImage} alt={post.authorName} />
                            <AvatarFallback>{post.authorName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profil/${post.authorId}`} className="font-semibold hover:underline">{post.authorName}</Link>
                        <p className="text-xs text-muted-foreground">{formattedDate}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {post.content && <p className="mb-4 whitespace-pre-wrap">{post.content}</p>}
                {post.type === 'image' && post.mediaUrl && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border">
                         <Image src={post.mediaUrl} alt={`Image pour le post de ${post.authorName}`} fill className="object-contain" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t pt-2 pb-2 flex justify-start gap-1">
                 <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLiking || authLoading}>
                    {isLiking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Heart className={cn("mr-2 h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                    )}
                    <span>{likeCount}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>{post.commentsCount || 0}</span>
                </Button>
            </CardFooter>
            {showComments && (
                 <CardContent>
                    <CommentSection postId={post.id} />
                </CardContent>
            )}
        </Card>
    )
}
