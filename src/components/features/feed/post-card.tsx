
'use client';

import type { Post } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare } from 'lucide-react';

export default function PostCard({ post }: { post: Post }) {
    
    const formattedDate = post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...';

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
                 <Button variant="ghost" size="sm">
                    <Heart className="mr-2 h-4 w-4" /> 
                    <span>{post.likes?.length || 0}</span>
                </Button>
                <Button variant="ghost" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>{post.commentsCount || 0}</span>
                </Button>
            </CardFooter>
        </Card>
    )
}
