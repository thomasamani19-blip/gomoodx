'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Settings } from '@/lib/types';


const settingsSchema = z.object({
  firstContentBonus: z.coerce.number().min(0, "Doit être positif."),
  firstSaleBonus: z.coerce.number().min(0, "Doit être positif."),
  profileCompletionBonus: z.coerce.number().min(0, "Doit être positif."),
  referralBonus: z.coerce.number().min(0, "Doit être positif."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    
    const settingsRef = doc(firestore, 'settings', 'global');
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            firstContentBonus: 0,
            firstSaleBonus: 0,
            profileCompletionBonus: 0,
            referralBonus: 0,
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
        if (settings?.rewards) {
            form.reset(settings.rewards);
        }
    }, [settings, form]);
    
    const onSubmit = async (data: SettingsFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/update-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewards: data }),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            toast({
                title: "Paramètres enregistrés !",
                description: "Les montants des récompenses ont été mis à jour."
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
            <PageHeader title="Paramètres Administrateur" description="Configurez les valeurs globales de la plateforme." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Récompenses (en points)</CardTitle>
                        <CardDescription>Définissez le nombre de points attribués pour chaque action clé des utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="firstContentBonus">Bonus première publication</Label>
                            <Input id="firstContentBonus" type="number" {...form.register('firstContentBonus')} />
                            {form.formState.errors.firstContentBonus && <p className="text-sm text-destructive">{form.formState.errors.firstContentBonus.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="firstSaleBonus">Bonus première vente</Label>
                            <Input id="firstSaleBonus" type="number" {...form.register('firstSaleBonus')} />
                            {form.formState.errors.firstSaleBonus && <p className="text-sm text-destructive">{form.formState.errors.firstSaleBonus.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="profileCompletionBonus">Bonus profil complet & vérifié</Label>
                            <Input id="profileCompletionBonus" type="number" {...form.register('profileCompletionBonus')} />
                            {form.formState.errors.profileCompletionBonus && <p className="text-sm text-destructive">{form.formState.errors.profileCompletionBonus.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="referralBonus">Bonus de parrainage</Label>
                            <Input id="referralBonus" type="number" {...form.register('referralBonus')} />
                            {form.formState.errors.referralBonus && <p className="text-sm text-destructive">{form.formState.errors.referralBonus.message}</p>}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer les récompenses
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}