
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';

export default function BoutiquePage() {
  const firestore = useFirestore();
  const productsQuery = useMemo(() => firestore ? query(collection(firestore, 'products'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: products, loading } = useCollection<Product>(productsQuery);

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    // Sort by sponsored status, then by creation date
    return [...products].sort((a, b) => {
        const aIsSponsored = a.isSponsored ? 1 : 0;
        const bIsSponsored = b.isSponsored ? 1 : 0;
        if (aIsSponsored !== bIsSponsored) return bIsSponsored - aIsSponsored;
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    });
  }, [products]);

  return (
    <div>
      <PageHeader
        title="Boutique"
        description="Parcourez les contenus premium et produits exclusifs."
      />
      
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="w-full aspect-video" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                   <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && sortedProducts && sortedProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => {
            const isOnSale = product.originalPrice && product.originalPrice > product.price;
            return (
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
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                         {product.isSponsored && (
                            <Badge variant="secondary" className="absolute top-2 right-2">À la une</Badge>
                         )}
                         {isOnSale && (
                             <Badge variant="destructive" className="absolute top-2 left-2"><Percent className="mr-1 h-3 w-3"/>PROMO</Badge>
                         )}
                        </div>
                        <div className="p-4">
                        <h3 className="font-headline text-lg font-semibold truncate">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-baseline gap-2">
                                <p className="text-lg font-bold text-primary">{product.price > 0 ? `${product.price.toFixed(2)} €` : 'Gratuit'}</p>
                                {isOnSale && (
                                    <p className="text-sm text-muted-foreground line-through">{product.originalPrice?.toFixed(2)} €</p>
                                )}
                            </div>
                            <Button variant="secondary" size="sm" asChild>
                                <Link href={`/boutique/${product.id}`}>Voir plus</Link>
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                </Link>
            </Card>
          )})}
        </div>
      )}

      {!loading && (!sortedProducts || sortedProducts.length === 0) && (
         <Card>
            <CardContent className="pt-6">
            <p className="text-muted-foreground">
                Aucun produit n'est disponible pour le moment.
            </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
