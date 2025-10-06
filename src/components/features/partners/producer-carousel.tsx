
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
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { query, where, limit, collection } from 'firebase/firestore';
import Link from 'next/link';


export function ProducerCarousel() {
  const firestore = useFirestore();
  const partnersQuery = query(
    collection(firestore, 'users'), 
    where('role', '==', 'partenaire'),
    where('partnerType', '==', 'producer'),
    limit(10)
  );
  const { data: partners, loading } = useCollection<User>(partnersQuery);


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
        {partners && partners.map((partner, index) => (
          <CarouselItem key={partner.id || index} className="md:basis-1/2 lg:basis-1/4">
            <div className="p-1">
              <Link href={`/partenaire/${partner.id}`}>
                <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl group">
                  <CardContent className="flex aspect-square items-center justify-center p-0 relative">
                    <Image
                      src={partner.profileImage || `https://picsum.photos/seed/${partner.id}/400/400`}
                      alt={partner.displayName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute bottom-4 left-4 font-headline text-2xl text-white drop-shadow-md">
                      {partner.displayName}
                    </span>
                  </CardContent>
                </Card>
              </Link>
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
            <CardContent className="flex aspect-square items-center justify-center p-0 relative">
                <Skeleton className="w-full h-full" />
            </CardContent>
        </Card>
    </div>
)
