
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Call, User, Wallet } from '@/lib/types';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, query, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, Loader2, PhoneOff, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';


const VIRTUAL_GIFTS = [
    { name: 'Rose', icon: '🌹', price: 1 },
    { name: 'Baiser', icon: '😘', price: 5 },
    { name: 'Diamant', icon: '💎', price: 10 },
    { name: 'Feu', icon: '🔥', price: 25 },
    { name: 'Couronne', icon: '👑', price: 100 },
];

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const agoraClient: IAgoraRTCClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export default function CallPage({ params }: { params: { callId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callTimer, setCallTimer] = useState(0);
  const [isSendingGift, setIsSendingGift] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const callRef = useMemo(() => firestore ? doc(firestore, `calls/${params.callId}`) : null, [firestore, params.callId]);
  const { data: callDoc, loading: callLoading } = useDoc<Call>(callRef);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  const otherUserId = user && callDoc ? (callDoc.callerId === user.id ? callDoc.receiverId : callDoc.callerId) : null;
  const otherUserRef = (firestore && otherUserId) ? doc(firestore, `users/${otherUserId}`) : null;
  const { data: otherUser } = useDoc<User>(otherUserRef);
  
  const isCaller = user && callDoc && callDoc.callerId === user.id;

  // Utilisation de useMemo pour la fonction hangUp pour la stabiliser
  const hangUp = useMemo(() => async (updateDb = true) => {
    if (callStatus === 'ended') return;
    setCallStatus('ended');

    localAudioTrack?.close();
    localVideoTrack?.close();
    if (isJoined) {
        await agoraClient.leave();
        setIsJoined(false);
    }
    
    const callDuration = callStartTimeRef.current ? Math.floor((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000) : 0;
    
    if (isCaller && callDuration > 0 && callDoc) {
        if (callDoc.isFreeCall) {
            try {
                await fetch('/api/calls/log-duration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: callDoc.callerId, duration: callDuration }),
                });
            } catch (error) { console.error("Failed to log call duration:", error); }
        } else if (callDoc.pricePerMinute && callDoc.pricePerMinute > 0) {
            try {
                await fetch('/api/calls/billing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callId: callDoc.id, duration: callDuration }),
                });
                toast({ title: 'Appel terminé', description: 'La facturation a été traitée.' });
            } catch (error) {
                console.error("Billing API call failed:", error);
                toast({ title: 'Erreur de facturation', description: "Impossible de traiter la facturation de l'appel.", variant: 'destructive' });
            }
        }
    }

    if (updateDb && callRef) {
        try {
            await updateDoc(callRef, { status: 'ended', endedAt: serverTimestamp() });
        } catch(e) { /* ignore */ }
    }
    router.push('/messagerie');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAudioTrack, localVideoTrack, isJoined, callDoc, callRef, isCaller, router, toast, callStatus]);


  // Setup and teardown Agora client
  useEffect(() => {
    if (!user || !firestore || !callDoc || isJoined || callStatus === 'ended') return;

    let isMounted = true;
    const joinChannel = async () => {
        if (!isMounted) return;

        try {
            const isVoiceCall = callDoc.type === 'voice';

            const response = await fetch('/api/agora/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelName: params.callId, uid: user.id }),
            });
            const { token, appId } = await response.json();

            await agoraClient.join(appId, params.callId, token, user.id);
            if (!isMounted) { await agoraClient.leave(); return; };
            setIsJoined(true);
            setCallStatus('connecting');

            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
                encoderConfig: isVoiceCall ? undefined : "480p_1"
            });
             if (!isMounted) { audioTrack.close(); videoTrack.close(); await agoraClient.leave(); return; };
            
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);

            if (isVoiceCall) {
                await videoTrack.setEnabled(false);
                setIsVideoOff(true);
            }

            await agoraClient.publish([audioTrack, videoTrack]);
            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
            }
        } catch(error) {
            console.error("Agora Join Error:", error);
            toast({ title: "Erreur de Connexion", description: "Impossible de démarrer l'appel.", variant: "destructive" });
            if (isMounted) hangUp();
        }
    };
    
    joinChannel();
    
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        await agoraClient.subscribe(user, mediaType);
        if (!isMounted) return;

        if (mediaType === 'video') {
            setRemoteUser(user);
            if (remoteVideoRef.current) {
                user.videoTrack?.play(remoteVideoRef.current);
            }
            if (callStatus !== 'connected') {
                setCallStatus('connected');
                callStartTimeRef.current = new Date();
                if (callRef) updateDoc(callRef, { startedAt: serverTimestamp() });
            }
        }
        if (mediaType === 'audio') {
            user.audioTrack?.play();
        }
    };
    
    const handleUserLeft = () => {
        setRemoteUser(null);
        if (isMounted) hangUp();
    };

    agoraClient.on("user-published", handleUserPublished);
    agoraClient.on("user-left", handleUserLeft);
    
    const unsubFirestore = onSnapshot(callRef!, snapshot => {
        const data = snapshot.data();
        if (data?.status === 'ended' || data?.status === 'declined' || data?.status === 'missed') {
            if (isMounted) hangUp(false);
        }
    });

    return () => {
        isMounted = false;
        agoraClient.off("user-published", handleUserPublished);
        agoraClient.off("user-left", handleUserLeft);
        unsubFirestore();
        hangUp();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, callDoc?.id]);
  
  // Call Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
        interval = setInterval(() => { setCallTimer(prev => prev + 1) }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const toggleMute = () => {
      localAudioTrack?.setMuted(!isMuted).then(() => setIsMuted(!isMuted));
  }

  const toggleVideo = () => {
      if (callDoc?.type === 'voice') {
          toast({ title: "Mode vocal", description: "La vidéo ne peut pas être activée pendant un appel vocal." });
          return;
      }
      localVideoTrack?.setEnabled(!isVideoOff).then(() => setIsVideoOff(!isVideoOff));
  }

  const handleSendGift = async (gift: {name: string, price: number}) => {
    if (!user || !otherUser) return;
    setIsSendingGift(gift.name);
    try {
        const response = await fetch('/api/gifts/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: user.id, receiverId: otherUser.id, gift, sessionId: callDoc?.id }),
        });
        const result = await response.json();
        if(response.ok) {
            toast({ title: 'Cadeau envoyé !', description: `Merci pour votre soutien à ${otherUser.displayName}.` });
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }
    } catch (error: any) {
        toast({ title: "Erreur d'envoi du cadeau", description: error.message, variant: "destructive" });
    } finally {
        setIsSendingGift(null);
    }
  }
  
  if (callLoading || authLoading || !callDoc) {
      return <div className="w-full h-screen flex items-center justify-center bg-black"><Skeleton className="w-full h-full" /></div>
  }
  
  const hasRemoteVideo = remoteUser?.hasVideo;
  const isVoiceCall = callDoc.type === 'voice';

  return (
    <div className="relative h-screen w-screen bg-black text-white flex items-center justify-center">
        {hasRemoteVideo && !isVoiceCall ? (
            <div ref={remoteVideoRef} className="h-full w-full object-cover" />
        ) : (
             <div className="flex flex-col items-center justify-center text-white">
                <Avatar className="h-40 w-40 border-4 border-primary">
                    <AvatarImage src={otherUser?.profileImage} /> 
                    <AvatarFallback className="text-6xl">{otherUser?.displayName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-bold mt-6">{otherUser?.displayName}</h2>
                 <Badge variant="secondary" className="mt-4 text-base">
                    {callStatus === 'connected' ? formatTime(callTimer) : 'Connexion...'}
                </Badge>
            </div>
        )}
        
        {!isVoiceCall && (
            <Card className="absolute top-4 right-4 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary bg-black">
                <CardContent className="p-0 h-full w-full">
                    {localVideoTrack && <div ref={localVideoRef} className="h-full w-full object-cover scale-x-[-1]" />}
                </CardContent>
            </Card>
        )}
        
        {callStatus === 'connected' && (
             <Badge variant="secondary" className="absolute top-4 left-4 text-base">
                {formatTime(callTimer)}
            </Badge>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/50 rounded-full">
            <Button onClick={toggleMute} variant="secondary" size="icon" className="rounded-full h-14 w-14">
                {isMuted ? <MicOff /> : <Mic />}
            </Button>
             <Button onClick={toggleVideo} variant={isVideoOff ? 'destructive' : 'secondary'} size="icon" className="rounded-full h-14 w-14">
                {isVideoOff ? <VideoOff /> : <Video />}
            </Button>
            <Button onClick={() => hangUp()} variant="destructive" size="icon" className="rounded-full h-16 w-16">
                <Phone />
            </Button>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full h-14 w-14 bg-yellow-500 hover:bg-yellow-600">
                        <Gift />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-black/70 border-primary/50 backdrop-blur-sm">
                    <div className="flex gap-2">
                        {VIRTUAL_GIFTS.map(gift => (
                             <Button 
                                key={gift.name} 
                                variant="ghost" 
                                className="flex flex-col h-auto p-2"
                                onClick={() => handleSendGift(gift)}
                                disabled={isSendingGift !== null}
                            >
                                {isSendingGift === gift.name ? <Loader2 className="h-6 w-6 animate-spin"/> :
                                <>
                                 <span className="text-2xl">{gift.icon}</span>
                                 <span className="text-xs">{gift.price}€</span>
                                </>}
                             </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        {callStatus === 'connecting' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                <Avatar className="h-32 w-32">
                    <AvatarImage src={otherUser?.profileImage} /> 
                    <AvatarFallback className="text-4xl">
                        {otherUser?.displayName?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">
                    {callDoc?.status === 'pending' ? `Appel de ${callDoc?.callerName}...` : 'Connexion en cours...'}
                </h2>
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )}
    </div>
  );
}
