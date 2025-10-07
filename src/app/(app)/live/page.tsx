
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore } from '@/firebase';
import type { LiveSession } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { collection, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";
import { useMemo } from "react";
import { Ticket, Video } from "lucide-react";

export default function LivePage() {
  const firestore = useFirestore();
  // Query for public lives (AI generated or scheduled paid lives)
  const sessionsQuery = useMemo(() => firestore ? query(
    collection(firestore, 'lives'), 
    where('isPublic', '==', true),
    orderBy('status', 'desc'), // Show 'live' sessions first
    orderBy('startTime', 'desc')
    ) : null, [firestore]);
    
  const { data: sessions, loading } = useCollection<LiveSession>(sessionsQuery);

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
               <Link href={`/live/${session.id}`} className="block">
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
                     {session.status === 'scheduled' && (
                      <Badge variant="secondary" className="absolute top-3 right-3">
                        BIENTÔT
                      </Badge>
                    )}
                     <div className="absolute top-3 left-3">
                        {session.liveType === 'ai' ? 
                            <Badge variant="outline"><Video className="h-3 w-3 mr-1"/> Live IA</Badge> : 
                            <Badge><Ticket className="h-3 w-3 mr-1"/> Ticket Payant</Badge>
                        }
                     </div>
                  </div>
                <CardContent className="p-4">
                  <h3 className="font-headline text-lg font-semibold truncate">{session.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">par {session.creatorName || 'un créateur'}</p>
                  <div className="flex items-center justify-between mt-4">
                      <p className="text-sm font-bold text-primary">
                          {session.ticketPrice ? `${session.ticketPrice} €` : 'Gratuit'}
                      </p>
                    <Button variant="secondary" size="sm" asChild>
                        <Link href={`/live/${session.id}`}>{session.status === 'live' ? 'Rejoindre' : 'Voir les détails'}</Link>
                    </Button>
                  </div>
                </CardContent>
               </Link>
            </Card>
          ))}
        </div>
      )}

      {!loading && (!sessions || sessions.length === 0) && (
         <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Aucune session live n'est disponible pour le moment.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
