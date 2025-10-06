
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { BlogArticle, User } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Simple Markdown-to-HTML converter
const Markdown = ({ content }: { content: string }) => {
    // Replace ## headers
    const html = content
      .replace(/^## (.*$)/gim, '<h2 class="font-headline text-2xl mt-8 mb-4">$1</h2>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*)\*/g, '<em>$1</em>') // Italic
      .split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');

    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};


export default function ArticlePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const articleRef = useMemo(() => firestore ? doc(firestore, 'blog', params.id) : null, [firestore, params.id]);
  const { data: article, loading: articleLoading } = useDoc<BlogArticle>(articleRef);
  
  const authorRef = useMemo(() => article?.authorId ? doc(firestore, 'users', article.authorId) : null, [article, firestore]);
  const { data: author, loading: authorLoading } = useDoc<User>(authorRef);

  const loading = articleLoading || authorLoading;
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-96 w-full mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-3 w-24" />
            </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Article non trouvé</h2>
        <p className="text-muted-foreground">Cet article n'existe pas ou a été supprimé.</p>
        <Button asChild className="mt-4">
            <Link href="/blog">Retour au blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
            <Image
                src={article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/600`}
                alt={article.title}
                fill
                className="object-cover"
                data-ai-hint={article.imageHint}
                priority
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tight mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
             {author && (
                <Link href={`/profil/${author.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={author.profileImage} />
                        <AvatarFallback>{author.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{author.displayName}</p>
                        <p className="text-sm">Publié le {article.date ? format(article.date.toDate(), 'd MMMM yyyy', { locale: fr }) : 'Date inconnue'}</p>
                    </div>
                </Link>
             )}
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
            <Markdown content={article.content} />
        </CardContent>
      </Card>
      
    </article>
  );
}
