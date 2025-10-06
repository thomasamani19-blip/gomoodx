
'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import type { Annonce } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { limit, query, collection } from 'firebase/firestore';


export function AnnonceCarousel() {
  const firestore = useFirestore();
  const annoncesQuery = query(collection(firestore, 'services'), limit(10));
  const { data: annonces, loading } = useCollection<Annonce>(annoncesQuery);

  if (loading) {
    return (
        <div className="flex w-full space-x-4">
            <Skeleton className="h-64 w-1/3" />
            <Skeleton className="h-64 w-1/3" />
            <Skeleton className="h-64 w-1/3" />
        </div>
    )
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {annonces && annonces.map((annonce, index) => (
          <CarouselItem key={annonce.id || index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <CardContent className="flex aspect-[4/3] items-center justify-center p-0 relative">
                  {annonce.imageUrl && (
                    <Image
                        src={annonce.imageUrl}
                        alt={annonce.title}
                        fill
                        className="object-cover"
                        data-ai-hint={annonce.imageHint}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-headline text-xl text-white drop-shadow-md">
                    {annonce.title}
                  </span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
