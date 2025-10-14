
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/page-header';
import { Check, Star, Loader2, X } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { Settings, PlatformPlan } from '@/lib/types';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


interface Feature {
    text: string;
    gratuit: boolean | string;
    essential: boolean | string;
    advanced: boolean | string;
    premium: boolean | string;
    elite: boolean | string;
    tooltip?: string;
}

const features: Feature[] = [
    {
        text: 'Commission sur les ventes',
        gratuit: '20%',
        essential: '18%',
        advanced: '15%',
        premium: '10%',
        elite: '5%',
        tooltip: 'Le pourcentage prélevé par la plateforme sur vos revenus (ventes de contenu, abonnements fan, etc.).'
    },
    {
        text: 'Activer les abonnements Fan',
        gratuit: false,
        essential: true,
        advanced: true,
        premium: true,
        elite: true,
        tooltip: 'Permet à vos fans de souscrire à des abonnements payants à votre profil.'
    },
    {
        text: 'Sponsorisations Offertes / mois',
        gratuit: '0',
        essential: '0',
        advanced: '2',
        premium: '5',
        elite: '10',
        tooltip: 'Mettez en avant vos annonces ou produits gratuitement chaque mois. Sponsorisation payante possible à tout moment.'
    },
    {
        text: 'Badge "Vérifié" sur le profil',
        gratuit: false,
        essential: false,
        advanced: true,
        premium: true,
        elite: true,
        tooltip: 'Un badge qui inspire confiance et augmente votre crédibilité.'
    },
    {
        text: 'Générateur de Bio IA',
        gratuit: false,
        essential: true,
        advanced: true,
        premium: true,
        elite: true,
        tooltip: 'Outil IA pour créer une biographie de profil captivante.'
    },
    {
        text: 'Générateur d\'Article IA',
        gratuit: false,
        essential: false,
        advanced: true,
        premium: true,
        elite: true,
        tooltip: 'Outil IA pour rédiger des articles de blog complets.'
    },
    {
        text: 'Studio IA Créatif',
        gratuit: false,
        essential: false,
        advanced: false,
        premium: true,
        elite: true,
        tooltip: 'Générez des images, vidéos et voix uniques grâce à l\'IA.'
    },
    {
        text: 'Statistiques avancées',
        gratuit: false,
        essential: false,
        advanced: false,
        premium: true,
        elite: true,
        tooltip: 'Analysez en détail vos revenus, visites de profil et engagement.'
    },
    {
        text: 'Support Prioritaire',
        gratuit: 'Standard',
        essential: 'Standard',
        advanced: 'Standard',
        premium: 'Email',
        elite: 'Dédié 24/7',
        tooltip: 'Obtenez de l\'aide plus rapidement avec un support adapté à votre formule.'
    },
];


const FeatureCheck = ({ value }: { value: boolean | string }) => {
    if (typeof value === 'boolean') {
        return value ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-muted-foreground" />;
    }
    return <span className="text-sm font-semibold">{value}</span>;
};

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
        const basePlans: PlatformPlan[] = [
            { id: 'gratuit', name: 'Gratuit', price: 0, description: 'Pour démarrer', features: [] },
        ];
        if (settings?.platformPlans) {
            const dynamicPlans: PlatformPlan[] = Object.entries(settings.platformPlans).map(([id, plan]) => ({
                id: id as any, ...plan
            }));
            return [...basePlans, ...dynamicPlans];
        }
        return basePlans;
    }, [settings]);


    const handleOpenSubscriptionDialog = (plan: PlatformPlan) => {
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

    if (loading) {
        return (
            <div>
                <PageHeader title="Abonnements GoMoodX Premium" description="Chargement..." />
                <Skeleton className="h-[600px] w-full" />
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div>
                <PageHeader
                    title="Abonnements GoMoodX Premium"
                    description="Débloquez tout le potentiel de la plateforme et maximisez vos revenus."
                />
                <div className="border rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">Fonctionnalités</th>
                                {plansData.map(plan => (
                                    <th key={plan.id} scope="col" className="px-3 py-3.5 text-center text-sm font-semibold">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={cn(plan.isPopular && "text-primary")}>{plan.name}</span>
                                            {plan.isPopular && <Badge variant="secondary" className="h-5">Populaire</Badge>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((feature, featureIdx) => (
                                <tr key={feature.text} className={featureIdx % 2 === 0 ? undefined : 'bg-muted/30'}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger className="cursor-help text-left">
                                                {feature.text}
                                            </TooltipTrigger>
                                            {feature.tooltip && <TooltipContent><p className="max-w-xs">{feature.tooltip}</p></TooltipContent>}
                                        </Tooltip>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center"><FeatureCheck value={feature.gratuit} /></td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center"><FeatureCheck value={feature.essential} /></td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center"><FeatureCheck value={feature.advanced} /></td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center"><FeatureCheck value={feature.premium} /></td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center"><FeatureCheck value={feature.elite} /></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                             <tr className="border-t">
                                <th scope="row" className="sr-only">Prix</th>
                                {plansData.map(plan => (
                                    <td key={plan.id} className="px-3 pt-6 text-center">
                                        {plan.price > 0 ? (
                                            <p><span className="text-3xl font-bold">{plan.price}€</span><span className="text-muted-foreground">/mois</span></p>
                                        ) : (
                                             <p className="text-3xl font-bold">0 €</p>
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr className="">
                                <th scope="row" className="sr-only">Actions</th>
                                {plansData.map(plan => {
                                    const isCurrent = user?.subscription?.type === plan.id || (!user?.subscription && plan.id === 'gratuit');
                                    return (
                                        <td key={plan.id} className="px-3 py-4 text-center">
                                            {plan.id === 'gratuit' ? (
                                                <Button className="w-full" variant="outline" disabled={isCurrent}>
                                                     {isCurrent ? 'Plan Actuel' : ''}
                                                </Button>
                                            ) : (
                                                <Button 
                                                    className="w-full"
                                                    variant={plan.isPopular ? 'default' : 'secondary'}
                                                    onClick={() => handleOpenSubscriptionDialog(plan)}
                                                    disabled={isCurrent}
                                                >
                                                    {isCurrent ? 'Plan Actuel' : 'Choisir ce Plan'}
                                                </Button>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        </tfoot>
                    </table>
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
        </TooltipProvider>
    );
}
