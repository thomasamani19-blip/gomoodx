
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Call } from '@/lib/types';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// Utiliser un serveur STUN public
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const callRef = doc(firestore, `calls/${params.callId}`);
  const { data: callDoc, loading: callLoading } = useDoc<Call>(callRef);

  useEffect(() => {
    let peerConnection: RTCPeerConnection;
    let localMediaStream: MediaStream;
    let remoteMediaStream: MediaStream;
    
    const initPeerConnection = async () => {
        if (!user || !firestore || !callDoc) return;
        
        peerConnection = new RTCPeerConnection(servers);
        setPc(peerConnection);

        localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(localMediaStream);
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localMediaStream;
        }

        remoteMediaStream = new MediaStream();
        setRemoteStream(remoteMediaStream);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteMediaStream;
        }

        localMediaStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localMediaStream);
        });

        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteMediaStream.addTrack(track);
            });
        };
        
        const callId = params.callId;
        const callDocRef = doc(firestore, 'calls', callId);
        const offerCandidates = collection(callDocRef, 'offerCandidates');
        const answerCandidates = collection(callDocRef, 'answerCandidates');

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const candidatesCollection = callDoc.callerId === user.id ? offerCandidates : answerCandidates;
                addDoc(candidatesCollection, event.candidate.toJSON());
            }
        };

        // --- Logique de signalisation ---

        // Créer une offre si on est l'appelant
        if (callDoc.callerId === user.id && callDoc.status === 'pending') {
            const offerDescription = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offerDescription);
            await updateDoc(callDocRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type }, status: 'ongoing' });
        }

        // Écouter la description distante et répondre si on est le destinataire
        const unsubscribe = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            // Logique pour le receveur pour répondre à l'offre
            if (data.offer && !peerConnection.currentRemoteDescription && user.id === callDoc.receiverId) {
                try {
                    const offerDescription = new RTCSessionDescription(data.offer);
                    await peerConnection.setRemoteDescription(offerDescription);
                    const answerDescription = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answerDescription);
                    await updateDoc(callDocRef, { answer: { sdp: answerDescription.sdp, type: answerDescription.type } });
                } catch (error) {
                    console.error("Erreur lors de la création de la réponse :", error);
                }
            }
            
            // Logique pour l'appelant pour définir la réponse distante
            if (data.answer && !peerConnection.currentRemoteDescription && user.id === callDoc.callerId) {
                 try {
                    const answerDescription = new RTCSessionDescription(data.answer);
                    await peerConnection.setRemoteDescription(answerDescription);
                } catch (error) {
                    console.error("Erreur lors de la définition de la description distante :", error);
                }
            }
            
            // Lorsque l'appel se termine
            if (data.status === 'ended') {
                hangUpLocal();
                toast({ title: "Appel terminé" });
                router.push('/messagerie');
            }
        });
        
        // Écouter les candidats ICE
        const candidatesUnsubscribe = onSnapshot(
            callDoc.callerId === user.id ? answerCandidates : offerCandidates, 
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const candidate = new RTCIceCandidate(change.doc.data());
                        peerConnection.addIceCandidate(candidate).catch(e => console.error("Erreur d'ajout de ICE candidate", e));
                    }
                });
            }
        );
        
        return () => {
            unsubscribe();
            candidatesUnsubscribe();
            hangUpLocal();
        };
    };

    const hangUpLocal = () => {
        pc?.close();
        localStream?.getTracks().forEach(track => track.stop());
        remoteStream?.getTracks().forEach(track => track.stop());
        setPc(null);
        setLocalStream(null);
        setRemoteStream(null);
    }
    
    initPeerConnection();

    // Nettoyage
    return () => {
        hangUpLocal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, params.callId, callDoc]);
  
  const hangUp = async () => {
    pc?.close();
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());

    if (callDoc && callDoc.status !== 'ended' && firestore) {
        const callDocRef = doc(firestore, 'calls', params.callId);
        await updateDoc(callDocRef, { status: 'ended' });
    }
    router.push('/messagerie');
  };
  
  const toggleMute = () => {
      localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
  }

  const toggleVideo = () => {
      localStream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
  }
  
  if (callLoading || authLoading) {
      return <div className="w-full h-screen flex items-center justify-center bg-black"><Skeleton className="w-full h-full" /></div>
  }

  return (
    <div className="relative h-screen w-screen bg-black text-white flex items-center justify-center">
        {/* Vidéo distante */}
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

        {/* Vidéo locale */}
        <div className="absolute bottom-24 sm:bottom-8 right-4 sm:right-8 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary">
             <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        </div>

        {/* Contrôles de l'appel */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/50 rounded-full">
            <Button onClick={toggleMute} variant="secondary" size="icon" className="rounded-full h-14 w-14">
                {isMuted ? <MicOff /> : <Mic />}
            </Button>
             <Button onClick={toggleVideo} variant="secondary" size="icon" className="rounded-full h-14 w-14">
                {isVideoOff ? <VideoOff /> : <Video />}
            </Button>
            <Button onClick={hangUp} variant="destructive" size="icon" className="rounded-full h-16 w-16">
                <Phone />
            </Button>
        </div>

        {/* Superposition de statut d'appel */}
        {(!remoteStream || remoteStream.getTracks().length === 0) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                <Avatar className="h-32 w-32">
                    {/* Devrait montrer l'image de l'autre utilisateur */}
                    <AvatarImage src={''} /> 
                    <AvatarFallback className="text-4xl">
                        ?
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">
                    {callDoc?.status === 'pending' ? `Appel de ${callDoc?.callerName || 'quelqu\'un'}...` : 'Connexion en cours...'}
                </h2>
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )}
    </div>
  );
}
