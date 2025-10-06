
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
import { CreditCard, Loader2, Star } from 'lucide-react';
import { FlutterWaveButton, closePaymentModal as closeFlutterwaveModal } from 'flutterwave-react-v3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaymentMethod = 'flutterwave' | 'kkiapay';
const PREMIUM_MEMBER_PRICE = 29.99;


function RechargeTab() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('flutterwave');
  const [isLoading, setIsLoading] = useState(false);

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

    return null;
  };


  return (
    <Card className="w-full border-none shadow-none">
        <CardHeader>
            <CardTitle>Recharger des Crédits</CardTitle>
            <CardDescription>Ajoutez des fonds à votre compte pour les achats et services.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant={paymentMethod === 'flutterwave' ? 'secondary' : 'outline'} onClick={() => setPaymentMethod('flutterwave')}>
                    Flutterwave (EUR)
                </Button>
                 <Button variant={paymentMethod === 'kkiapay' ? 'secondary' : 'outline'} onClick={() => setPaymentMethod('kkiapay')} disabled>
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
                  {`${val} €`}
                </Button>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="amount">Ou entrez un montant personnalisé (EUR)</Label>
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
  )
}

function SubscriptionTab() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const fwPublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    const tx_ref = `gomoodx-sub-${Date.now()}-${user?.id}`;

    const fwConfig = {
        public_key: fwPublicKey || '',
        tx_ref: tx_ref,
        amount: PREMIUM_MEMBER_PRICE,
        currency: 'EUR',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || '',
            name: user?.displayName || 'Client GoMoodX',
        },
        customizations: {
            title: 'GoMoodX - Abonnement Premium',
            description: `Abonnement Membre Premium`,
            logo: 'https://placehold.co/100x100/EAB308/000000?text=GMX',
        },
    };

    const handleSubscriptionSuccess = async (response: any) => {
        setIsLoading(true);
        try {
            // 1. Verify payment with Flutterwave
            const verifyResponse = await fetch('/api/payments/verifyFlutterwave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: response.transaction_id,
                    tx_ref: response.tx_ref,
                    user_id: user?.id,
                    amount: PREMIUM_MEMBER_PRICE,
                    currency: 'EUR'
                }),
            });

            const verifyResult = await verifyResponse.json();
            if (!verifyResponse.ok || verifyResult.status !== 'success') {
                throw new Error(verifyResult.message || 'La vérification du paiement de l\'abonnement a échoué.');
            }

            // 2. Activate subscription via our new API
            const createSubResponse = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    amount: PREMIUM_MEMBER_PRICE,
                    tx_ref: response.tx_ref
                })
            });

            const createSubResult = await createSubResponse.json();
            if (!createSubResponse.ok || createSubResult.status !== 'success') {
                 throw new Error(createSubResult.message || 'L\'activation de l\'abonnement a échoué.');
            }
            
            toast({ 
                title: 'Félicitations, vous êtes Premium !', 
                description: 'Votre abonnement est actif et le bonus a été ajouté à votre portefeuille.' 
            });
            router.push('/portefeuille');

        } catch (error: any) {
            toast({ title: 'Erreur d\'abonnement', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
            closeFlutterwaveModal();
        }
    }

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader>
                <CardTitle>Devenez Membre Premium</CardTitle>
                <CardDescription>Débloquez des avantages exclusifs et soutenez vos créateurs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Card className="bg-primary/10 border-primary/30 p-6">
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3"><Star className="h-5 w-5 text-primary" /> Badge de membre Premium sur votre profil.</li>
                        <li className="flex items-center gap-3"><Star className="h-5 w-5 text-primary" /> Accès aux contenus exclusifs des créateurs.</li>
                        <li className="flex items-center gap-3"><Star className="h-5 w-5 text-primary" /> Recevez 20€ de crédits chaque mois.</li>
                    </ul>
                </Card>
                <div className="text-center pt-4">
                    <p className="text-4xl font-bold">{PREMIUM_MEMBER_PRICE}€ <span className="text-lg font-normal text-muted-foreground">/ mois</span></p>
                </div>
            </CardContent>
            <CardFooter>
                 <FlutterWaveButton
                    {...fwConfig}
                    className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    disabled={!fwPublicKey || !user || user?.subscription?.status === 'active' || isLoading}
                    onClick={() => setIsLoading(true)}
                    callback={handleSubscriptionSuccess}
                    onClose={() => setIsLoading(false)}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (user?.subscription?.status === 'active' ? 'Vous êtes déjà abonné' : 'Devenir Premium')}
                </FlutterWaveButton>
            </CardFooter>
        </Card>
    )
}

export default function RechargerPage() {
  return (
    <div>
      <PageHeader
        title="Boutique & Rechargement"
        description="Ajoutez des fonds à votre compte ou devenez membre premium."
      />
      <div className="flex justify-center">
        <Tabs defaultValue="recharge" className="w-full max-w-lg">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recharge"><CreditCard className="mr-2"/>Recharger</TabsTrigger>
                <TabsTrigger value="subscription"><Star className="mr-2"/>Abonnement</TabsTrigger>
            </TabsList>
            <TabsContent value="recharge">
                <RechargeTab />
            </TabsContent>
            <TabsContent value="subscription">
                <SubscriptionTab />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
