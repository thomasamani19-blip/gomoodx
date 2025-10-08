'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { LiveSession, Purchase } from '@/lib/types';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, Video, CheckCircle, Gift, Bot, Heart, Send, Clapperboard, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ICameraVideoTrack } from "agora-rtc-sdk-ng";
import { useRouter } from 'next/navigation';

const VIRTUAL_GIFTS = [
    { name: 'Rose', icon: '🌹', price: 1 },
    { name: 'Baiser', icon: '😘', price: 5 },
    { name: 'Diamant', icon: '💎', price: 10 },
    { name: 'Feu', icon: '🔥', price: 25 },
    { name: 'Couronne', icon: '👑', price: 100 },
];

const FAKE_USERNAMES = ["Alex", "Julien", "Chris", "Maxime", "LoverBoy92", "Mike", "John", "David", "Thomas", "Paul"];

const FAKE_COMMENTS = [
    "Super ce live !", "J'adore ce que tu fais ❤️", "Incroyable !", "Merci pour ce moment ✨",
    "Qui est de Paris ici ?", "Quelqu'un sait quelle est la musique ?", "C'est génial !", "On t'adore 😍"
];

const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

const ChatMessage = ({ author, message }: { author: string, message: string }) => (
    <div className="text-sm p-2 rounded-lg flex items-start gap-2">
        <p>
            <span className="font-bold mr-2">{author}:</span>
            <span>{message}</span>
        </p>
    </div>
);

const GiftNotification = ({ author, giftName, giftIcon }: { author: string, giftName: string, giftIcon: string }) => (
     <div className="text-sm p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center gap-2">
        <p className="font-bold">
            <span className="text-primary">{author}</span> a envoyé un cadeau: {giftIcon} {giftName}
        </p>
    </div>
);

