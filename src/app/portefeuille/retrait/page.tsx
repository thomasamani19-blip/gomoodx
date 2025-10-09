'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, Loader2, Info } from 'lucide-react';
import { useDoc, useFirestore } from '@/firebase';
import type { Wallet, Settings } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

export default function RetraitPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const walletRef = useMemo(() => user ? doc(firestore, 'wallets', user.id) : null, [user, firestore]);
  const { data: wallet, loading: walletLoading } = useDoc<Wallet>(walletRef);
  
  const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);


  const isEligibleForWithdrawal = user?.role === 'escorte' || user?.role === 'partenaire';

  if (!isEligibleForWithdrawal && user) {
    router.push('/portefeuille');
    toast({ title: 'Accès non autorisé', description: "La fonction de retrait est réservée aux créateurs et partenaires.", variant: 'destructive'});
    return null;
  }
  
  const handleRequestWithdrawal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !wallet) return;

    const minAmount = settings?.withdrawalMinAmount || 50;
    const maxAmount = settings?.withdrawalMaxAmount || 5000;

    if (amount <= 0) {
        toast({ title: "Montant invalide", description: "Veuillez entrer un montant supérieur à zéro.", variant: "destructive" });
        return;
    }
     if (amount < minAmount) {
        toast({ title: "Montant invalide", description: `Le montant minimum de retrait est de ${minAmount}€`, variant: "destructive" });
        return;
    }
     if (amount > maxAmount) {
        toast({ title: "Montant invalide", description: `Le montant maximum de retrait est de ${maxAmount}€`, variant: "destructive" });
        return;
    }
    if (amount > wallet.balance) {
        toast({ title: "Solde insuffisant", description: `Vous ne pouvez pas retirer plus que votre solde de ${wallet.balance.toFixed(2)}€`, variant: "destructive" });
        return;
    }

    setIsLoading(true);
    try {
        const response = await fetch('/api/payments/request-withdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, amount }),
        });

        const result = await response.json();
        if (response.ok && result.status === 'success') {
            toast({ title: 'Demande de retrait envoyée', description: "Votre demande sera traitée dans les plus brefs délais." });
            router.push('/portefeuille');
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }

    } catch (error: any) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (walletLoading || settingsLoading) {
      return (
           <div>
                <PageHeader title="Effectuer un Retrait" description="Transférez les fonds de votre portefeuille GoMoodX." />
                <Card className="max-w-xl mx-auto">
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
                </Card>
            </div>
      )
  }

  const min = settings?.withdrawalMinAmount || 50;
  const max = settings?.withdrawalMaxAmount || 5000;

  return (
    <div>
      <PageHeader
        title="Effectuer un Retrait"
        description="Transférez les fonds de votre portefeuille GoMoodX."
      />
      <Card className="max-w-xl mx-auto">
        <form onSubmit={handleRequestWithdrawal}>
            <CardHeader>
                <CardTitle>Demande de Retrait</CardTitle>
                <CardDescription>Indiquez le montant que vous souhaitez retirer de votre portefeuille.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Solde disponible</p>
                    <p className="text-4xl font-bold">{wallet?.balance.toFixed(2) || '0.00'} €</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Montant à retirer (€)</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder={`Entre ${min} et ${max}`}
                        min={min}
                        max={max}
                    />
                    <p className="text-xs text-muted-foreground">Minimum : {min}€, Maximum : {max}€.</p>
                </div>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information de Paiement</AlertTitle>
                    <AlertDescription>
                        Les fonds seront envoyés sur le dernier moyen de paiement que vous avez utilisé pour un dépôt (Flutterwave, KkiaPay, etc.). Les délais de traitement peuvent varier.
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                    Demander le retrait
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
