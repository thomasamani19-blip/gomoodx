'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Service } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function ServicesPage() {
  const { data: services, loading } = useCollection<Service>('services');

  return (
    <div>
      <PageHeader
        title="Services"
        description="Découvrez le catalogue des services proposés."
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

      {!loading && services && services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={service.imageHint}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-headline text-lg font-semibold truncate">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                   <div className="flex items-center justify-between mt-4">
                     <p className="text-lg font-bold text-primary">{service.price ? `${service.price} €` : 'Sur demande'}</p>
                     <Button variant="secondary" size="sm">Voir plus</Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (!services || services.length === 0) && (
         <Card>
            <CardContent className="pt-6">
            <p className="text-muted-foreground">
                Aucun service n'est disponible pour le moment.
            </p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
