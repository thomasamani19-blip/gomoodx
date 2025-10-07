
'use-client';

import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Product, User, Settings } from '@/lib/types';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageCircle, Heart, Loader2, Package, Film, Download, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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


function SuggestedProducts({ currentProductId }: { currentProductId: string }) {
    const firestore = useFirestore();
    const suggestionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'products'),
            where('__name__', '!=', currentProductId),
            limit(4)
        );
    }, [firestore, currentProductId]);
    
    const { data: products, loading } = useCollection<Product>(suggestionsQuery);

    if (loading || !products || products.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6 mt-8">
            <h2 className="font-headline text-2xl font-bold">Vous aimerez aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden group">
                        <Link href={`/boutique/${product.id}`} className="block">
                            <CardContent className="p-0">
                                <div className="relative aspect-video">
                                    <Image
                                        src={product.imageUrl || 'https://picsum.photos/seed/product/600/400'}
                                        alt={product.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={product.imageHint}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-headline text-lg font-semibold truncate">{product.title}</h3>
                                    <p className="text-lg font-bold text-primary mt-2">{product.price ? `${product.price} €` : 'Prix non disponible'}</p>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showContactPassDialog, setShowContactPassDialog] = useState(false);
  const [isBuyingPass, setIsBuyingPass] = useState(false);

  const productRef = useMemo(() => firestore ? doc(firestore, 'products', params.id) : null, [firestore, params.id]);
  const { data: product, loading: productLoading } = useDoc<Product>(productRef);
  
  const creatorRef = useMemo(() => (product?.createdBy && firestore) ? doc(firestore, 'users', product.createdBy) : null, [product, firestore]);
  const { data: creator, loading: creatorLoading } = useDoc<User>(creatorRef);

  const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);


  const loading = productLoading || creatorLoading || authLoading || settingsLoading;
  
  const handlePurchase = async () => {
    if (!user) {
        toast({ title: 'Connexion requise', description: 'Vous devez être connecté pour acheter.', variant: 'destructive'});
        router.push('/connexion');
        return;
    }

    if (user.id === product?.createdBy) {
        toast({ title: 'Action impossible', description: 'Vous ne pouvez pas acheter votre propre produit.', variant: 'destructive'});
        return;
    }

    setIsPurchasing(true);

    try {
        const response = await fetch('/api/products/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberId: user.id,
                productId: params.id,
            }),
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            toast({
                title: 'Achat réussi !',
                description: `Vous avez acheté "${product?.title}".`,
            });
            // Optional: redirect to a "My Purchases" page
            // router.push('/mes-achats');
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }

    } catch (error: any) {
        toast({
            title: 'Échec de l\'achat',
            description: error.message || "Impossible de finaliser l'achat. Veuillez réessayer.",
            variant: 'destructive',
        });
    } finally {
        setIsPurchasing(false);
    }
  };
  
  const handleBuyContactPass = async () => {
    if (!user || !creator) return;
    setIsBuyingPass(true);
    try {
        const response = await fetch('/api/products/purchase-contact-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, sellerId: creator.id })
        });
        const result = await response.json();
        if (result.status === 'success') {
            toast({ title: "Contact débloqué !", description: "Vous pouvez maintenant envoyer un message." });
            router.push(`/messagerie?contact=${creator.id}`);
        } else {
            throw new Error(result.message || "Une erreur est survenue.");
        }
    } catch (error: any) {
        toast({ title: "Erreur d'achat", description: error.message, variant: "destructive" });
    } finally {
        setIsBuyingPass(false);
        setShowContactPassDialog(false);
    }
  }

  const handleContactSeller = () => {
    if (!user || !creator) {
        toast({ title: 'Connexion requise', variant: 'destructive' });
        router.push('/connexion');
        return;
    }
    // Check if user has already unlocked this contact
    if (user.unlockedContacts?.includes(creator.id)) {
        router.push(`/messagerie?contact=${creator.id}`);
    } else {
        setShowContactPassDialog(true);
    }
  }


  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="w-full h-96 rounded-lg" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Produit non trouvé</h2>
        <p className="text-muted-foreground">Ce produit n'existe pas ou a été supprimé.</p>
        <Button asChild className="mt-4">
            <Link href="/boutique">Retour à la boutique</Link>
        </Button>
      </div>
    );
  }
  
  const isPhysical = product.productType === 'physique';
  const isFreeDigital = product.productType === 'digital' && product.price === 0;
  const isPaidDigital = product.productType === 'digital' && product.price > 0;
  const contactPassPrice = settings?.passContact?.price || 5;
  const hasUnlockedContact = !!(user && creator && user.unlockedContacts?.includes(creator.id));

  return (
    <>
    <div className="space-y-8">
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
             <Image
                src={product.imageUrl || 'https://picsum.photos/seed/product-detail/1200/400'}
                alt={product.title}
                fill
                className="object-cover"
                data-ai-hint={product.imageHint}
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-24">
            <div className="md:col-span-2 space-y-6">
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-3xl lg:text-4xl font-headline">{product.title}</CardTitle>
                            <Badge variant={isPhysical ? "secondary" : "default"}>
                                {isPhysical ? <Package className="mr-2 h-4 w-4" /> : <Film className="mr-2 h-4 w-4" />}
                                {isPhysical ? 'Produit Physique' : 'Contenu Digital'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{product.description}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader className="text-center">
                        <p className="text-4xl font-bold text-primary">
                            {isPhysical ? 'Sur demande' : (isFreeDigital ? 'Gratuit' : `${product.price} €`)}
                        </p>
                         {isPhysical && <p className="text-xs text-muted-foreground">Paiement à organiser avec le vendeur.</p>}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {isPhysical ? (
                            <Button size="lg" onClick={handleContactSeller}>
                                {hasUnlockedContact ? <CheckCircle className="mr-2 h-4 w-4"/> : <MessageCircle className="mr-2 h-4 w-4" />}
                                {hasUnlockedContact ? 'Contacter' : 'Contacter pour acheter'}
                            </Button>
                        ) : isPaidDigital ? (
                             <Button size="lg" onClick={handlePurchase} disabled={isPurchasing}>
                                 {isPurchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 {isPurchasing ? 'Achat en cours...' : 'Acheter maintenant'}
                             </Button>
                        ) : isFreeDigital ? (
                             <Button size="lg" disabled>
                                <Download className="mr-2 h-4 w-4" /> Télécharger (Bientôt)
                             </Button>
                        ) : null}
                         <Button size="lg" variant="outline">
                            <Heart className="mr-2 h-4 w-4" /> Ajouter aux favoris
                         </Button>
                    </CardContent>
                 </Card>
                 {creator && (
                    <Card>
                        <CardHeader>
                             <CardTitle>Vendu par</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={creator.profileImage} alt={creator.displayName} />
                                    <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <Link href={`/profil/${creator.id}`} className="font-bold hover:underline">{creator.displayName}</Link>
                                    <p className="text-sm text-muted-foreground capitalize">{creator.role}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
        <SuggestedProducts currentProductId={params.id} />
    </div>
    
    <AlertDialog open={showContactPassDialog} onOpenChange={setShowContactPassDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Débloquer le Contact</AlertDialogTitle>
                <AlertDialogDescription>
                    Pour contacter le vendeur de ce produit physique, vous devez acheter un "Pass Contact". Ce pass, d'un montant de <span className="font-bold">{contactPassPrice.toFixed(2)}€</span>, vous donnera accès à la messagerie privée avec ce vendeur pour finaliser votre achat.
                    <br/><br/>
                    Ce montant est facturé par la plateforme pour la mise en relation.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isBuyingPass}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleBuyContactPass} disabled={isBuyingPass}>
                    {isBuyingPass && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Payer le Pass et Contacter
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
