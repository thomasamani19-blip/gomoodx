
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
    // This effect runs only on the client side
    try {
      const isVerified = localStorage.getItem(AGE_GATE_KEY);
      if (isVerified !== 'true') {
        setIsOpen(true);
      }
    } catch (error) {
        // localStorage is not available (e.g. in private browsing mode)
        // We can't persist the choice, so we show the gate every time in this case.
        setIsOpen(true);
    }
  }, []);

  const handleVerification = () => {
    try {
        localStorage.setItem(AGE_GATE_KEY, 'true');
    } catch (error) {
        console.warn("Could not save age verification status to localStorage.");
    }
    setIsOpen(false);
  };
  
  const handleExit = () => {
      // A simple redirect for non-compliant users.
      window.location.href = 'https://www.google.com';
  }

  // Do not render anything on the server to avoid hydration mismatch
  if (typeof window === 'undefined') {
      return null;
  }
  
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md text-center" hideCloseButton>
        <DialogHeader>
          <GoMoodXLogo className="justify-center mb-4" />
          <DialogTitle className="text-2xl font-headline">Vérification de l'âge</DialogTitle>
          <DialogDescription>
            Ce site contient du contenu pour adultes et est réservé aux personnes majeures.
            <br />
            Veuillez confirmer que vous avez au moins 18 ans pour continuer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button onClick={handleVerification} size="lg">J'ai 18 ans ou plus</Button>
          <Button onClick={handleExit} variant="outline" size="lg">Quitter</Button>
        </DialogFooter>
         <p className="text-xs text-muted-foreground text-center mt-4">
            En entrant, vous acceptez nos <Link href="/cgu" className="underline">Conditions d'Utilisation</Link> et notre <Link href="/cgu" className="underline">Politique de Confidentialité</Link>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
