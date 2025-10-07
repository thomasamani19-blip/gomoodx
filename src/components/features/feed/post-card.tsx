'use client';

import type { Post } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function PostCard({ post }: { post: Post }) {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
    const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
    const [isLiking, setIsLiking] = useState(false);

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

        // Optimistic update
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
            // Revert optimistic update on failure
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
            <CardFooter className="border-t pt-4 flex justify-start gap-4">
                 <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLiking || authLoading}>
                    {isLiking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Heart className={cn("mr-2 h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                    )}
                    <span>{likeCount}</span>
                </Button>
                <Button variant="ghost" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>{post.commentsCount || 0}</span>
                </Button>
            </CardFooter>
        </Card>
    )
}
