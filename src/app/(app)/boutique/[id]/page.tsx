
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { Product, User } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { MessageCircle, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const productRef = useMemo(() => firestore ? doc(firestore, 'products', params.id) : null, [firestore, params.id]);
  const { data: product, loading: productLoading } = useDoc<Product>(productRef);
  
  // TODO: The product type should include creatorId to fetch creator info.
  // const creatorRef = useMemo(() => (product?.createdBy && firestore) ? doc(firestore, 'users', product.createdBy) : null, [product, firestore]);
  // const { data: creator, loading: creatorLoading } = useDoc<User>(creatorRef);

  const loading = productLoading; // || creatorLoading;
  
  const handlePurchase = async () => {
    toast({ title: 'Fonctionnalité à venir', description: "L'API pour finaliser l'achat sera implémentée prochainement."});
    // Placeholder for purchase logic
    // setIsPurchasing(true);
    // ... call API route ...
    // setIsPurchasing(false);
  };


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

  return (
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
                        <CardTitle className="text-3xl lg:text-4xl font-headline">{product.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{product.description}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader className="text-center">
                        <p className="text-4xl font-bold text-primary">{product.price} €</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                         <Button size="lg" onClick={handlePurchase} disabled={isPurchasing}>
                             {isPurchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             {isPurchasing ? 'Achat en cours...' : 'Acheter maintenant'}
                         </Button>
                         <Button size="lg" variant="outline">
                            <Heart className="mr-2 h-4 w-4" /> Ajouter aux favoris
                         </Button>
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
