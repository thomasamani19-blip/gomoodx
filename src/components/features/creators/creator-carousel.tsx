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


const MOCK_CREATORS: Creator[] = [
    { id: 'creator-1', name: 'Isabelle', bio: 'Bio d\'Isabelle', imageUrl: 'https://images.unsplash.com/photo-1615538785945-6625ccdb4b25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHdvbWFufGVufDB8fHx8MTc1OTU4MDg4NHww&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'portrait woman' },
    { id: 'creator-2', name: 'Chloé', bio: 'Bio de Chloé', imageUrl: 'https://images.unsplash.com/photo-1627577279497-4b24bf1021b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxmYXNoaW9uJTIwbW9kZWx8ZW58MHx8fHwxNzU5NTg4NTg2fDA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'fashion model' },
    { id: 'creator-3', name: 'Sofia', bio: 'Bio de Sofia', imageUrl: 'https://images.unsplash.com/photo-1723291875355-cc9be3c07a76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzZW5zdWFsJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzU5NjAxODMzfDA&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'sensual portrait' },
    { id: 'creator-4', name: 'Amira', bio: 'Bio d\'Amira', imageUrl: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3b21hbiUyMHNtaWxlfGVufDB8fHx8MTc1OTU3MjE2OXww&ixlib=rb-4.1.0&q=80&w=1080', imageHint: 'woman smile' },
]


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
        {(creators && creators.length > 0 ? creators : MOCK_CREATORS).map((creator, index) => (
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
