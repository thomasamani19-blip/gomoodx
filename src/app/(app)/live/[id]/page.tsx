
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { LiveSession } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';

export default function LiveSessionPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const sessionRef = firestore ? doc(firestore, 'lives', params.id) : null;
  const { data: session, loading } = useDoc<LiveSession>(sessionRef);

  if (loading) {
    return (
      <div>
        <PageHeader title="Chargement du live..." />
        <Skeleton className="w-full aspect-video" />
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <PageHeader title="Live introuvable" description="Cette session n'existe pas ou est terminée." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={session.title} description={`En direct avec ${session.creatorName}`} />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                <p>Espace réservé pour le lecteur vidéo</p>
                {/* Ici, nous intégrerions un lecteur vidéo comme Mux, Agora, etc. */}
            </div>
        </div>
        <div className="col-span-1">
            <div className="h-full bg-card rounded-lg p-4 flex flex-col">
                <h3 className="font-bold mb-4">Chat en direct</h3>
                <div className="flex-1 bg-muted rounded-md p-2 flex items-center justify-center text-sm text-muted-foreground">
                    <p>Le chat apparaîtra ici.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
