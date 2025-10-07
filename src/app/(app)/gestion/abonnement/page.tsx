
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Save, Star, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { SubscriptionTier } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const tierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis."),
  price: z.coerce.number().min(0, "Le prix doit être positif."),
  description: z.string().min(1, "La description est requise."),
  isActive: z.boolean(),
});

const formSchema = z.object({
  subscriptionEnabled: z.boolean(),
  tiers: z.array(tierSchema).max(3, "Vous ne pouvez avoir que 3 niveaux."),
});

type SubscriptionFormValues = z.infer<typeof formSchema>;


export default function GestionAbonnementPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<SubscriptionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subscriptionEnabled: false,
            tiers: []
        },
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "tiers",
    });

    const subscriptionEnabled = form.watch('subscriptionEnabled');

    useEffect(() => {
        if (user) {
            form.reset({
                subscriptionEnabled: user.subscriptionSettings?.enabled || false,
                tiers: Object.values(user.subscriptionSettings?.tiers || {})
            })
        }
    }, [user, form]);
    
    if (authLoading) {
        return <Skeleton className="h-96 w-full" />
    }
    
    if (!user || user.role !== 'escorte') {
        router.push('/dashboard');
        return null;
    }

    const onSubmit = async (data: SubscriptionFormValues) => {
        if (!firestore) return;
        setIsLoading(true);

        // Convert array of tiers back to an object map
        const tiersMap: { [key: string]: SubscriptionTier } = data.tiers.reduce((acc, tier) => {
            acc[tier.id] = tier;
            return acc;
        }, {} as { [key: string]: SubscriptionTier });
        
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                'subscriptionSettings.enabled': data.subscriptionEnabled,
                'subscriptionSettings.tiers': tiersMap
            });
            toast({
                title: "Paramètres enregistrés !",
                description: "Vos paramètres d'abonnement ont été mis à jour."
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
            <PageHeader title="Gestion des Abonnements" description="Définissez les formules d'abonnement pour vos fans." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Programme d'Abonnement</CardTitle>
                                <CardDescription>Activez cette option pour permettre aux utilisateurs de s'abonner à votre profil.</CardDescription>
                            </div>
                             <Controller
                                name="subscriptionEnabled"
                                control={form.control}
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </CardHeader>
                    
                    {subscriptionEnabled && (
                        <CardContent className="border-t pt-6">
                            <CardTitle>Niveaux d'abonnement</CardTitle>
                            <CardDescription className="mb-4">Créez jusqu'à 3 niveaux d'abonnement.</CardDescription>
                            
                            <Accordion type="multiple" defaultValue={fields.map(f => f.id)} className="w-full">
                                {fields.map((field, index) => (
                                    <AccordionItem key={field.id} value={field.id}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2">
                                                <Star className="h-5 w-5 text-primary" />
                                                <span>{form.watch(`tiers.${index}.name`) || `Niveau ${index + 1}`}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-4 p-2">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Nom du niveau</Label>
                                                        <Input {...form.register(`tiers.${index}.name`)} placeholder="Ex: Bronze, Argent, Or" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Prix par mois (€)</Label>
                                                        <Input type="number" {...form.register(`tiers.${index}.price`)} placeholder="Ex: 9.99" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Avantages (description)</Label>
                                                    <Textarea {...form.register(`tiers.${index}.description`)} placeholder="Ex: Accès au contenu exclusif, messages prioritaires..." />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <Controller
                                                        name={`tiers.${index}.isActive`}
                                                        control={form.control}
                                                        render={({ field }) => (
                                                            <div className="flex items-center gap-2">
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} id={`active-${field.name}`}/>
                                                                <Label htmlFor={`active-${field.name}`}>Actif</Label>
                                                            </div>
                                                        )}
                                                    />
                                                     <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer ce niveau
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                            
                            {fields.length < 3 && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="mt-4" 
                                    onClick={() => append({id: `tier${fields.length+1}`, name: `Niveau ${fields.length + 1}`, price: 0, description: '', isActive: true })}>
                                    Ajouter un niveau
                                </Button>
                            )}

                        </CardContent>
                    )}
                    
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer les modifications
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
