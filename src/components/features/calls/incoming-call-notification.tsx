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
import { Phone, Video } from "lucide-react";

interface IncomingCallNotificationProps {
  call: Call | null;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallNotification({ call, onAccept, onDecline }: IncomingCallNotificationProps) {
  const isOpen = call !== null;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <Avatar className="h-24 w-24 mb-4">
            {/* TODO: Fetch caller's image */}
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-3xl">
              {call?.callerName?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <AlertDialogTitle className="text-2xl">Appel Entrant</AlertDialogTitle>
          <AlertDialogDescription>
            Vous recevez un appel de <span className="font-bold">{call?.callerName || 'quelqu\'un'}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-4">
          <AlertDialogCancel onClick={onDecline} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground">
            <Phone className="mr-2 h-4 w-4 transform -scale-x-100" />
            Refuser
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept} className="w-full sm:w-auto">
            <Video className="mr-2 h-4 w-4" />
            Accepter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
