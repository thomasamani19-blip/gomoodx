
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import type { Annonce, User } from '@/lib/types';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, Users, Calendar as CalendarIcon, Check, Clock, Timer } from 'lucide-react';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export default function ReserverAnnoncePage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState('19:00');
    const [durationHours, setDurationHours] = useState(2);
    const [selectedEscorts, setSelectedEscorts] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const annonceRef = useMemo(() => firestore ? doc(firestore, 'services', params.id) : null, [firestore, params.id]);
    const { data: annonce, loading: annonceLoading } = useDoc<Annonce>(annonceRef);

    const escortsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'escorte'), orderBy('displayName')) : null, [firestore]);
    const { data: allEscorts, loading: escortsLoading } = useCollection<User>(escortsQuery);
    
    const loading = authLoading || annonceLoading || escortsLoading;

    const filteredEscorts = useMemo(() => {
        if (!allEscorts) return [];
        return allEscorts.filter(escort =>
            escort.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allEscorts, searchTerm]);

    const handleToggleEscort = (escort: User) => {
        setSelectedEscorts(prev => {
            const isSelected = prev.some(e => e.id === escort.id);
            if (isSelected) {
                return prev.filter(e => e.id !== escort.id);
            } else {
                if (prev.length >= 6) {
                    toast({ title: "Limite atteinte", description: "Vous ne pouvez sélectionner que 6 accompagnateurs maximum.", variant: "destructive" });
                    return prev;
                }
                return [...prev, escort];
            }
        });
    };

    const handleSubmit = async () => {
        if (!user || !annonce || !selectedDate) {
            toast({ title: "Erreur", description: "Données manquantes.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const [hours, minutes] = selectedTime.split(':');
        const reservationDateTime = new Date(selectedDate);
        reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

        try {
            const response = await fetch('/api/reservations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: user.id,
                    annonceId: annonce.id,
                    reservationDate: reservationDateTime.toISOString(),
                    durationHours: durationHours,
                    escorts: selectedEscorts.map(e => ({ id: e.id, name: e.displayName, profileImage: e.profileImage })),
                }),
            });

            const result = await response.json();
            if (response.ok) {
                toast({ title: "Réservation demandée", description: "Votre demande a été envoyée à l'établissement pour confirmation." });
                router.push(`/reservations/${result.reservationId}`);
            } else {
                throw new Error(result.message || "Une erreur est survenue.");
            }
        } catch (error: any) {
            toast({ title: "Erreur de réservation", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <div><Skeleton className="w-full h-96"/></div>
    if (!user) { router.push('/connexion'); return null; }
    if (!annonce) return <PageHeader title="Annonce introuvable"/>

    const totalPrice = annonce.price * (selectedEscorts.length + 1);

    return (
        <div>
            <PageHeader title={annonce.title} description={`Réservation à l'établissement`} />
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className={cn("md:col-span-2 space-y-6", step !== 1 && 'hidden md:block')}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5"/> Étape 1: Choisissez la date et la durée</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row gap-8">
                            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={fr} disabled={{ before: new Date() }} />
                             <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <Label htmlFor="time" className="flex items-center gap-2"><Clock className="h-4 w-4"/> Heure d'arrivée</Label>
                                    <Input id="time" type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="duration" className="flex items-center gap-2"><Timer className="h-4 w-4"/> Durée du séjour (en heures)</Label>
                                    <Input id="duration" type="number" value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} min="1" />
                                </div>
                             </div>
                        </CardContent>
                         <CardFooter className="md:hidden">
                            <Button className="w-full" onClick={() => setStep(2)}>Suivant <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className={cn("md:col-span-2 space-y-6", step !== 2 && 'hidden md:block')}>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Étape 2: Choisissez vos accompagnateurs (Optionnel)</CardTitle>
                            <CardDescription>Sélectionnez jusqu'à 6 escortes pour vous accompagner. Le prix sera ajusté en conséquence.</CardDescription>
                            <Input placeholder="Rechercher une escorte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-72">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {filteredEscorts.map(escort => (
                                    <div key={escort.id} className="relative">
                                        <RadioGroupItem
                                            value={escort.id}
                                            id={`escort-${escort.id}`}
                                            className="peer sr-only"
                                            checked={selectedEscorts.some(e => e.id === escort.id)}
                                            onClick={() => handleToggleEscort(escort)}
                                        />
                                        <Label htmlFor={`escort-${escort.id}`} className={cn(
                                            "block rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                            "peer-aria-checked:border-primary"
                                        )}>
                                            <div className="relative aspect-square">
                                                <Image src={escort.profileImage || `https://picsum.photos/seed/${escort.id}/200`} alt={escort.displayName} fill className="object-cover" />
                                            </div>
                                            <p className="p-2 text-center text-sm font-medium bg-muted truncate">{escort.displayName}</p>
                                        </Label>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                         <CardFooter className="flex md:hidden justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4"/> Précédent</Button>
                            <Button onClick={() => setStep(3)}>Suivant <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        </CardFooter>
                    </Card>
                </div>
                 <div className={cn("md:col-span-1 space-y-6", step < 3 && 'hidden md:block')}>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Check className="h-5 w-5"/> Étape 3: Confirmation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Date et Heure</h4>
                                <p className="text-muted-foreground">{selectedDate ? `Le ${format(selectedDate, 'PPP', {locale: fr})} à ${selectedTime} pour ${durationHours}h` : 'Non défini'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Personnes</h4>
                                <p className="text-muted-foreground">{selectedEscorts.length + 1} ({user?.displayName}, {selectedEscorts.map(e => e.displayName).join(', ')})</p>
                            </div>
                             <div className="border-t pt-4">
                                <h4 className="font-semibold">Coût total</h4>
                                <p className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} €</p>
                                <p className="text-xs text-muted-foreground">{annonce.price}€ x {selectedEscorts.length + 1} personne(s)</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                             <Button size="lg" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Confirmer et Payer
                            </Button>
                            <Button variant="outline" className="w-full md:hidden" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4"/>Précédent</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
