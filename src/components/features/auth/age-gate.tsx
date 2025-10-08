
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoMoodXLogo } from '@/components/GoMoodXLogo';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AGE_GATE_KEY = 'gomoodx_age_verified';

export default function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const isVerified = localStorage.getItem(AGE_GATE_KEY);
      if (isVerified !== 'true') {
        setIsOpen(true);
      }
    } catch (error) {
      setIsOpen(true);
    }
  }, []);

  const handleVerification = () => {
    setError(null);
    if (!day || !month || !year || day.length > 2 || month.length > 2 || year.length !== 4) {
      setError('Veuillez entrer une date de naissance valide.');
      return;
    }

    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(birthDate.getTime())) {
      setError('Date invalide.');
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age >= 18) {
      try {
        localStorage.setItem(AGE_GATE_KEY, 'true');
      } catch (e) {
        console.warn("Could not save age verification status to localStorage.");
      }
      setIsOpen(false);
    } else {
      setError('Vous devez avoir au moins 18 ans pour accéder à ce site.');
    }
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
          <DialogTitle className="text-2xl font-headline">Vérification de l'âge</DialogTitle>
          <DialogDescription>
            Ce site est réservé aux adultes. Veuillez entrer votre date de naissance pour continuer.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 my-4">
          <div className="grid gap-1.5 text-left">
            <Label htmlFor="day">Jour</Label>
            <Input id="day" value={day} onChange={(e) => setDay(e.target.value)} placeholder="JJ" maxLength={2} />
          </div>
          <div className="grid gap-1.5 text-left">
            <Label htmlFor="month">Mois</Label>
            <Input id="month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="MM" maxLength={2} />
          </div>
          <div className="grid gap-1.5 text-left">
            <Label htmlFor="year">Année</Label>
            <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="AAAA" maxLength={4} />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 mt-4">
          <Button onClick={handleVerification} size="lg">Entrer</Button>
          <Button onClick={handleExit} variant="outline" size="lg">Quitter</Button>
        </DialogFooter>
        <p className="text-xs text-muted-foreground text-center mt-4">
          En entrant, vous acceptez nos <Link href="/cgu" className="underline">Conditions d'Utilisation</Link> et notre <Link href="/cgu" className="underline">Politique de Confidentialité</Link>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
