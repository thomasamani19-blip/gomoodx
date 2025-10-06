
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Skeleton className="w-full aspect-video" />
            </div>
            <div className="lg:col-span-1">
                 <Skeleton className="w-full h-full min-h-[200px]" />
            </div>
        </div>
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
      <PageHeader title={session.title} description={`En direct avec ${session.creatorName || 'un créateur'}`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white text-center">
                <div>
                    <h3 className="text-xl font-bold">Lecteur Vidéo</h3>
                    <p className="text-muted-foreground">Ici s'intégrerait un lecteur vidéo (Mux, Agora, etc.)</p>
                </div>
            </div>
        </div>
        <div className="lg:col-span-1">
            <div className="h-full bg-card rounded-lg p-4 flex flex-col border">
                <h3 className="font-bold mb-4 text-lg">Chat en direct</h3>
                <div className="flex-1 bg-muted rounded-md p-2 flex items-center justify-center text-sm text-muted-foreground">
                    <p>Le chat apparaîtra ici.</p>
                </div>
                 <div className="mt-4 flex gap-2">
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Envoyer un message..." />
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground">Envoyer</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
