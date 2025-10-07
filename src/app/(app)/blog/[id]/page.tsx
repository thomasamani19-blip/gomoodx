
'use client';

import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { BlogArticle, Purchase, User } from '@/lib/types';
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Simple Markdown-to-HTML converter
const Markdown = ({ content, truncate = false }: { content: string, truncate?: boolean }) => {
    let processedContent = content;
    if (truncate) {
        // Take first paragraph or first 300 characters
        const firstParagraph = content.split('\n\n')[0];
        processedContent = firstParagraph.length > 300 ? firstParagraph.substring(0, 300) + '...' : firstParagraph;
    }

    const html = processedContent
      .replace(/^## (.*$)/gim, '<h2 class="font-headline text-2xl mt-8 mb-4">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n').map(p => p.trim() ? `<p class="mb-4">${p}</p>` : '').join('');

    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};

function SuggestedArticles({ currentArticleId }: { currentArticleId: string }) {
    const firestore = useFirestore();
    const suggestionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'blog'),
            where('__name__', '!=', currentArticleId),
            orderBy('__name__'), // To use '!=' we must order by name
            orderBy('date', 'desc'),
            limit(3)
        );
    }, [firestore, currentArticleId]);
    
    const { data: articles, loading } = useCollection<BlogArticle>(suggestionsQuery);

    if (loading || !articles || articles.length === 0) {
        return null;
    }

    return (
        <div className="mt-16">
            <h2 className="font-headline text-2xl font-bold mb-6">Vous aimerez aussi</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {articles.map((article) => (
                    <Card key={article.id} className="overflow-hidden group flex flex-col">
                        <Link href={`/blog/${article.id}`} className="block">
                            <div className="relative aspect-video">
                                <Image
                                    src={article.imageUrl || `https://picsum.photos/seed/${article.id}/600/400`}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                            </div>
                        </Link>
                        <CardContent className="p-4 flex flex-col flex-1">
                            <h3 className="font-headline text-lg font-semibold mb-2 flex-1">
                                <Link href={`/blog/${article.id}`} className="hover:text-primary transition-colors line-clamp-2">{article.title}</Link>
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                {article.date ? format(article.date.toDate(), "d MMMM yyyy", { locale: fr }) : ''}
                            </p>
                            <Button variant="link" asChild className="p-0 mt-auto self-start text-xs">
                                <Link href={`/blog/${article.id}`}>Lire la suite <ArrowRight className="ml-1 h-3 w-3" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  
  const articleRef = useMemo(() => firestore ? doc(firestore, 'blog', params.id) : null, [firestore, params.id]);
  const { data: article, loading: articleLoading } = useDoc<BlogArticle>(articleRef);
  
  const authorRef = useMemo(() => (firestore && article?.authorId) ? doc(firestore, 'users', article.authorId) : null, [article, firestore]);
  const { data: author, loading: authorLoading } = useDoc<User>(authorRef);

  const purchaseQuery = useMemo(() => {
    if (!firestore || !currentUser || !article || !article.isPremium) return null;
    return query(
        collection(firestore, 'purchases'),
        where('memberId', '==', currentUser.id),
        where('contentId', '==', article.id),
        where('contentType', '==', 'article')
    );
  }, [firestore, currentUser, article]);

  const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>(purchaseQuery);

  const hasPurchased = useMemo(() => purchases && purchases.length > 0, [purchases]);

  const loading = articleLoading || authorLoading || authLoading || (article?.isPremium ? purchasesLoading : false);
  
  const isPremiumAndNotPurchased = article?.isPremium && !hasPurchased && currentUser?.id !== article?.authorId;

  const handlePurchase = async () => {
    if (!currentUser || !article) {
        toast({ title: 'Vous devez être connecté pour acheter.', variant: 'destructive'});
        return;
    }
    setIsPurchasing(true);
    try {
        const response = await fetch('/api/articles/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: currentUser.id, articleId: article.id }),
        });
        const result = await response.json();

        if (response.ok && (result.status === 'success' || result.status === 'already_purchased')) {
            toast({ title: 'Achat réussi !', description: 'Vous avez maintenant accès à l\'article complet.' });
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }

    } catch (error: any) {
        toast({ title: 'Erreur d\'achat', description: error.message, variant: 'destructive' });
    } finally {
        setIsPurchasing(false);
        setShowPurchaseDialog(false);
    }
  }
  
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
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold">Article non trouvé</h2>
        <p className="text-muted-foreground mt-2">Cet article n'existe pas ou a été supprimé.</p>
        <Button asChild className="mt-6">
            <Link href="/blog">Retour au blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-4xl mx-auto">
        <article>
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
                {author ? (
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
                ) : (
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <p className="text-sm">Publié le {article.date ? format(article.date.toDate(), 'd MMMM yyyy', { locale: fr }) : 'Date inconnue'}</p>
                        </div>
                    </div>
                )}
            </div>
        </header>

        <Card>
            <CardContent className="pt-6 relative">
                <Markdown content={article.content} truncate={isPremiumAndNotPurchased} />
                {isPremiumAndNotPurchased && (
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-card to-transparent flex flex-col items-center justify-end p-8">
                        <Button onClick={() => setShowPurchaseDialog(true)} size="lg">
                            <Lock className="mr-2 h-4 w-4"/>
                            Acheter pour lire la suite ({article.price?.toFixed(2)}€)
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
        
        </article>
        
        <SuggestedArticles currentArticleId={params.id} />
    </div>

    <AlertDialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Accéder au contenu premium</AlertDialogTitle>
                <AlertDialogDescription>
                    Pour lire l'intégralité de cet article, veuillez procéder à l'achat pour un montant de <span className="font-bold">{article.price?.toFixed(2)}€</span>. Ce montant sera débité de votre portefeuille GoMoodX.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPurchasing}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handlePurchase} disabled={isPurchasing}>
                    {isPurchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmer l'achat
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
