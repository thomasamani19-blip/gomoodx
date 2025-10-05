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
import { useCollection } from '@/firebase';
import type { Creator } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


export function CreatorCarousel() {
  const { data: creators, loading } = useCollection<Creator>('creators');

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
        {creators && creators.map((creator, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/4">
            <div className="p-1">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <CardContent className="flex aspect-[3/4] items-center justify-center p-0 relative">
                  <Image
                    src={creator.imageUrl}
                    alt={creator.name}
                    fill
                    className="object-cover"
                    data-ai-hint={creator.imageHint}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-headline text-2xl text-white drop-shadow-md">
                    {creator.name}
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
