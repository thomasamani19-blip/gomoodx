
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { LiveSession, Purchase } from '@/lib/types';
import { collection, doc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, Video, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';

export default function LiveSessionPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const sessionRef = useMemo(() => firestore ? doc(firestore, 'lives', params.id) : null, [firestore, params.id]);
  const { data: session, loading: sessionLoading } = useDoc<LiveSession>(sessionRef);
  
  const purchaseQuery = useMemo(() => {
    if (!firestore || !user || !session || session.liveType !== 'public_paid') return null;
    return query(
      collection(firestore, 'purchases'),
      where('memberId', '==', user.id),
      where('contentId', '==', session.id),
      where('contentType', '==', 'live_ticket')
    );
  }, [firestore, user, session]);

  const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>(purchaseQuery);

  const hasPurchased = useMemo(() => (purchases && purchases.length > 0) || (user && session && user.id === session.hostId), [purchases, user, session]);
  const loading = sessionLoading || authLoading || (session?.liveType === 'public_paid' ? purchasesLoading : false);

  const canWatch = useMemo(() => {
    if (!session) return false;
    if (session.liveType === 'ai') return true; // AI lives are free
    return hasPurchased;
  }, [session, hasPurchased]);


  const handlePurchaseTicket = async () => {
    if (!user || !session || !session.ticketPrice) {
      toast({ title: "Erreur", description: "Impossible d'acheter le ticket.", variant: "destructive" });
      return;
    }
    setIsPurchasing(true);
    try {
      const response = await fetch('/api/lives/purchase-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: session.id }),
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        toast({ title: 'Ticket acheté !', description: 'Vous avez maintenant accès au live.' });
      } else {
        throw new Error(result.message || 'Une erreur est survenue.');
      }
    } catch (error: any) {
      toast({ title: "Erreur d'achat", description: error.message, variant: "destructive" });
    } finally {
      setIsPurchasing(false);
    }
  };

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

  const headerDescription = (
    <div className="flex items-center gap-4 mt-2">
        <span>Par {session.creatorName || 'un créateur'}</span>
        {session.ticketPrice ? (
            <Badge variant="secondary">{session.ticketPrice} €</Badge>
        ) : (
            <Badge>Gratuit</Badge>
        )}
    </div>
  );

  return (
    <div>
      <PageHeader title={session.title} />
      <div className="mb-8 -mt-6">{headerDescription}</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white text-center">
                {canWatch ? (
                  session.streamUrl && session.streamUrl.startsWith('data:video') ? (
                    <video 
                      src={session.streamUrl} 
                      controls 
                      autoPlay 
                      loop 
                      muted 
                      className="w-full h-full rounded-lg object-cover"
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  ) : (
                    <div>
                        <h3 className="text-xl font-bold">Lecteur Vidéo</h3>
                        <p className="text-muted-foreground">Le live commencera ici. (Intégration Mux, Agora, etc.)</p>
                    </div>
                  )
                ) : (
                  <div className="p-8 bg-card text-card-foreground rounded-lg flex flex-col items-center gap-4">
                    <Ticket className="h-12 w-12 text-primary" />
                    <h3 className="text-xl font-bold">Accès Payant</h3>
                    <p className="text-sm text-muted-foreground">Achetez un ticket pour accéder à ce live exclusif.</p>
                    <Button onClick={handlePurchaseTicket} disabled={isPurchasing} size="lg">
                      {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Ticket className="mr-2 h-4 w-4"/>}
                      Acheter le ticket ({session.ticketPrice} €)
                    </Button>
                  </div>
                )}
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
