
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Call } from "@/lib/types";
import { Phone, PhoneIncoming, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface IncomingCallNotificationProps {
  call: Call | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallNotification({ call, onAccept, onDecline }: IncomingCallNotificationProps) {
  const isOpen = call !== null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isRingtoneEnabled, setIsRingtoneEnabled] = useState(true);

  useEffect(() => {
    // Attempt to load settings from localStorage
    try {
      const settings = localStorage.getItem('gomoodx_settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setIsRingtoneEnabled(parsedSettings.enableRingtone !== false); // Default to true
      }
    } catch (e) {
      console.warn("Could not load settings from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isRingtoneEnabled && audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.error("Ringtone playback failed:", e));
    } else if (!isOpen && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    
    // Cleanup on component unmount
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }
  }, [isOpen, isRingtoneEnabled]);

  const handleAction = (action: () => void) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    action();
  }

  return (
    <>
      <AlertDialog open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  {/* TODO: Fetch caller's image */}
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-3xl">
                    {call?.callerName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 border-4 border-background">
                    {call?.type === 'video' ? <Video className="h-5 w-5 text-primary-foreground"/> : <Phone className="h-5 w-5 text-primary-foreground"/>}
                </div>
            </div>
            <AlertDialogTitle className="text-2xl flex items-center gap-2">
              <PhoneIncoming className="h-6 w-6 animate-pulse"/> Appel Entrant
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous recevez un appel {call?.type === 'video' ? 'vidéo' : 'vocal'} de <span className="font-bold">{call?.callerName || 'quelqu\'un'}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-4">
            <AlertDialogCancel onClick={() => handleAction(onDecline)} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground border-transparent">
              <Phone className="mr-2 h-4 w-4 transform -scale-x-100" />
              Refuser
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(onAccept)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
              {call?.type === 'video' ? <Video className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
              Accepter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Ensure the audio file is in the /public folder */}
      <audio ref={audioRef} src="/ringtone.mp3" preload="auto"></audio>
    </>
  );
}
