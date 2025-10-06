
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Call } from '@/lib/types';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// Use a public STUN server
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

  const { data: callDoc, loading: callLoading } = useDoc<Call>(`calls/${params.callId}`);

  useEffect(() => {
    const initPeerConnection = async () => {
      if (!user || !firestore || !callDoc) return;

      const newPc = new RTCPeerConnection(servers);
      setPc(newPc);

      const local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(local);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = local;
      }
      
      const remote = new MediaStream();
      setRemoteStream(remote);
      if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
      }

      local.getTracks().forEach((track) => {
        newPc.addTrack(track, local);
      });

      newPc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };
      
      const callId = params.callId;
      const callRef = doc(firestore, 'calls', callId);
      const offerCandidates = collection(callRef, 'offerCandidates');
      const answerCandidates = collection(callRef, 'answerCandidates');

      newPc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidatesCollection = callDoc.callerId === user.id ? offerCandidates : answerCandidates;
          addDoc(candidatesCollection, event.candidate.toJSON());
        }
      };

      // --- Signaling Logic ---

      // Create offer if caller
      if (callDoc.callerId === user.id && callDoc.status === 'pending') {
        const offerDescription = await newPc.createOffer();
        await newPc.setLocalDescription(offerDescription);
        await updateDoc(callRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type }, status: 'ongoing' });
      }

      // Listen for remote description and answer if receiver
      onSnapshot(callRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && !newPc.currentRemoteDescription && user.id === callDoc.receiverId) {
          const offerDescription = new RTCSessionDescription(data.offer);
          newPc.setRemoteDescription(offerDescription).then(async () => {
             const answerDescription = await newPc.createAnswer();
             await newPc.setLocalDescription(answerDescription);
             await updateDoc(callRef, { answer: { sdp: answerDescription.sdp, type: answerDescription.type } });
          });
        }
        
        if (data?.answer && !newPc.currentRemoteDescription && user.id === callDoc.callerId) {
          const answerDescription = new RTCSessionDescription(data.answer);
          newPc.setRemoteDescription(answerDescription);
        }
        
        // When call ends
        if (data?.status === 'ended') {
            hangUp();
            toast({ title: "Appel terminé" });
            router.push('/messagerie');
        }
      });
      
      // Listen for ICE candidates
      const candidatesCollection = callDoc.callerId === user.id ? answerCandidates : offerCandidates;
      onSnapshot(candidatesCollection, (snapshot) => {
         snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                newPc.addIceCandidate(candidate);
            }
         });
      });
    };

    initPeerConnection();

    // Cleanup
    return () => {
        hangUp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore, params.callId, callDoc]);
  
  const hangUp = async () => {
    pc?.close();
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    setPc(null);
    setLocalStream(null);
    setRemoteStream(null);

    if (callDoc && callDoc.status !== 'ended' && firestore) {
        const callRef = doc(firestore, 'calls', params.callId);
        await updateDoc(callRef, { status: 'ended' });
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
        {/* Remote Video */}
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

        {/* Local Video */}
        <div className="absolute bottom-8 right-8 h-48 w-36 rounded-lg overflow-hidden border-2 border-primary">
             <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
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

        {/* Call Status Overlay */}
        {(!remoteStream || remoteStream.getTracks().length === 0) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                <Avatar className="h-32 w-32">
                    <AvatarImage src={callDoc?.callerId === user?.id ? undefined : callDoc?.callerName} />
                    <AvatarFallback className="text-4xl">
                        {callDoc?.callerName?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">
                    {callDoc?.status === 'pending' ? `Appel de ${callDoc.callerName}...` : 'Connexion en cours...'}
                </h2>
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        )}
    </div>
  );
}
