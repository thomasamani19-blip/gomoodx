
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoMoodXLogo } from '@/components/GoMoodXLogo';
import Link from 'next/link';

const AGE_GATE_KEY = 'gomoodx_age_verified';

export default function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const isVerified = localStorage.getItem(AGE_GATE_KEY);
      if (isVerified !== 'true') {
        setIsOpen(true);
      }
    } catch (error) {
      // If localStorage is not available (e.g., SSR or private browsing), show the gate.
      setIsOpen(true);
    }
  }, []);

  const handleVerification = () => {
    try {
      localStorage.setItem(AGE_GATE_KEY, 'true');
    } catch (e) {
      console.warn("Could not save age verification status to localStorage.");
    }
    setIsOpen(false);
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };
  
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md text-center backdrop-blur-sm" hideCloseButton>
        <DialogHeader>
          <GoMoodXLogo className="justify-center mb-4" />
          <DialogTitle className="text-2xl font-headline">Avez-vous 18 ans ou plus ?</DialogTitle>
          <DialogDescription>
            Ce site contient du contenu pour adultes et est réservé aux personnes ayant atteint l'âge de la majorité.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 mt-4">
          <Button onClick={handleVerification} size="lg">Oui, j'ai 18 ans ou plus</Button>
          <Button onClick={handleExit} variant="outline" size="lg">Non, sortir</Button>
        </DialogFooter>
        <p className="text-xs text-muted-foreground text-center mt-4">
          En entrant, vous confirmez que vous avez l'âge légal pour visionner du contenu pour adultes dans votre juridiction et que vous acceptez nos <Link href="/cgu" className="underline">Conditions d'Utilisation</Link>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
