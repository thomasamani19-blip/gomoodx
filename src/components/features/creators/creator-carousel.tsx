
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
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { query, where, limit } from 'firebase/firestore';


export function CreatorCarousel() {
  const { data: creators, loading } = useCollection<User>('users', {
    constraints: [where('role', '==', 'escorte'), limit(10)],
  });

  if (loading) {
    return (
        <div className="flex w-full space-x-4 overflow-hidden p-1">
            <CarouselSkeletonItem />
            <CarouselSkeletonItem />
            <CarouselSkeletonItem />
            <CarouselSkeletonItem />
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
          <CarouselItem key={creator.id || index} className="md:basis-1/2 lg:basis-1/4">
            <div className="p-1">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <CardContent className="flex aspect-[3/4] items-center justify-center p-0 relative">
                  <Image
                    src={creator.profileImage || `https://picsum.photos/seed/${creator.id}/400/600`}
                    alt={creator.displayName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-headline text-2xl text-white drop-shadow-md">
                    {creator.displayName}
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

const CarouselSkeletonItem = () => (
    <div className="md:basis-1/2 lg:basis-1/4 flex-shrink-0 p-1 w-full">
        <Card>
            <CardContent className="flex aspect-[3/4] items-center justify-center p-0 relative">
                <Skeleton className="w-full h-full" />
            </CardContent>
        </Card>
    </div>
)
