
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import type { Annonce } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { collection } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ rating, ratingCount, className }: { rating: number, ratingCount?: number, className?: string }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            ))}
            {halfStar && <Star key="half" className="h-4 w-4 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
            ))}
             {ratingCount !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">({ratingCount})</span>
            )}
        </div>
    );
};


export default function AnnoncesPage() {
  const firestore = useFirestore();
  const { data: annonces, loading } = useCollection<Annonce>(collection(firestore, 'services'));

  return (
    <div>
      <PageHeader
        title="Annonces"
        description="Découvrez le catalogue des services et rencontres proposés."
      />
      
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="w-full h-48" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && annonces && annonces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {annonces.map((annonce) => (
            <Card key={annonce.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={annonce.imageUrl || 'https://picsum.photos/seed/annonce/600/400'}
                    alt={annonce.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={annonce.imageHint}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-headline text-lg font-semibold truncate">{annonce.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{annonce.description}</p>
                   <div className="flex items-center justify-between mt-4">
                    <div>
                        <p className="text-lg font-bold text-primary">{annonce.price ? `${annonce.price} €` : 'Sur demande'}</p>
                        <StarRating rating={annonce.rating} ratingCount={annonce.ratingCount} />
                    </div>
                     <Button variant="secondary" size="sm">Voir plus</Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (!annonces || annonces.length === 0) && (
         <Card>
            <CardContent className="pt-6">
            <p className="text-muted-foreground">
                Aucune annonce n'est disponible pour le moment.
            </p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
