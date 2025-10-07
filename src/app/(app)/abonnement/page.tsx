
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/page-header';
import { Check, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { UserSubscription } from '@/lib/types';


interface Plan {
    id: 'essential' | 'advanced' | 'premium' | 'elite';
    name: string;
    price: number;
    description: string;
    features: string[];
    isPopular?: boolean;
}

const plans: Plan[] = [
    {
        id: 'essential',
        name: 'Essentiel',
        price: 9.99,
        description: 'Pour bien démarrer sur la plateforme.',
        features: [
            'Activer les abonnements pour vos fans',
            'Commission de 20% sur les ventes',
            'Support par e-mail'
        ],
    },
    {
        id: 'advanced',
        name: 'Avancé',
        price: 24.99,
        description: 'Optimisez vos revenus et votre visibilité.',
        features: [
            'Tous les avantages Essentiel',
            'Commission réduite à 15%',
            'Badge "Vérifié" sur le profil',
            '2 mises en avant (Sponsor) par mois'
        ],
        isPopular: true,
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 49.99,
        description: 'Passez à la vitesse supérieure avec les outils IA.',
        features: [
            'Tous les avantages Avancé',
            'Commission réduite à 10%',
            'Accès complet aux outils IA',
            'Statistiques avancées'
        ],
    },
     {
        id: 'elite',
        name: 'Élite',
        price: 99.99,
        description: 'La solution ultime pour les professionnels.',
        features: [
            'Tous les avantages Premium',
            'Commission réduite à 5%',
            'Support prioritaire 24/7',
            'Gestionnaire de compte dédié'
        ],
    }
];

const PlanCard = ({ plan, onSubscribe, currentPlan }: { plan: Plan, onSubscribe: (plan: Plan) => void, currentPlan?: UserSubscription }) => {
    const isCurrent = currentPlan?.type === plan.id;
    return (
        <Card className={cn("flex flex-col", plan.isPopular && "border-primary ring-2 ring-primary", isCurrent && "bg-primary/10")}>
            {plan.isPopular && <div className="text-center py-1 bg-primary text-primary-foreground text-sm font-bold rounded-t-lg">LE PLUS POPULAIRE</div>}
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <p className="text-center">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-lg font-normal text-muted-foreground">/mois</span>
                </p>
                <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" size="lg" variant={plan.isPopular ? "default" : "secondary"} onClick={() => onSubscribe(plan)} disabled={isCurrent}>
                    {isCurrent ? 'Plan Actuel' : 'Choisir ce Plan'}
                 </Button>
            </CardFooter>
        </Card>
    )
};


export default function AbonnementPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [subscriptionDialog, setSubscriptionDialog] = useState<{ open: boolean, plan: Plan | null }>({ open: false, plan: null });
    const [subscriptionDuration, setSubscriptionDuration] = useState(1);
    const [isSubscribing, setIsSubscribing] = useState(false);

    const handleOpenSubscriptionDialog = (plan: Plan) => {
        if (!user) {
            toast({ title: 'Connexion requise', description: 'Vous devez vous connecter pour vous abonner.', variant: 'destructive'});
            router.push('/connexion');
            return;
        }
        setSubscriptionDialog({ open: true, plan });
    };

    const handleSubscription = async () => {
        if (!user || !subscriptionDialog.plan) return;
        setIsSubscribing(true);

        try {
            const response = await fetch('/api/subscriptions/create-platform-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    planId: subscriptionDialog.plan.id,
                    durationMonths: subscriptionDuration,
                }),
            });
            const result = await response.json();
            if (result.status === 'success') {
                toast({ title: 'Abonnement réussi !', description: `Vous êtes maintenant abonné au plan ${subscriptionDialog.plan.name}.` });
                router.refresh();
            } else {
                throw new Error(result.message || "Une erreur est survenue.");
            }
        } catch (error: any) {
            toast({ title: "Erreur d'abonnement", description: error.message, variant: "destructive" });
        } finally {
            setIsSubscribing(false);
            setSubscriptionDialog({ open: false, plan: null });
        }
    };

    const calculateTotalPrice = () => {
        if (!subscriptionDialog.plan) return 0;
        const plan = subscriptionDialog.plan;
        let totalPrice = plan.price * subscriptionDuration;
        let discount = 0;
        
        if (subscriptionDuration === 3) discount = 10;
        else if (subscriptionDuration === 6) discount = 15;
        else if (subscriptionDuration === 12) discount = 20;
        
        if (discount > 0) {
            totalPrice = totalPrice * (1 - discount / 100);
        }
        
        return totalPrice.toFixed(2);
    };

    return (
        <div>
            <PageHeader
                title="Abonnements GoMoodX Premium"
                description="Débloquez tout le potentiel de la plateforme et maximisez vos revenus."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {plans.map(plan => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        onSubscribe={handleOpenSubscriptionDialog} 
                        currentPlan={user?.subscription}
                    />
                ))}
            </div>

            <AlertDialog open={subscriptionDialog.open} onOpenChange={(open) => setSubscriptionDialog({ ...subscriptionDialog, open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Souscrire à "{subscriptionDialog.plan?.name}"</AlertDialogTitle>
                        <AlertDialogDescription>Choisissez votre durée d'engagement. Le montant sera débité de votre portefeuille.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <RadioGroup defaultValue="1" onValueChange={(value) => setSubscriptionDuration(Number(value))}>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { duration: 1, label: "1 Mois" },
                                    { duration: 3, label: "3 Mois (-10%)" },
                                    { duration: 6, label: "6 Mois (-15%)" },
                                    { duration: 12, label: "1 An (-20%)" }
                                ].map(d => (
                                    <div key={d.duration}>
                                        <RadioGroupItem value={d.duration.toString()} id={`d-${d.duration}`} className="peer sr-only" />
                                        <Label
                                            htmlFor={`d-${d.duration}`}
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <span className="font-bold">{d.label}</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                        <div className="text-center font-bold text-2xl">
                            Total : {calculateTotalPrice()}€
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubscribing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubscription} disabled={isSubscribing}>
                            {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmer l'Abonnement
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
