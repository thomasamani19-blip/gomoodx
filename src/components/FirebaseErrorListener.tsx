'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

// This component listens for 'permission-error' events and displays a toast.
// It is intended to be used within the FirebaseProvider to provide a
// centralized error handling mechanism for Firestore permission errors.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error(error); // Also log the full error to the console for debugging
      toast({
        variant: 'destructive',
        title: 'Erreur de permission',
        description: "Vous n'avez pas les droits pour effectuer cette action.",
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component doesn't render anything
}
