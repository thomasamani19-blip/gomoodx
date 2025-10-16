
'use client';

import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import type { Settings, PlatformPlan, PlatformSubscriptionType } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const PlanCard = ({ plan, onSubscribe, isCurrentPlan }: { plan: PlatformPlan, onSubscribe: (plan: PlatformPlan) => void, isCurrentPlan: boolean }) => (
    <Card className={cn("flex flex-col", plan.isPopular ? "border-primary ring-2 ring-primary" : "")}>
        {plan.isPopular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="secondary">Populaire</Badge>}
        <CardHeader className="text-center items-center">
            <CardTitle className="font-headline text-3xl">{plan.name}</CardTitle>
             <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <div className="text-center">
                {plan.price > 0 ? (
                    <p><span className="text-4xl font-bold">{plan.price.toFixed(2)}€</span><span className="text-muted-foreground">/mois</span></p>
                ) : (
                    <p className="text-4xl font-bold">Gratuit</p>
                )}
            </div>
            <ul className="space-y-3 text-sm">
                {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-start">
                        <Check className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-green-500" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter>
            <Button className="w-full" variant={plan.isPopular ? 'default' : 'secondary'} disabled={isCurrentPlan} onClick={() => onSubscribe(plan)}>
                {isCurrentPlan ? 'Plan Actuel' : 'Choisir ce plan'}
            </Button>
        </CardFooter>
    </Card>
);


export default function AbonnementPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();

    const [subscriptionDialog, setSubscriptionDialog] = useState<{ open: boolean, plan: PlatformPlan | null }>({ open: false, plan: null });
    const [subscriptionDuration, setSubscriptionDuration] = useState(1);
    const [isSubscribing, setIsSubscribing] = useState(false);
    
    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);
    
    const loading = authLoading || settingsLoading;

    const plansData: PlatformPlan[] = useMemo(() => {
        const sortedPlans: PlatformPlan[] = [];
        if (settings?.platformPlans) {
            const planOrder: PlatformSubscriptionType[] = ['essential', 'advanced', 'premium', 'elite'];
            planOrder.forEach(id => {
                if (settings.platformPlans?.[id]) {
                    sortedPlans.push({
                        id,
                        ...settings.platformPlans[id]
                    } as PlatformPlan);
                }
            });
        }
        return [
            { id: 'gratuit', name: 'Gratuit', price: 0, description: 'Pour démarrer', features: ['Commission sur les ventes de 20%', 'Publications sur le fil d\'actualité'], isPopular: false },
            ...sortedPlans
        ];
    }, [settings]);


    const handleOpenSubscriptionDialog = (plan: PlatformPlan) => {
        if (!user) {
            toast({ title: 'Connexion requise', description: 'Vous devez vous connecter pour vous abonner.', variant: 'destructive'});
            router.push('/connexion');
            return;
        }
        if (plan.id === 'gratuit') return;
        setSubscriptionDialog({ open: true, plan });
    };

    const handleSubscription = async () => {
        if (!user || !subscriptionDialog.plan || subscriptionDialog.plan.id === 'gratuit') return;
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
            if (response.ok) {
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

    if (loading) {
        return (
            <div>
                <PageHeader title="Abonnements GoMoodX Premium" description="Chargement..." />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-[450px] w-full" />
                    <Skeleton className="h-[450px] w-full" />
                    <Skeleton className="h-[450px] w-full" />
                    <Skeleton className="h-[450px] w-full" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                title="Abonnements GoMoodX Premium"
                description="Débloquez tout le potentiel de la plateforme et maximisez vos revenus."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
                {plansData.map(plan => {
                    const isCurrent = user?.subscription?.type === plan.id || (!user?.subscription && plan.id === 'gratuit');
                    return <PlanCard key={plan.id} plan={plan} onSubscribe={handleOpenSubscriptionDialog} isCurrentPlan={isCurrent} />;
                })}
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
