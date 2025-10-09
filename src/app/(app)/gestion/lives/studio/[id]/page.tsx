
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { LiveSession } from '@/lib/types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, ICameraVideoTrack } from "agora-rtc-sdk-ng";
import { Button } from '@/components/ui/button';
import { Video, Mic, MicOff, VideoOff, Play, StopCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Créez une seule instance client
const agoraClient: IAgoraRTCClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

export default function StudioPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const localPlayerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useMemo(() => firestore ? doc(firestore, 'lives', params.id) : null, [firestore, params.id]);
  const { data: session, loading: sessionLoading } = useDoc<LiveSession>(sessionRef);
  
  const loading = authLoading || sessionLoading;
  
  const handleLeave = async () => {
    setIsProcessing(true);
    localAudioTrack?.close();
    localVideoTrack?.close();
    await agoraClient.leave();

    if (sessionRef) {
        await updateDoc(sessionRef, { status: 'ended', endTime: serverTimestamp() });
    }

    setIsJoined(false);
    setIsPublished(false);
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    setIsProcessing(false);
    toast({ title: "Vous avez quitté le studio." });
    router.push('/gestion/lives');
  };

  useEffect(() => {
    // Cette fonction sera utilisée pour le nettoyage lors du démontage du composant.
    return () => {
      if (isJoined) {
        handleLeave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined]);

  const handleJoin = async () => {
    if (!user || !session) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: params.id }),
      });
      const { token, appId, uid } = await response.json();
      
      agoraClient.setClientRole('host');
      await agoraClient.join(appId, params.id, token, uid);
      
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      videoTrack.play(localPlayerRef.current!);
      
      setIsJoined(true);
      toast({ title: "Connecté au studio" });
    } catch (error) {
      console.error("Erreur de connexion Agora:", error);
      toast({ title: "Erreur de connexion", description: "Impossible de rejoindre le studio.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!isJoined || !localAudioTrack || !localVideoTrack) return;
    setIsProcessing(true);

    try {
      await agoraClient.publish([localAudioTrack, localVideoTrack]);
      setIsPublished(true);
      if (sessionRef) {
        await updateDoc(sessionRef, { status: 'live' });
      }
      toast({ title: "Vous êtes en direct !", description: "Votre session a commencé." });
    } catch (error) {
      console.error("Erreur de publication:", error);
      toast({ title: "Erreur de publication", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!isPublished || !localAudioTrack || !localVideoTrack) return;
    setIsProcessing(true);

    try {
      await agoraClient.unpublish([localAudioTrack, localVideoTrack]);
      setIsPublished(false);
      toast({ title: "Direct arrêté" });
    } catch (error) {
      console.error("Erreur d'arrêt de publication:", error);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setMuted(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };
  
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setMuted(!isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  if (loading) {
    return <Skeleton className="w-full h-96" />
  }

  if (!session || user?.id !== session.hostId) {
    return <PageHeader title="Accès non autorisé" />
  }

  return (
    <div>
        <PageHeader title={session.title} description="Votre studio de diffusion en direct." />
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <div ref={localPlayerRef} className="aspect-video bg-black rounded-lg w-full h-full border">
                  {!isJoined && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white">
                      <Video className="h-16 w-16 mb-4"/>
                      <p>Votre vidéo apparaîtra ici</p>
                    </div>
                  )}
                </div>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Contrôles du direct</CardTitle>
                        <CardDescription>Gérez votre diffusion et interagissez avec votre audience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {!isJoined ? (
                           <Button onClick={handleJoin} className="w-full" disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                                Se connecter au studio
                           </Button>
                       ) : (
                        <>
                            {!isPublished ? (
                                <Button onClick={handlePublish} className="w-full" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                                    Démarrer le Direct
                                </Button>
                            ) : (
                                <Button onClick={handleUnpublish} variant="destructive" className="w-full" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <StopCircle className="mr-2 h-4 w-4" />}
                                    Arrêter la diffusion
                                </Button>
                            )}

                             <div className="flex justify-center gap-2">
                                <Button onClick={toggleAudio} variant="outline" size="icon" disabled={!isJoined}>
                                    {isAudioMuted ? <MicOff /> : <Mic />}
                                </Button>
                                <Button onClick={toggleVideo} variant="outline" size="icon" disabled={!isJoined}>
                                    {isVideoMuted ? <VideoOff /> : <Video />}
                                </Button>
                            </div>
                             <Button onClick={handleLeave} variant="secondary" className="w-full" disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Quitter définitivement
                            </Button>
                        </>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
