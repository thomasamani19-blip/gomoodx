
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
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { limit, query, collection } from 'firebase/firestore';

export function ProductCarousel() {
  const firestore = useFirestore();
  const productsQuery = query(collection(firestore, 'products'), limit(10));
  const { data: products, loading } = useCollection<Product>(productsQuery);

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
                  <CardContent className="flex aspect-[4/3] items-center justify-center p-0 relative">
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
        {products && products.map((product, index) => (
          <CarouselItem key={product.id || index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl group">
                <CardContent className="flex aspect-video items-center justify-center p-0 relative">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={product.imageHint}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-headline text-xl text-white drop-shadow-md">
                      {product.title}
                    </h3>
                    <p className="text-lg font-bold text-primary drop-shadow-md">{product.price} €</p>
                  </div>
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

    