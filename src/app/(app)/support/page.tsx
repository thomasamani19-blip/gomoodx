'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ticketSchema = z.object({
    subject: z.string({ required_error: 'Veuillez sélectionner un sujet.' }),
    message: z.string().min(20, 'Votre message doit contenir au moins 20 caractères.'),
    relatedId: z.string().optional(), // For order ID, user ID, etc.
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function SupportPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema),
    });

    const onSubmit = async (data: TicketFormValues) => {
        if (!user) {
            toast({ title: 'Non authentifié', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/support/create-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, userId: user.id })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            toast({
                title: 'Ticket envoyé !',
                description: 'Votre demande a été enregistrée. Notre équipe vous répondra bientôt.',
            });
            form.reset();
            // Optionally redirect to a confirmation page or the ticket list
            // router.push('/mes-tickets');
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader title="Contacter le Support" description="Ouvrez un ticket pour toute question ou problème rencontré sur la plateforme." />
            <div className="max-w-2xl mx-auto">
                <Card>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Nouveau Ticket de Support</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Sujet de votre demande</Label>
                                <Select onValueChange={(value) => form.setValue('subject', value)} defaultValue={form.getValues('subject')}>
                                    <SelectTrigger id="subject">
                                        <SelectValue placeholder="Sélectionnez une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="problem-order">Problème avec une commande/réservation</SelectItem>
                                        <SelectItem value="billing-issue">Question sur la facturation</SelectItem>
                                        <SelectItem value="technical-issue">Problème technique</SelectItem>
                                        <SelectItem value="account-issue">Problème de compte</SelectItem>
                                        <SelectItem value="other">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.subject && <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relatedId">ID de la commande/réservation (si applicable)</Label>
                                <Input id="relatedId" {...form.register('relatedId')} placeholder="Ex: aB1cDe2FgH" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="message">Votre message</Label>
                                <Textarea id="message" {...form.register('message')} rows={8} placeholder="Décrivez votre problème en détail..." />
                                {form.formState.errors.message && <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting || authLoading}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                Envoyer le Ticket
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
