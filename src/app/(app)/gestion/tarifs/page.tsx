
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Save, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { EstablishmentPricing } from '@/lib/types';


const formSchema = z.object({
  basePricePerHour: z.coerce.number().min(0, "Le prix de base doit être positif."),
  roomTypes: z.object({
    standard: z.object({
      price: z.literal(0).default(0), 
      enabled: z.literal(true).default(true),
    }),
    comfort: z.object({
      price: z.coerce.number().min(0), // Price is now a supplement
      enabled: z.boolean(),
    }),
    luxe: z.object({
      price: z.coerce.number().min(0), // Price is now a supplement
      enabled: z.boolean(),
    }),
  }),
});

type PricingFormValues = z.infer<typeof formSchema>;


export default function GestionTarifsPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PricingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            basePricePerHour: 50,
            roomTypes: {
                standard: { price: 0, enabled: true },
                comfort: { price: 25, enabled: true },
                luxe: { price: 100, enabled: false },
            }
        },
    });

    useEffect(() => {
        if (user && user.establishmentSettings?.pricing) {
            form.reset({
                ...user.establishmentSettings.pricing,
                roomTypes: {
                    ...user.establishmentSettings.pricing.roomTypes,
                    standard: { price: 0, enabled: true } // Ensure standard is fixed
                }
            });
        }
    }, [user, form]);
    
    if (authLoading) {
        return <Skeleton className="h-96 w-full" />
    }
    
    if (!user || user.role !== 'partenaire' || user.partnerType !== 'establishment') {
        router.push('/dashboard');
        return null;
    }

    const onSubmit = async (data: PricingFormValues) => {
        if (!firestore) return;
        setIsLoading(true);
        
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                'establishmentSettings.pricing': data
            });
            toast({
                title: "Tarifs enregistrés !",
                description: "Votre grille tarifaire a été mise à jour."
            })
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur", description: "Impossible d'enregistrer les modifications.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <PageHeader title="Gestion des Tarifs" description="Définissez les prix pour les réservations dans votre établissement." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Grille Tarifaire</CardTitle>
                        <CardDescription>Configurez ici les coûts associés aux différentes options de réservation.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-8">
                        <div className="space-y-2">
                            <Label htmlFor="basePricePerHour">Prix de la chambre Standard (par heure)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="basePricePerHour" type="number" className="pl-8" {...form.register('basePricePerHour')} placeholder="50" />
                            </div>
                            {form.formState.errors.basePricePerHour && <p className="text-sm text-destructive">{form.formState.errors.basePricePerHour.message}</p>}
                            <p className="text-xs text-muted-foreground">Ce prix est le tarif de base pour une chambre standard.</p>
                        </div>
                        
                        <div className="space-y-4">
                             <CardTitle>Suppléments pour chambres supérieures</CardTitle>
                             <CardDescription>Définissez le coût supplémentaire par heure pour les types de chambres supérieurs. Ce montant s'ajoute au prix de base.</CardDescription>
                            
                             {Object.entries(form.getValues().roomTypes).map(([key, value]) => {
                                if (key === 'standard') return null; // Do not show 'standard' here

                                const roomKey = key as keyof PricingFormValues['roomTypes'];
                                return (
                                    <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor={`price-${key}`} className="text-base capitalize">{key}</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id={`price-${key}`}
                                                    type="number"
                                                    className="pl-8 w-48"
                                                    placeholder="50"
                                                    {...form.register(`roomTypes.${roomKey}.price`)}
                                                    disabled={!form.watch(`roomTypes.${roomKey}.enabled`)}
                                                />
                                            </div>
                                             <p className="text-xs text-muted-foreground">Supplément par heure</p>
                                        </div>
                                         <Controller
                                            name={`roomTypes.${roomKey}.enabled`}
                                            control={form.control}
                                            render={({ field }) => (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <Label className="text-xs">Activer</Label>
                                                </div>
                                            )}
                                        />
                                    </div>
                                );
                             })}
                        </div>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer les tarifs
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
