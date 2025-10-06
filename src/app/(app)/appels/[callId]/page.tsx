
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Call, User } from '@/lib/types';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// Utiliser des serveurs STUN publics fournis par Google
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

  // Determine the other user's ID
  const otherUserId = user && callDoc ? (callDoc.callerId === user.id ? callDoc.receiverId : callDoc.callerId) : null;
  const otherUserRef = otherUserId ? doc(firestore, `users/${otherUserId}`) : null;
  const { data: otherUser } = useDoc<User>(otherUserRef);


  useEffect(() => {
    let peerConnection: RTCPeerConnection;
    let localMediaStream: MediaStream;
    let remoteMediaStream: MediaStream;
    let unsubscribeCall: () => void;
    let unsubscribeCandidates: () => void;

    const setupPeerConnection = async () => {
        if (!user || !firestore || !callDoc) return;
        
        peerConnection = new RTCPeerConnection(servers);
        setPc(peerConnection);

        try {
            localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(localMediaStream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localMediaStream;
            }

            localMediaStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localMediaStream);
            });
        } catch (error) {
            console.error("Error getting user media:", error);
            toast({ title: "Erreur de Média", description: "Impossible d'accéder à la caméra et au micro.", variant: "destructive"});
            hangUp();
            return;
        }

        remoteMediaStream = new MediaStream();
        setRemoteStream(remoteMediaStream);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteMediaStream;
        }

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
                const candidatesCollection = callDoc.status === 'pending' ? offerCandidates : answerCandidates;
                addDoc(candidatesCollection, event.candidate.toJSON());
            }
        };

        // --- Signaling Logic ---

        // Create offer if I am the caller
        if (callDoc.callerId === user.id && callDoc.status === 'pending') {
            const offerDescription = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offerDescription);
            await updateDoc(callDocRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type }, status: 'ongoing' });
        }

        // Listen for remote description and answer if I am the receiver
        unsubscribeCall = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            // Receiver's logic to answer the offer
            if (data.offer && !peerConnection.currentRemoteDescription && user.id === callDoc.receiverId) {
                try {
                    const offerDescription = new RTCSessionDescription(data.offer);
                    await peerConnection.setRemoteDescription(offerDescription);
                    const answerDescription = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answerDescription);
                    await updateDoc(callDocRef, { answer: { sdp: answerDescription.sdp, type: answerDescription.type } });
                } catch (error) {
                    console.error("Error creating answer:", error);
                }
            }
            
            // Caller's logic to set the remote answer
            if (data.answer && peerConnection.localDescription && !peerConnection.currentRemoteDescription && user.id === callDoc.callerId) {
                 try {
                    const answerDescription = new RTCSessionDescription(data.answer);
                    await peerConnection.setRemoteDescription(answerDescription);
                } catch (error) {
                    console.error("Error setting remote description:", error);
                }
            }
            
            // When the call ends
            if (data.status === 'ended') {
                hangUpLocal();
                toast({ title: "Appel terminé" });
                router.push('/messagerie');
            }
        });
        
        // Listen for ICE candidates
        const candidatesCollection = callDoc.callerId === user.id ? answerCandidates : offerCandidates;
        unsubscribeCandidates = onSnapshot(candidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    peerConnection.addIceCandidate(candidate).catch(e => console.error("Error adding ICE candidate", e));
                }
            });
        });
    };
    
    const hangUpLocal = () => {
        pc?.close();
        setPc(null);
        localStream?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        remoteStream?.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }

    setupPeerConnection();

    // Cleanup
    return () => {
        if (unsubscribeCall) unsubscribeCall();
        if (unsubscribeCandidates) unsubscribeCandidates();
        hangUpLocal();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, params.callId, callDoc]);
  
  const hangUp = async () => {
    if (callDoc && callDoc.status !== 'ended' && firestore) {
        const callDocRef = doc(firestore, 'calls', params.callId);
        await updateDoc(callDocRef, { status: 'ended' });
    } else {
        router.push('/messagerie');
    }
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

  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;

  return (
    <div className="relative h-screen w-screen bg-black text-white flex items-center justify-center">
        {/* Remote Video */}
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

        {/* Local Video */}
        <div className="absolute bottom-24 sm:bottom-8 right-4 sm:right-8 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary">
             <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
        </div>

        {/* Call Controls */}
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

        {/* Status Overlay */}
        {!hasRemoteVideo && (
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

