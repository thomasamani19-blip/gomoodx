
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
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';

export default function RechargerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState(50); // Default amount in EUR
  const [isLoading, setIsLoading] = useState(false);

  // Assumes public key is set in environment variables
  const fwPublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

  if (!fwPublicKey) {
    console.error("La clé publique Flutterwave n'est pas configurée.");
    // Optionally render an error message to the user
  }
  
  // This function is called when the payment is successful from Flutterwave's side
  const handleSuccess = async (response: any) => {
    console.log("Réponse de succès Flutterwave:", response);
    setIsLoading(true);
    
    try {
        // Now, verify the transaction on your backend
        const apiResponse = await fetch('/api/payments/verifyFlutterwave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
                user_id: user?.id,
                amount: amount, // The amount that was intended to be paid
                currency: 'EUR' // The currency
            }),
        });

        const result = await apiResponse.json();

        if (apiResponse.ok && result.status === 'success') {
            toast({
                title: 'Rechargement réussi !',
                description: `Votre portefeuille a été crédité de ${amount} €.`,
            });
            router.push('/portefeuille');
        } else {
            throw new Error(result.message || 'La vérification du paiement a échoué.');
        }

    } catch (error: any) {
        toast({
            title: 'Erreur de vérification',
            description: error.message || 'Une erreur est survenue lors de la vérification de votre paiement.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
        closePaymentModal(); // Close the modal
    }
  };

  const handleClose = () => {
    console.log('Payment modal closed');
    setIsLoading(false);
  };

  const config = {
    public_key: fwPublicKey || '',
    tx_ref: `gomoodx-${Date.now()}-${user?.id}`,
    amount: amount,
    currency: 'EUR', // Use EUR for the transaction
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      name: user?.displayName || 'Client GoMoodX',
    },
    customizations: {
      title: 'GoMoodX - Rechargement',
      description: `Rechargement de ${amount} € pour votre portefeuille.`,
      logo: 'https://placehold.co/100x100/EAB308/000000?text=GMX', // TODO: Replace with your actual logo URL
    },
  };

  return (
    <div>
      <PageHeader
        title="Recharger le Portefeuille"
        description="Ajoutez des fonds à votre compte pour profiter de tous nos services."
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Choisir un montant</CardTitle>
            <CardDescription>
              Le montant sera ajouté à votre solde après la transaction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map(val => (
                     <Button key={val} variant={amount === val ? 'default' : 'outline'} onClick={() => setAmount(val)}>
                        {val} €
                    </Button>
                ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Ou entrez un montant personnalisé (€)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="10"
                placeholder="Ex: 150"
              />
            </div>
          </CardContent>
          <CardFooter>
            <FlutterWaveButton
                {...config}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                disabled={isLoading || !fwPublicKey || !user}
                onClick={() => setIsLoading(true)}
                callback={handleSuccess}
                onClose={handleClose}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Payer {amount} €
            </FlutterWaveButton>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
