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
import type { Service } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


const MOCK_SERVICES: Service[] = [
    { id: 'service-1', title: 'Dîner romantique', description: '', imageUrl: 'https://images.unsplash.com/photo-1529175283207-194a414b9ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxkaW5uZXIlMjBkYXRlfGVufDB8fHx8MTc1OTU3MTI2MXww&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'dinner date' },
    { id: 'service-2', title: 'Voyage exotique', description: '', imageUrl: 'https://images.unsplash.com/photo-1728970381320-b40a223e46d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bHV4dXJ5JTIwbGlmZXN0eWxlfGVufDB8fHx8MTc1OTU5OTI4MHww&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'luxury lifestyle' },
    { id: 'service-3', title: 'Soirée privée', description: '', imageUrl: 'https://images.unsplash.com/photo-1544843776-7c98a52e08a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzcGElMjB3ZWxsbmVzc3xlbnwwfHx8fDE3NTk1OTY5ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'spa wellness' },
    { id: 'service-4', title: 'Accompagnement événementiel', description: '', imageUrl: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxnYWxhJTIwZXZlbnR8ZW58MHx8fHwxNzU5NTEyMDcwfDA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'gala event' },
];


export function ServiceCarousel() {
  const { data: services, loading } = useCollection<Service>('services');

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
        {(services && services.length > 0 ? services : MOCK_SERVICES).map((service, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <CardContent className="flex aspect-[4/3] items-center justify-center p-0 relative">
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    className="object-cover"
                    data-ai-hint={service.imageHint}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 font-headline text-xl text-white drop-shadow-md">
                    {service.title}
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
