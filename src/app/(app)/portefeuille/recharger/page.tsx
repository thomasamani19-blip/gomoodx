
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2 } from 'lucide-react';
import { FlutterWaveButton, closePaymentModal as closeFlutterwaveModal } from 'flutterwave-react-v3';
// import { Kkiapay, KkiapayProps, closeKkiapayModal } from 'kkiapay-react';

type PaymentMethod = 'flutterwave' | 'kkiapay';

export default function RechargerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('flutterwave');
  const [isLoading, setIsLoading] = useState(false);

  // --- Flutterwave Config ---
  const fwPublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  const fwConfig = {
    public_key: fwPublicKey || '',
    tx_ref: `gomoodx-fw-${Date.now()}-${user?.id}`,
    amount: amount,
    currency: 'EUR',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      name: user?.displayName || 'Client GoMoodX',
    },
    customizations: {
      title: 'GoMoodX - Rechargement',
      description: `Rechargement de ${amount} €`,
      logo: 'https://placehold.co/100x100/EAB308/000000?text=GMX',
    },
  };

  const handleFlutterwaveSuccess = async (response: any) => {
    setIsLoading(true);
    try {
        const apiResponse = await fetch('/api/payments/verifyFlutterwave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
                user_id: user?.id,
                amount: amount,
                currency: 'EUR'
            }),
        });

        const result = await apiResponse.json();
        if (apiResponse.ok && result.status === 'success') {
            toast({ title: 'Rechargement réussi !', description: `Votre portefeuille a été crédité de ${amount} €.` });
            router.push('/portefeuille');
        } else {
            throw new Error(result.message || 'La vérification a échoué.');
        }
    } catch (error: any) {
        toast({ title: 'Erreur de vérification', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
        closeFlutterwaveModal();
    }
  };

  // --- KkiaPay Config ---
  const kkiapayPublicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
  /*
  const kkiapayOptions: KkiapayProps = {
    amount,
    phone: user?.phone || '',
    data: "Rechargement de portefeuille GoMoodX",
    sandbox: true,
    apikey: kkiapayPublicKey || '',
    callback: handleKkiapaySuccess,
    onClose: () => setIsLoading(false),
    theme: '#EAB308',
  };

  async function handleKkiapaySuccess(response: any) {
    setIsLoading(true);
    try {
      const apiResponse = await fetch('/api/payments/verifyKkiapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: response.transactionId,
          userId: user?.id,
          amount: amount,
          currency: 'XOF', // KkiaPay operates in XOF
        }),
      });

      const result = await apiResponse.json();
      if (apiResponse.ok && result.status === 'success') {
        toast({ title: 'Rechargement réussi !', description: `Votre portefeuille a été crédité.` });
        router.push('/portefeuille');
      } else {
        throw new Error(result.message || 'La vérification KkiaPay a échoué.');
      }
    } catch (error: any) {
      toast({ title: 'Erreur de vérification', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
      closeKkiapayModal();
    }
  }
  */

  const renderPaymentButton = () => {
    if (isLoading) {
      return (
        <Button className="w-full" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Traitement en cours...
        </Button>
      );
    }

    if (paymentMethod === 'flutterwave') {
      return (
        <FlutterWaveButton
          {...fwConfig}
          className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          disabled={!fwPublicKey || !user}
          onClick={() => setIsLoading(true)}
          callback={handleFlutterwaveSuccess}
          onClose={() => setIsLoading(false)}
        >
          Payer {amount} €
        </FlutterWaveButton>
      );
    }

    if (paymentMethod === 'kkiapay') {
      return (
        <Button className="w-full" disabled>
          KkiaPay (Indisponible)
        </Button>
        /*
        <Kkiapay
          {...kkiapayOptions}
          className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          onLoading={() => setIsLoading(true)}
        />
        */
      );
    }

    return null;
  };

  return (
    <div>
      <PageHeader
        title="Recharger le Portefeuille"
        description="Ajoutez des fonds à votre compte pour profiter de tous nos services."
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Choisir une méthode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant={paymentMethod === 'flutterwave' ? 'secondary' : 'outline'} onClick={() => setPaymentMethod('flutterwave')}>
                    Flutterwave (EUR)
                </Button>
                 <Button variant={paymentMethod === 'kkiapay' ? 'secondary' : 'outline'} onClick={() => setPaymentMethod('kkiapay')}>
                    KkiaPay (XOF)
                </Button>
            </div>
            <CardTitle>Choisir un montant</CardTitle>
            <CardDescription className="mb-4">
              Le montant sera ajouté à votre solde après la transaction.
            </CardDescription>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 200].map(val => (
                <Button key={val} variant={amount === val ? 'default' : 'outline'} onClick={() => setAmount(val)}>
                  {paymentMethod === 'kkiapay' ? `${(val * 655.957).toLocaleString('fr-FR')} XOF` : `${val} €`}
                </Button>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="amount">Ou entrez un montant personnalisé ({paymentMethod === 'kkiapay' ? 'XOF' : 'EUR'})</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="10"
                placeholder="Ex: 75"
              />
            </div>
          </CardContent>
          <CardFooter>
            {renderPaymentButton()}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
