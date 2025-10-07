
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Save, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import type { User, CreatorRates } from '@/lib/types';


const formSchema = z.object({
  escortPerHour: z.coerce.number().min(0, "Le tarif horaire doit être positif.").optional(),
  escortOvernight: z.coerce.number().min(0, "Le tarif pour la nuit doit être positif.").optional(),
  videoCallPerMinute: z.coerce.number().min(0, "Le tarif d'appel vidéo doit être positif.").optional(),
});

type PricingFormValues = z.infer<typeof formSchema>;

interface CreatorPricingFormProps {
    user: User;
}

export function CreatorPricingForm({ user }: CreatorPricingFormProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PricingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            escortPerHour: 0,
            escortOvernight: 0,
            videoCallPerMinute: 0,
        },
    });

    useEffect(() => {
        if (user.rates) {
            form.reset(user.rates);
        }
    }, [user, form]);

    const onSubmit = async (data: PricingFormValues) => {
        if (!firestore || !user) return;
        setIsLoading(true);
        
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                rates: data
            });
            toast({
                title: "Tarifs enregistrés !",
                description: "Votre grille tarifaire a été mise à jour."
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur", description: "Impossible d'enregistrer les modifications.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <PageHeader title="Gestion des Tarifs" description="Définissez les prix pour vos différentes prestations." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Grille Tarifaire Personnelle</CardTitle>
                        <CardDescription>Configurez ici les coûts de vos services. Ces tarifs seront utilisés pour les réservations et les appels.</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="escortPerHour">Tarif d'escorte par heure (€)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="escortPerHour" type="number" className="pl-8" {...form.register('escortPerHour')} placeholder="150" />
                                </div>
                                {form.formState.errors.escortPerHour && <p className="text-sm text-destructive">{form.formState.errors.escortPerHour.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="escortOvernight">Tarif pour la nuit (€)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="escortOvernight" type="number" className="pl-8" {...form.register('escortOvernight')} placeholder="1000" />
                                </div>
                                {form.formState.errors.escortOvernight && <p className="text-sm text-destructive">{form.formState.errors.escortOvernight.message}</p>}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="videoCallPerMinute">Tarif des appels vidéo par minute (€)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="videoCallPerMinute" type="number" step="0.5" className="pl-8" {...form.register('videoCallPerMinute')} placeholder="5" />
                            </div>
                            {form.formState.errors.videoCallPerMinute && <p className="text-sm text-destructive">{form.formState.errors.videoCallPerMinute.message}</p>}
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
