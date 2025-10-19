
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/page-header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Post, Product, Annonce, ModerationStatus } from '@/lib/types';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Check, X, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

type ModeratableContent = (Post | Product | Annonce) & { collectionPath: 'posts' | 'products' | 'services' };

function ContentCard({ content, onUpdate }: { content: ModeratableContent, onUpdate: (id: string, collectionPath: string, newStatus: ModerationStatus) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async (newStatus: ModerationStatus) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/moderate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId: content.id,
                    collectionPath: content.collectionPath,
                    newStatus: newStatus,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'La mise à jour a échoué.');
            }
            onUpdate(content.id, content.collectionPath, newStatus);
            toast({ title: 'Statut mis à jour', description: `Le contenu a été ${newStatus === 'approved' ? 'approuvé' : 'rejeté'}.` });
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const title = 'title' in content ? content.title : content.content.substring(0, 50) + '...';
    const description = 'description' in content ? content.description : content.content;
    const imageUrl = 'imageUrl' in content ? content.imageUrl : 'mediaUrl' in content ? content.mediaUrl : null;
    const authorName = 'authorName' in content ? content.authorName : 'Vendeur Inconnu';


    return (
        <Card>
            <CardContent className="p-4 flex gap-4">
                {imageUrl && (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                        <Image src={imageUrl} alt={title} fill className="object-cover" />
                    </div>
                )}
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                             <h4 className="font-semibold line-clamp-1">{title}</h4>
                             <p className="text-xs text-muted-foreground">Par: {authorName}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{content.collectionPath.slice(0, -1)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                    {content.moderationReason && (
                        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded-md">
                           <Bot className="h-4 w-4 flex-shrink-0"/>
                           <span>Raison IA : {content.moderationReason}</span>
                        </div>
                    )}
                </div>
                 <div className="flex flex-col gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdate('approved')} disabled={isLoading}>
                       {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                    </Button>
                     <Button size="sm" variant="destructive" onClick={() => handleUpdate('rejected')} disabled={isLoading}>
                       {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ModerationQueue({ collectionPath, typeLabel }: { collectionPath: 'posts' | 'products' | 'services', typeLabel: string }) {
    const firestore = useFirestore();
    const queryRef = useMemo(() => firestore ? query(collection(firestore, collectionPath), where('moderationStatus', '==', 'pending_review')) : null, [firestore, collectionPath]);
    
    const { data, loading, setData } = useCollection(queryRef);

    const onUpdate = (id: string, path: string, newStatus: ModerationStatus) => {
        if (path === collectionPath) {
            setData(prevData => prevData?.filter(item => item.id !== id) || null);
        }
    };

    if (loading) return <Skeleton className="h-40 w-full" />
    if (!data || data.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Aucun {typeLabel} en attente de modération.</p>
    }
    
    return (
        <div className="space-y-4">
            {data.map(item => <ContentCard key={item.id} content={{...item, collectionPath: collectionPath}} onUpdate={onUpdate} />)}
        </div>
    )
}


export default function AdminContentModerationPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (currentUser && ['founder', 'administrateur', 'moderator'].includes(currentUser.role)) {
                setIsAllowed(true);
            } else {
                 setIsAllowed(false);
                 router.push('/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);

     if (!isAllowed && !authLoading) {
        return (
             <div>
                <PageHeader title="Modération de Contenu" />
                <Card><CardHeader><CardTitle>Accès non autorisé</CardTitle></CardHeader><CardContent className="h-40 flex items-center justify-center"><p className="text-muted-foreground">Permissions insuffisantes.</p></CardContent></Card>
            </div>
        )
    }

    return (
        <div>
            <PageHeader title="Modération de Contenu" description="Examinez le contenu marqué comme suspect par l'IA." />
            <Tabs defaultValue="posts">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Publications</TabsTrigger>
                    <TabsTrigger value="produits">Produits</TabsTrigger>
                    <TabsTrigger value="annonces">Annonces</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-6">
                   <ModerationQueue collectionPath="posts" typeLabel="publications" />
                </TabsContent>
                <TabsContent value="produits" className="mt-6">
                    <ModerationQueue collectionPath="products" typeLabel="produits" />
                </TabsContent>
                <TabsContent value="annonces" className="mt-6">
                    <ModerationQueue collectionPath="services" typeLabel="annonces" />
                </TabsContent>
            </Tabs>
        </div>
    )
}
