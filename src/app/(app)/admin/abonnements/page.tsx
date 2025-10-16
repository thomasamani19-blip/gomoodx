
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Save, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import type { Settings, PlatformSubscriptionType } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const planSchema = z.object({
    name: z.string().min(1, "Le nom est requis."),
    price: z.coerce.number().min(0, "Le prix doit être positif."),
    description: z.string().min(1, "La description est requise."),
    features: z.string().min(1, "Listez au moins une fonctionnalité."),
    isPopular: z.boolean().default(false),
});

const settingsSchema = z.object({
  platformPlans: z.object({
    essential: planSchema,
    advanced: planSchema,
    premium: planSchema,
    elite: planSchema,
  })
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminAbonnementsPage() {
    const { user, firebaseUser, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const settingsRef = firestore ? doc(firestore, 'settings', 'global') : null;
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);

    const defaultPlans = {
        essential: { name: 'Essentiel', price: 9.99, description: 'Pour bien démarrer.', features: 'Commission de 18%\nActiver les abonnements Fan\nGénérateur de Bio IA', isPopular: false },
        advanced: { name: 'Avancé', price: 24.99, description: 'Pour les créateurs ambitieux.', features: 'Commission de 15%\n2 Sponsorisations Offertes / mois\nBadge "Vérifié"\nGénérateur d\'Article IA', isPopular: true },
        premium: { name: 'Premium', price: 49.99, description: 'Accès à tous les outils.', features: 'Commission de 10%\n5 Sponsorisations Offertes / mois\nStudio IA Créatif\nStatistiques avancées\nSupport prioritaire', isPopular: false },
        elite: { name: 'Élite', price: 99.99, description: 'Pour les professionnels.', features: 'Commission de 5%\n10 Sponsorisations Offertes / mois\nTout du plan Premium\nSupport dédié 24/7', isPopular: false },
    };

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: { platformPlans: defaultPlans },
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user || !['founder', 'administrateur'].includes(user.role)) {
                toast({ title: 'Accès non autorisé', variant: 'destructive' });
                router.push('/dashboard');
            }
        }
    }, [user, authLoading, router, toast]);

    useEffect(() => {
        if (settings?.platformPlans) {
            const transformedPlans: any = {};
            for (const key in settings.platformPlans) {
                const planKey = key as PlatformSubscriptionType;
                if(planKey !== 'gratuit') {
                    transformedPlans[planKey] = {
                        ...settings.platformPlans[planKey],
                        features: settings.platformPlans[planKey]?.features?.join('\n') || ''
                    };
                }
            }
            form.reset({ platformPlans: { ...defaultPlans, ...transformedPlans } });
        }
    }, [settings, form]);
    
    const onSubmit = async (data: SettingsFormValues) => {
        if (!firebaseUser) {
            toast({ title: "Non authentifié", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const transformedData = { ...data };
        for (const key in transformedData.platformPlans) {
            const planKey = key as keyof typeof transformedData.platformPlans;
            (transformedData.platformPlans[planKey] as any).features = (transformedData.platformPlans[planKey].features as unknown as string)
                .split('\n')
                .map(f => f.trim())
                .filter(f => f);
        }

        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/admin/update-subscription-settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(transformedData),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            toast({
                title: "Paramètres enregistrés !",
                description: "Les plans d'abonnement ont été mis à jour."
            });
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || settingsLoading) {
        return <Skeleton className="h-96 w-full" />;
    }
    
    const planIds = Object.keys(form.getValues().platformPlans) as (keyof SettingsFormValues['platformPlans'])[];

    return (
        <div>
            <PageHeader title="Gestion des Abonnements" description="Configurez les plans d'abonnement premium de la plateforme." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid md:grid-cols-2 gap-6">
                    {planIds.map((planId) => (
                        <Card key={planId}>
                            <CardHeader>
                                <CardTitle className="capitalize">{form.watch(`platformPlans.${planId}.name`)}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom du plan</Label>
                                    <Input {...form.register(`platformPlans.${planId}.name`)} />
                                    {form.formState.errors.platformPlans?.[planId]?.name && <p className="text-sm text-destructive">{form.formState.errors.platformPlans[planId]?.name?.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Prix par mois (€)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="number" step="0.01" className="pl-8" {...form.register(`platformPlans.${planId}.price`)} />
                                    </div>
                                    {form.formState.errors.platformPlans?.[planId]?.price && <p className="text-sm text-destructive">{form.formState.errors.platformPlans[planId]?.price?.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Description Courte</Label>
                                    <Input {...form.register(`platformPlans.${planId}.description`)} />
                                     {form.formState.errors.platformPlans?.[planId]?.description && <p className="text-sm text-destructive">{form.formState.errors.platformPlans[planId]?.description?.message}</p>}
                                </div>
                                 <div className="space-y-2">
                                    <Label>Fonctionnalités (une par ligne)</Label>
                                    <Textarea {...form.register(`platformPlans.${planId}.features`)} rows={4} />
                                     {form.formState.errors.platformPlans?.[planId]?.features && <p className="text-sm text-destructive">{form.formState.errors.platformPlans[planId]?.features?.message}</p>}
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Controller
                                      control={form.control}
                                      name={`platformPlans.${planId}.isPopular`}
                                      render={({ field }) => (
                                        <Switch
                                            id={`popular-${planId}`}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                      )}
                                    />
                                    <Label htmlFor={`popular-${planId}`}>Marquer comme "Populaire"</Label>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <div className="mt-6">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    );
}
