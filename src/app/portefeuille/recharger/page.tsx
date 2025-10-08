
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
import { CreditCard, Loader2, Sparkles, Star, Gift, Ticket, Video, Info } from 'lucide-react';
import { FlutterWaveButton, closePaymentModal as closeFlutterwaveModal } from 'flutterwave-react-v3';
import { useKkiapay, KkiapayProvider } from 'kkiapay-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PaymentMethod = 'flutterwave' | 'kkiapay';
type Currency = 'XOF' | 'EUR' | 'USD';

const CONVERSION_RATES = {
    EUR: 1,
    XOF: 655.957,
    USD: 1.07,
};

const creditPacksEUR = [
  { name: 'Essentiel', price: 20, bonus: 0, icon: Sparkles },
  { name: 'Confort', price: 50, bonus: 5, icon: Star },
  { name: 'Premium', price: 100, bonus: 15, icon: Star, isPopular: true },
  { name: 'Élite', price: 250, bonus: 50, icon: Star },
];

const uses = [
    { name: 'Abonnements Fan', icon: Star },
    { name: 'Contenu Exclusif', icon: Video },
    { name: 'Tickets de Live', icon: Ticket },
    { name: 'Cadeaux Virtuels', icon: Gift },
];

function RechargeComponent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPackPriceEUR, setSelectedPackPriceEUR] = useState(100);
  const [customAmountEUR, setCustomAmountEUR] = useState(100);
  const [isCustom, setIsCustom] = useState(false);
  const [currency, setCurrency] = useState<Currency>('EUR');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('flutterwave');
  const [isLoading, setIsLoading] = useState(false);

  const { open: openKkiapay, state } = useKkiapay({
    amount: isCustom ? customAmountEUR : selectedPackPriceEUR,
    sandbox: true,
    apikey: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || '',
    phone: user?.phone || '',
    email: user?.email || '',
    fullname: user?.displayName || 'Client GoMoodX',
    callback: async (response: any) => {
        setIsLoading(true);
        try {
            const apiResponse = await fetch('/api/payments/verifyKkiapay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId: response.transactionId,
                    userId: user?.id,
                    amount: response.amount,
                    currency: 'XOF'
                }),
            });
            const result = await apiResponse.json();
            if (apiResponse.ok && result.status === 'success') {
                toast({ title: 'Achat réussi !', description: `Votre portefeuille a été crédité.` });
                router.push('/portefeuille');
            } else {
                throw new Error(result.message || 'La vérification a échoué.');
            }
        } catch (error: any) {
            toast({ title: 'Erreur de vérification', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    },
    onClose: () => setIsLoading(false)
  });

  const finalAmountEUR = isCustom ? customAmountEUR : selectedPackPriceEUR;
  const finalAmount = Math.round(finalAmountEUR * CONVERSION_RATES[currency]);

  const fwPublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  const fwConfig = {
    public_key: fwPublicKey || '',
    tx_ref: `gomoodx-fw-${Date.now()}-${user?.id}`,
    amount: finalAmount,
    currency: currency,
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      name: user?.displayName || 'Client GoMoodX',
    },
    customizations: {
      title: 'GoMoodX - Achat de Crédits',
      description: `Ajout de ${finalAmount} ${currency} à votre portefeuille`,
      logo: 'https://placehold.co/100x100/EAB308/000000?text=GMX',
    },
    meta: {
      userId: user?.id,
      amountEUR: finalAmountEUR, // Always send the base EUR amount for bonus calculation
    }
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
            }),
        });

        const result = await apiResponse.json();
        if (apiResponse.ok && result.status === 'success') {
            toast({ title: 'Achat réussi !', description: `Votre portefeuille a été crédité.` });
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
    
    const amountToPay = (isCustom ? customAmountEUR : selectedPackPriceEUR) * CONVERSION_RATES[currency];

    if (paymentMethod === 'flutterwave') {
      return (
        <FlutterWaveButton
          {...fwConfig}
          className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          disabled={!fwPublicKey || !user || amountToPay < 1}
          onClick={() => setIsLoading(true)}
          callback={handleFlutterwaveSuccess}
          onClose={() => setIsLoading(false)}
        >
          Payer {Math.round(amountToPay).toLocaleString('fr-FR')} {currency}
        </FlutterWaveButton>
      );
    }

    if (paymentMethod === 'kkiapay') {
        return (
            <Button className="w-full" onClick={() => openKkiapay()} disabled={!user || currency !== 'XOF'}>
                Payer {Math.round(amountToPay).toLocaleString('fr-FR')} {currency}
            </Button>
        );
    }

    return null;
  };


  return (
    <div>
      <PageHeader
        title="Acheter des Crédits"
        description="Ajoutez des fonds à votre portefeuille pour profiter de toutes les expériences GoMoodX."
      />
       <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
             <Card className="w-full">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Choisir un Pack de Crédits</CardTitle>
                            <CardDescription>Sélectionnez un pack ou entrez un montant personnalisé.</CardDescription>
                        </div>
                        <div className="w-32">
                             <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Devise" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="XOF">XOF</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!user?.hasMadeFirstDeposit && (
                        <Alert className="mb-6 bg-primary/10 border-primary/30 text-primary">
                            <Star className="h-4 w-4 !text-primary" />
                            <AlertTitle>Bonus de Bienvenue !</AlertTitle>
                            <AlertDescription>
                                Recevez l'équivalent de <span className="font-bold">5€ en crédits offerts</span> sur votre tout premier rechargement !
                            </AlertDescription>
                        </Alert>
                    )}

                    <RadioGroup 
                        defaultValue="100" 
                        onValueChange={(value) => {
                            if (value === 'custom') {
                                setIsCustom(true);
                            } else {
                                setIsCustom(false);
                                setSelectedPackPriceEUR(Number(value));
                            }
                        }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                    >
                        {creditPacksEUR.map((pack) => {
                            const convertedPrice = Math.round(pack.price * CONVERSION_RATES[currency]);
                            const convertedBonus = Math.round(pack.bonus * CONVERSION_RATES[currency]);
                            return (
                                <div key={pack.name} className="relative">
                                    <RadioGroupItem value={pack.price.toString()} id={pack.name} className="peer sr-only" />
                                    <Label
                                        htmlFor={pack.name}
                                        className={cn(
                                            "flex h-full flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary",
                                            pack.isPopular && "border-primary"
                                        )}
                                    >
                                        {pack.isPopular && <Badge className="absolute -top-2" variant="secondary">Populaire</Badge>}
                                        <pack.icon className="mb-3 h-6 w-6 text-primary" />
                                        <span className="font-bold text-lg">{pack.name}</span>
                                        <span className="font-semibold text-2xl">{convertedPrice.toLocaleString('fr-FR')} {currency}</span>
                                        {pack.bonus > 0 ? (
                                            <span className="text-xs text-green-500 font-bold">+ {convertedBonus.toLocaleString('fr-FR')} {currency} offerts</span>
                                        ) : (
                                            <span className="text-xs text-transparent">_</span>
                                        )}
                                    </Label>
                                </div>
                            )
                        })}
                    </RadioGroup>

                    <RadioGroup 
                        defaultValue={isCustom ? "custom" : selectedPackPriceEUR.toString()}
                        onValueChange={(value) => {
                            if (value === 'custom') { setIsCustom(true); } else { setIsCustom(false); setSelectedPackPriceEUR(Number(value)); }
                        }}
                    >
                        <div className={cn("rounded-md border-2 p-4 mt-4", isCustom && "border-primary")}>
                            <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="custom" id="custom" />
                                <Label htmlFor="custom">Ou entrez un montant personnalisé (en EUR)</Label>
                            </div>
                            <Input
                                id="amount"
                                type="number"
                                value={isCustom ? customAmountEUR : ''}
                                onChange={(e) => setCustomAmountEUR(Number(e.target.value))}
                                onFocus={() => setIsCustom(true)}
                                min="10"
                                placeholder={`Ex: 75`}
                            />
                        </div>
                    </RadioGroup>

                    <div className="mt-8">
                        <p className="text-sm font-semibold mb-2">Méthode de paiement</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant={paymentMethod === 'flutterwave' ? 'secondary' : 'outline'} onClick={() => setPaymentMethod('flutterwave')}>
                                Flutterwave (EUR, XOF, USD)
                            </Button>
                             <Button variant={paymentMethod === 'kkiapay' ? 'secondary' : 'outline'} onClick={() => setPaymentMethod('kkiapay')} disabled={currency !== 'XOF'}>
                                KkiaPay (XOF)
                            </Button>
                        </div>
                         {paymentMethod === 'kkiapay' && currency !== 'XOF' && <p className="text-xs text-destructive mt-2">KkiaPay n'accepte que les paiements en XOF.</p>}
                    </div>

                </CardContent>
                <CardFooter>
                    {renderPaymentButton()}
                </CardFooter>
            </Card>
         </div>
         <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>À quoi servent les crédits ?</CardTitle>
                    <CardDescription>Votre portefeuille est la clé pour débloquer toutes les expériences GoMoodX.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {uses.map(use => (
                        <div key={use.name} className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <use.icon className="h-5 w-5 text-primary" />
                            </div>
                            <p className="font-medium">{use.name}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}


export default function AcheterCreditsPage() {
    return (
        <KkiapayProvider>
            <RechargeComponent />
        </KkiapayProvider>
    )
}
