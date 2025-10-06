
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Call, User, Wallet } from '@/lib/types';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, query, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, Loader2, PhoneOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/utils'; // Assuming this utility will be created

// Util to format seconds into MM:SS
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function CallPage({ params }: { params: { callId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callTimer, setCallTimer] = useState(0);

  const callRef = useMemo(() => firestore ? doc(firestore, `calls/${params.callId}`) : null, [firestore, params.callId]);
  const { data: callDoc, loading: callLoading } = useDoc<Call>(callRef);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const hasHungUp = useRef(false);

  const otherUserId = user && callDoc ? (callDoc.callerId === user.id ? callDoc.receiverId : callDoc.callerId) : null;
  const otherUserRef = (firestore && otherUserId) ? doc(firestore, `users/${otherUserId}`) : null;
  const { data: otherUser } = useDoc<User>(otherUserRef);
  
  const isCaller = user && callDoc && callDoc.callerId === user.id;

  // Setup peer connection, media, and billing checks
  useEffect(() => {
    if (!user || !firestore || !callDoc || callStatus === 'ended') return;

    const isVoiceCall = callDoc.type === 'voice';
    setIsVideoOff(isVoiceCall);
    
    const initializeCall = async () => {
        const peerConnection = new RTCPeerConnection(servers);
        setPc(peerConnection);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: !isVoiceCall, audio: true });
            stream.getVideoTracks().forEach(track => track.enabled = !isVoiceCall);
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        } catch (error) {
            console.error("Error accessing media devices.", error);
            toast({ title: "Erreur Média", description: "Impossible d'accéder à la caméra/micro.", variant: "destructive" });
            hangUp();
            return;
        }

        const remoteMediaStream = new MediaStream();
        setRemoteStream(remoteMediaStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteMediaStream;

        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => remoteMediaStream.addTrack(track));
        };
        
        peerConnection.onconnectionstatechange = () => {
            if (peerConnection.connectionState === 'connected' && callStatus !== 'connected') {
                setCallStatus('connected');
                callStartTimeRef.current = new Date(); // Start timer
                if (callRef) updateDoc(callRef, { startedAt: serverTimestamp() });
            }
            if (['failed', 'disconnected', 'closed'].includes(peerConnection.connectionState)) {
                 hangUp();
            }
        };
    }

    initializeCall();

    return () => {
        pc?.close();
        localStream?.getTracks().forEach(track => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, callDoc?.id]);

  // Call Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
        interval = setInterval(() => {
            setCallTimer(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);
  
  // Hang up effect with billing logic
  const hangUp = useMemo(() => async (updateDb = true) => {
    if (hasHungUp.current) return;
    hasHungUp.current = true;
    setCallStatus('ended');

    pc?.close();
    localStream?.getTracks().forEach(track => track.stop());

    const callDuration = callStartTimeRef.current ? Math.floor((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000) : 0;

    // Only the caller handles billing to avoid double billing
    if (isCaller && callDoc?.pricePerMinute && callDoc.pricePerMinute > 0 && callDuration > 0) {
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

    if (updateDb && callRef) {
        await updateDoc(callRef, { status: 'ended', endedAt: serverTimestamp() });
        // Optional: Clean up candidates and call doc
    }
    router.push('/messagerie');
  }, [pc, localStream, callDoc, isCaller, callRef, router, toast]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        hangUp();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hangUp]);


  // Signaling logic
  useEffect(() => {
    if (!pc || !user || !firestore || !callDoc || !callRef) return;
    
    const callId = callDoc.id;
    const offerCandidates = collection(callRef, 'offerCandidates');
    const answerCandidates = collection(callRef, 'answerCandidates');

    pc.onicecandidate = event => {
        if (event.candidate) {
            const candidatesCollection = callDoc.callerId === user.id ? offerCandidates : answerCandidates;
            addDoc(candidatesCollection, event.candidate.toJSON());
        }
    };

    const createOffer = async () => {
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        await updateDoc(callRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });
    };

    const createAnswer = async (offer: RTCSessionDescriptionInit) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        await updateDoc(callRef, { answer: { sdp: answerDescription.sdp, type: answerDescription.type } });
    };

    const addAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    if (callDoc.callerId === user.id && callDoc.status === 'pending' && !callDoc.offer) {
        createOffer();
    }
    
    const unsubscribe = onSnapshot(callRef, snapshot => {
        const data = snapshot.data();
        if (data?.offer && user.id === callDoc.receiverId && !pc.currentRemoteDescription) {
            createAnswer(data.offer);
        }
        if (data?.answer && user.id === callDoc.callerId) {
            addAnswer(data.answer);
        }
        if (data?.status === 'ended' || data?.status === 'declined' || data?.status === 'missed') {
            hangUp(false); // don't update doc again
        }
    });

    const candidatesCollectionRef = user.id === callDoc.callerId ? answerCandidates : offerCandidates;
    const unsubscribeCandidates = onSnapshot(candidatesCollectionRef, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
        });
    });

    return () => {
        unsubscribe();
        unsubscribeCandidates();
    };
  }, [pc, user, firestore, callDoc, callRef, hangUp]);
  
  
  const toggleMute = () => {
      localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
  }

  const toggleVideo = () => {
      if (callDoc?.type === 'voice') {
          toast({ title: "Mode vocal", description: "La vidéo ne peut pas être activée pendant un appel vocal." });
          return;
      }
      localStream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
  }
  
  if (callLoading || authLoading || !callDoc) {
      return <div className="w-full h-screen flex items-center justify-center bg-black"><Skeleton className="w-full h-full" /></div>
  }
  
  if (callStatus === 'ended') {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
            <PhoneOff className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold">Appel terminé</h1>
            <p className="text-muted-foreground">Vous allez être redirigé...</p>
        </div>
    )
  }

  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0 && remoteStream.getVideoTracks().some(t => t.enabled);
  const isVoiceCall = callDoc.type === 'voice';

  return (
    <div className="relative h-screen w-screen bg-black text-white flex items-center justify-center">
        {hasRemoteVideo && !isVoiceCall ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
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
                    {localStream && <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />}
                </CardContent>
            </Card>
        )}
        
        {callStatus === 'connected' && hasRemoteVideo && (
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
