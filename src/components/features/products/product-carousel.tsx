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
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const MOCK_PRODUCTS: Product[] = [
    { id: 'product-1', name: 'Lingerie fine', description: '', price: 150, imageUrl: 'https://images.unsplash.com/photo-1574539602047-548bf9557352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsaW5nZXJpZXxlbnwwfHx8fDE3NTk2MDE4MzN8MA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'lingerie' },
    { id: 'product-2', name: 'Parfum envoûtant', description: '', price: 80, imageUrl: 'https://images.unsplash.com/photo-1615160460366-2c9a41771b51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwZXJmdW1lJTIwYm90dGxlfGVufDB8fHx8MTc1OTUzNDI0N3ww&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'perfume bottle' },
    { id: 'product-3', name: 'Talons hauts', description: '', price: 250, imageUrl: 'https://images.unsplash.com/photo-1573100925118-870b8efc799d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxoaWdoJTIwaGVlbHN8ZW58MHx8fHwxNzU5NTY0MzA3fDA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'high heels' },
    { id: 'product-4', name: 'Vidéo exclusive', description: '', price: 50, imageUrl: 'https://images.unsplash.com/photo-1558522191-55f74eface28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx2aWRlbyUyMHBsYXl8ZW58MHx8fHwxNzU5NTk5NzgxfDA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'video play' },
];

export function ProductCarousel() {
  const { data: products, loading } = useCollection<Product>('products');

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
        {(products && products.length > 0 ? products : MOCK_PRODUCTS).map((product, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <CardContent className="flex aspect-[4/3] items-center justify-center p-0 relative">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product.imageHint}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-headline text-xl text-white drop-shadow-md">
                    {product.name}
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