function LiveChat({ sessionId, hostId }: { sessionId: string, hostId: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<{ author: string, message: string, type: 'comment' | 'gift', giftIcon?: string }[]>([]);

    useEffect(() => {
        const addFakeEvent = () => {
            const randomUser = FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)];
            const isGift = Math.random() > 0.8; 

            if (isGift) {
                const randomGift = VIRTUAL_GIFTS[Math.floor(Math.random() * VIRTUAL_GIFTS.length)];
                setMessages(prev => [...prev, {
                    author: randomUser, message: randomGift.name, type: 'gift', giftIcon: randomGift.icon
                }]);
            } else {
                const randomComment = FAKE_COMMENTS[Math.floor(Math.random() * FAKE_COMMENTS.length)];
                setMessages(prev => [...prev, {
                    author: randomUser, message: randomComment, type: 'comment'
                }]);
            }
        };

        const interval = setInterval(addFakeEvent, 7000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full bg-card rounded-lg p-4 flex flex-col border">
            <h3 className="font-bold mb-4 text-lg">Chat en direct</h3>
            <div className="flex-1 bg-muted rounded-md p-2 flex flex-col-reverse gap-2 overflow-y-auto">
                {messages.slice().reverse().map((msg, index) => (
                    msg.type === 'comment'
                        ? <ChatMessage key={index} author={msg.author} message={msg.message} />
                        : <GiftNotification key={index} author={msg.author} giftName={msg.message} giftIcon={msg.giftIcon!} />
                ))}
                {messages.length === 0 && <p className="text-center text-xs text-muted-foreground m-auto">Le chat est vide pour le moment.</p>}
            </div>
             <div className="mt-4 flex gap-2">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Envoyer un message..." />
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function LiveVideoPlayer({ channelName, isHost }: { channelName: string, isHost: boolean }) {
    const videoRef = useRef<HTMLDivElement>(null);
    let agoraClient: IAgoraRTCClient | null = client;

    useEffect(() => {
        const joinAndDisplay = async () => {
            try {
                const response = await fetch('/api/agora/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelName }),
                });
                const { token, appId, uid } = await response.json();

                if (isHost) {
                  agoraClient!.setClientRole('host');
                } else {
                  agoraClient!.setClientRole('audience');
                }
                
                await agoraClient!.join(appId, channelName, token, uid);

                agoraClient!.on("user-published", async (user, mediaType) => {
                    await agoraClient!.subscribe(user, mediaType);
                    if (mediaType === "video" && videoRef.current) {
                        const remoteVideoTrack = user.videoTrack;
                        remoteVideoTrack!.play(videoRef.current);
                    }
                });
            } catch (error) {
                console.error("Agora connection error:", error);
            }
        };

        joinAndDisplay();

        return () => {
            agoraClient?.leave();
        };
    }, [channelName, isHost, agoraClient]);

    return <div ref={videoRef} className="w-full h-full rounded-lg bg-black" />;
}

export default function LiveSessionPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSendingGift, setIsSendingGift] = useState<string | null>(null);

  const sessionRef = useMemo(() => firestore ? doc(firestore, 'lives', params.id) : null, [firestore, params.id]);
  const { data: session, loading: sessionLoading } = useDoc<LiveSession>(sessionRef);
  
  const purchaseQuery = useMemo(() => {
    if (!firestore || !user || !session || !session.ticketPrice || session.ticketPrice <= 0) return null;
    return query(
      collection(firestore, 'purchases'),
      where('memberId', '==', user.id),
      where('contentId', '==', session.id),
      where('contentType', '==', 'live_ticket')
    );
  }, [firestore, user, session]);

  const { data: purchases, loading: purchasesLoading } = useCollection<Purchase>(purchaseQuery);

  const isHost = user?.id === session?.hostId;

  const canWatch = useMemo(() => {
    if (!session) return false;
    if (isHost) return true;
    if (session.liveType === 'ai' || !session.ticketPrice || session.ticketPrice <= 0) return true;
    return purchases && purchases.length > 0;
  }, [session, purchases, isHost]);

  const loading = sessionLoading || authLoading || (session?.ticketPrice && session.ticketPrice > 0 ? purchasesLoading : false);


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
      if (response.ok && (result.status === 'success' || result.status === 'already_purchased')) {
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

  const handleSendGift = async (gift: {name: string, price: number}) => {
    if (!user || !session) return;
    setIsSendingGift(gift.name);
    try {
        const response = await fetch('/api/gifts/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: user.id,
                receiverId: session.hostId,
                gift,
                sessionId: session.id,
            }),
        });
        const result = await response.json();
        if(response.ok) {
            toast({ title: 'Cadeau envoyé !', description: `Merci pour votre soutien à ${session.creatorName}.` });
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }
    } catch (error: any) {
        toast({ title: "Erreur d'envoi du cadeau", description: error.message, variant: 'destructive' });
    } finally {
        setIsSendingGift(null);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Chargement du live..." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><Skeleton className="w-full aspect-video" /></div>
            <div className="lg:col-span-1"><Skeleton className="w-full h-full min-h-[200px]" /></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div><PageHeader title="Live introuvable" description="Cette session n'existe pas ou est terminée." /></div>;
  }
  
  if (session.status === 'ended') {
      return (
          <div className="text-center py-16">
              <PhoneOff className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-bold">Ce live est terminé</h2>
              <p className="text-muted-foreground">Merci d'avoir participé.</p>
          </div>
      )
  }

  const headerDescription = (
    <div className="flex items-center gap-4 mt-2">
        <span>Par {session.creatorName || 'un créateur'}</span>
        {session.ticketPrice && session.ticketPrice > 0 ? (
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
        <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white text-center relative">
                {canWatch ? (
                    session.status === 'scheduled' ? (
                         <div className="p-8 text-center">
                            <Clapperboard className="h-12 w-12 mx-auto text-primary" />
                            <h3 className="text-xl font-bold mt-4">Le live n'a pas encore commencé</h3>
                            <p className="text-muted-foreground">Revenez à l'heure prévue !</p>
                        </div>
                    ) : (
                       <LiveVideoPlayer channelName={params.id} isHost={isHost} />
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
                {session.status === 'live' && 
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 p-2 rounded-lg text-sm">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                        {session.viewersCount} spectateurs
                    </div>
                }
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Envoyer un cadeau</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    {VIRTUAL_GIFTS.map(gift => (
                        <Button key={gift.name} variant="outline" className="flex-1 min-w-[80px]" onClick={() => handleSendGift(gift)} disabled={!user || isSendingGift !== null}>
                            {isSendingGift === gift.name ? <Loader2 className="h-4 w-4 animate-spin"/> :
                            <><span className="text-2xl mr-2">{gift.icon}</span><div><p className="font-semibold">{gift.name}</p><p className="text-xs text-muted-foreground">{gift.price} €</p></div></>}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 h-[75vh]">
            <LiveChat sessionId={params.id} hostId={session.hostId} />
        </div>
      </div>
    </div>
  );
}
