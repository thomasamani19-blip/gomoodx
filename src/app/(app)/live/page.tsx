
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore } from '@/firebase';
import type { LiveSession } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { collection } from "firebase/firestore";

export default function LivePage() {
  const firestore = useFirestore();
  const { data: sessions, loading } = useCollection<LiveSession>(collection(firestore, 'lives'));

  return (
    <div>
      <PageHeader
        title="Live Streaming"
        description="Rejoignez les créateurs en direct pour des moments uniques."
      />
      
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full aspect-video" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden group">
               <div className="relative aspect-video">
                  <Image
                    src={session.imageUrl || 'https://picsum.photos/seed/live/600/400'}
                    alt={session.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={session.imageHint}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                   {session.status === 'live' && (
                    <Badge variant="destructive" className="absolute top-3 right-3 animate-pulse">
                      EN DIRECT
                    </Badge>
                  )}
                </div>
              <CardContent className="p-4">
                <h3 className="font-headline text-lg font-semibold truncate">{session.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">par {session.creatorName || 'un créateur'}</p>
                 <div className="flex items-center justify-between mt-4">
                    <p className="text-sm font-bold text-primary">{session.price_per_minute ? `${session.price_per_minute} €/min` : 'Gratuit'}</p>
                   <Button variant="secondary" size="sm">Rejoindre</Button>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (!sessions || sessions.length === 0) && (
         <Card>
            <CardContent className="pt-6">
            <p className="text-muted-foreground">
                Aucune session live n'est disponible pour le moment.
            </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
