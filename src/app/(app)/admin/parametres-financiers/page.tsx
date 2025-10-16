'use client';

import { useForm } from 'react-hook-form';
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
import { Loader2, Save, DollarSign, Percent, Info } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import type { Settings } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const settingsSchema = z.object({
  platformCommissionRate: z.coerce.number().min(0).max(100, "Ne peut excéder 100%."),
  platformFee: z.coerce.number().min(0, "Doit être positif."),
  welcomeBonusAmount: z.coerce.number().min(0, "Doit être positif."),
  withdrawalMinAmount: z.coerce.number().min(0, "Doit être positif."),
  withdrawalMaxAmount: z.coerce.number().min(0, "Doit être positif.").refine(
    (value, ctx) => {
        const minAmount = ctx.path.includes('withdrawalMaxAmount') ? value > (ctx.formState.values as any).withdrawalMinAmount : true;
        if (!minAmount) {
            ctx.addIssue({
                code: 'custom',
                message: "Le max doit être supérieur au min."
            });
        }
        return minAmount;
    }
  ),
  callRates: z.object({
    voicePerMinute: z.coerce.number().min(0),
    videoToProducerPerMinute: z.coerce.number().min(0),
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminFinancialSettingsPage() {
    const { user, firebaseUser, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    
    const settingsRef = firestore ? doc(firestore, 'settings', 'global') : null;
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            platformCommissionRate: 20,
            platformFee: 20,
            welcomeBonusAmount: 5,
            withdrawalMinAmount: 50,
            withdrawalMaxAmount: 5000,
            callRates: {
                voicePerMinute: 1.5,
                videoToProducerPerMinute: 8,
            },
        },
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
        if (settings) {
            form.reset({
                platformCommissionRate: (settings.platformCommissionRate || 0.20) * 100, // Convert to percentage for display
                platformFee: settings.platformFee || 20,
                welcomeBonusAmount: settings.welcomeBonusAmount || 5,
                withdrawalMinAmount: settings.withdrawalMinAmount || 50,
                withdrawalMaxAmount: settings.withdrawalMaxAmount || 5000,
                callRates: settings.callRates || { voicePerMinute: 1.5, videoToProducerPerMinute: 8 },
            });
        }
    }, [settings, form]);
    
    const onSubmit = async (data: SettingsFormValues) => {
        if (!firebaseUser) {
            toast({ title: "Non authentifié", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        const settingsToSave = {
            ...data,
            platformCommissionRate: data.platformCommissionRate / 100, // Convert back to decimal for storage
        };

        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch('/api/admin/update-settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(settingsToSave),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            toast({
                title: "Paramètres enregistrés !",
                description: "Les paramètres financiers ont été mis à jour."
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
    
    return (
        <div>
            <PageHeader title="Paramètres Financiers" description="Gérez la configuration économique de la plateforme." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid lg:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Commissions & Frais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="platformCommissionRate">Taux de commission sur les ventes (%)</Label>
                                 <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="platformCommissionRate" type="number" className="pl-8" {...form.register('platformCommissionRate')} />
                                </div>
                                {form.formState.errors.platformCommissionRate && <p className="text-sm text-destructive">{form.formState.errors.platformCommissionRate.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="platformFee">Frais de service fixes sur les réservations (€)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="platformFee" type="number" className="pl-8" {...form.register('platformFee')} />
                                </div>
                                {form.formState.errors.platformFee && <p className="text-sm text-destructive">{form.formState.errors.platformFee.message}</p>}
                            </div>
                             <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Information</AlertTitle>
                                <AlertDescription>La commission s'applique sur les abonnements, ventes de contenu, et appels. Les frais de service s'ajoutent au coût des réservations.</AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Tarifs des Appels</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-2">
                                <Label htmlFor="voicePerMinute">Appel vocal par minute (€)</Label>
                                <Input id="voicePerMinute" type="number" step="0.1" {...form.register('callRates.voicePerMinute')} />
                                {form.formState.errors.callRates?.voicePerMinute && <p className="text-sm text-destructive">{form.formState.errors.callRates.voicePerMinute.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="videoToProducerPerMinute">Appel vidéo (Escorte vers Producteur) par minute (€)</Label>
                                <Input id="videoToProducerPerMinute" type="number" step="0.1" {...form.register('callRates.videoToProducerPerMinute')} />
                                {form.formState.errors.callRates?.videoToProducerPerMinute && <p className="text-sm text-destructive">{form.formState.errors.callRates.videoToProducerPerMinute.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Retraits Créateurs & Partenaires</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-2">
                                <Label htmlFor="withdrawalMinAmount">Montant minimum de retrait (€)</Label>
                                <Input id="withdrawalMinAmount" type="number" {...form.register('withdrawalMinAmount')} />
                                {form.formState.errors.withdrawalMinAmount && <p className="text-sm text-destructive">{form.formState.errors.withdrawalMinAmount.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="withdrawalMaxAmount">Montant maximum de retrait (€)</Label>
                                <Input id="withdrawalMaxAmount" type="number" {...form.register('withdrawalMaxAmount')} />
                                {form.formState.errors.withdrawalMaxAmount && <p className="text-sm text-destructive">{form.formState.errors.withdrawalMaxAmount.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Bonus</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-2">
                                <Label htmlFor="welcomeBonusAmount">Bonus de bienvenue pour premier dépôt (€)</Label>
                                <Input id="welcomeBonusAmount" type="number" {...form.register('welcomeBonusAmount')} />
                                {form.formState.errors.welcomeBonusAmount && <p className="text-sm text-destructive">{form.formState.errors.welcomeBonusAmount.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div className="mt-8">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    );
}

    