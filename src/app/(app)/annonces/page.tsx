
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import type { Annonce } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { collection } from 'firebase/firestore';

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
                     <p className="text-lg font-bold text-primary">{annonce.price ? `${annonce.price} €` : 'Sur demande'}</p>
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
