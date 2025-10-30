
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
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Annonce } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { limit, query, collection } from 'firebase/firestore';


export function AnnonceCarousel() {
  const firestore = useFirestore();
  const annoncesQuery = query(collection(firestore, 'services'), limit(10));
  const { data: annonces, loading } = useCollection<Annonce>(annoncesQuery);

  if (loading) {
    return (
       <Carousel
        opts={{ align: 'start' }}
        className="w-full"
      >
        <CarouselContent>
          {Array.from({ length: 3 }).map((_, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-video items-center justify-center p-0 relative">
                     <Skeleton className="w-full h-full" />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
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
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl group">
                <CardContent className="flex aspect-video items-center justify-center p-0 relative">
                  {annonce.imageUrl && (
                    <Image
                        src={annonce.imageUrl}
                        alt={annonce.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={annonce.imageHint}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
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
