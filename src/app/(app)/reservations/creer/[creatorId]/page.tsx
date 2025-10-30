
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase/firestore/use-collection';
import type { User, CreatorRates, Settings, TravelArrangement } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, MapPin, Clock, Timer, Check, Info, Car } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export default function CreerReservationPage({ params }: { params: { creatorId: string } }) {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    // Fetching data
    const creatorRef = useMemo(() => firestore ? doc(firestore, 'users', params.creatorId) : null, [firestore, params.creatorId]);
    const { data: creator, loading: creatorLoading } = useDoc<User>(creatorRef);

    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);
    
    // Form state
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState('19:00');
    const [durationHours, setDurationHours] = useState(1);
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [travelArrangement, setTravelArrangement] = useState<TravelArrangement>('client_travels');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Derived values
    const loading = authLoading || creatorLoading || settingsLoading;
    const serviceFee = settings?.platformFee || 20; // Default fee if not set
    const creatorRatePerHour = creator?.rates?.escortPerHour || 0;
    const bookingCost = durationHours * creatorRatePerHour;
    const travelFee = travelArrangement === 'creator_travels' ? (creator?.rates?.travelFee || 0) : 0;
    const totalCost = bookingCost + travelFee + serviceFee;

    useEffect(() => {
        if (!loading && !user) {
            toast({ title: "Connexion requise", description: "Vous devez être connecté pour prendre un rendez-vous." });
            router.push('/connexion');
        }
        if (!loading && creator?.role !== 'escorte') {
            toast({ title: "Réservation impossible", description: "Vous ne pouvez prendre rendez-vous qu'avec une escorte.", variant: "destructive"});
            router.push('/annonces');
        }
    }, [loading, user, creator, router, toast]);

    const handleNextStep = () => {
        if (!selectedDate || !location.trim() || durationHours <= 0) {
            toast({ title: "Champs requis", description: "Veuillez remplir la date, la durée et le lieu.", variant: 'destructive'});
            return;
        }
        if(creatorRatePerHour <= 0) {
             toast({ title: "Tarif non défini", description: "Ce créateur n'a pas encore défini son tarif horaire.", variant: 'destructive'});
            return;
        }
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!user || !creator || !selectedDate) {
            toast({ title: "Erreur", description: "Données de rendez-vous manquantes.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const [hours, minutes] = selectedTime.split(':');
        const reservationDateTime = new Date(selectedDate);
        reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

        try {
            const response = await fetch('/api/reservations/create-escort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: user.id,
                    creatorId: creator.id,
                    reservationDate: reservationDateTime.toISOString(),
                    durationHours: durationHours,
                    location: location,
                    notes: notes,
                    amount: totalCost,
                    travelArrangement: travelArrangement,
                    travelFee: travelFee,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                toast({ title: "Demande envoyée", description: "Votre demande a été envoyée au créateur pour confirmation." });
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
    
    if (loading) {
        return (
            <div>
                <PageHeader title="Chargement du formulaire..." />
                <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
        )
    }

    if (!creator) {
        return <PageHeader title="Créateur non trouvé" />
    }

    return (
        <div>
            <PageHeader title={`Rendez-vous avec ${creator.displayName}`} description="Planifiez les détails de votre rencontre." />
            <div className="max-w-2xl mx-auto">
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Étape 1: Détails du rendez-vous</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                                {selectedDate ? format(selectedDate, "PPP", {locale: fr}) : <span>Choisissez une date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus disabled={{ before: new Date() }} /></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Clock className="h-4 w-4"/> Heure</Label>
                                    <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Timer className="h-4 w-4"/> Durée (en heures)</Label>
                                <Input type="number" value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} min="1" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Lieu du rendez-vous</Label>
                                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Hôtel Le Grand Paris" />
                            </div>
                             <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Car className="h-4 w-4" /> Déplacement</Label>
                                <RadioGroup value={travelArrangement} onValueChange={(v) => setTravelArrangement(v as TravelArrangement)} className="grid grid-cols-2 gap-2">
                                    <div>
                                        <RadioGroupItem value="client_travels" id="client_travels" className="peer sr-only" />
                                        <Label htmlFor="client_travels" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            Je me déplace
                                        </Label>
                                    </div>
                                     <div>
                                        <RadioGroupItem value="creator_travels" id="creator_travels" className="peer sr-only" />
                                        <Label htmlFor="creator_travels" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            L'escorte se déplace
                                        </Label>
                                    </div>
                                </RadioGroup>
                                 {(creator.rates?.travelFee || 0) > 0 && 
                                    <p className="text-xs text-muted-foreground">Des frais de déplacement de {creator.rates?.travelFee}€ s'appliquent si l'escorte se déplace.</p>
                                 }
                            </div>
                            <div className="space-y-2">
                                <Label>Notes pour le créateur (optionnel)</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Préférences, informations utiles..." />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleNextStep}>Passer à la confirmation</Button>
                        </CardFooter>
                    </Card>
                )}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                             <CardTitle>Étape 2: Confirmation et Paiement</CardTitle>
                             <CardDescription>Veuillez vérifier les informations avant de confirmer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3 rounded-lg border bg-muted/50 p-4 text-sm">
                                <li className="flex justify-between"><span>Créateur:</span><span className="font-semibold">{creator.displayName}</span></li>
                                <li className="flex justify-between"><span>Date:</span><span className="font-semibold">{selectedDate ? format(selectedDate, 'EEEE d MMM yyyy', {locale: fr}) : ''} à {selectedTime}</span></li>
                                <li className="flex justify-between"><span>Durée:</span><span className="font-semibold">{durationHours} heure(s)</span></li>
                                <li className="flex justify-between"><span>Lieu:</span><span className="font-semibold">{location}</span></li>
                                <li className="flex justify-between"><span>Déplacement:</span><span className="font-semibold">{travelArrangement === 'client_travels' ? 'Vous vous déplacez' : 'L\'escorte se déplace'}</span></li>
                            </ul>
                             <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                                <div className="flex justify-between"><span>Tarif horaire de {creator.displayName}:</span><span>{creatorRatePerHour.toFixed(2)} €</span></div>
                                <div className="flex justify-between"><span>Coût de la prestation ({durationHours}h):</span><span>{bookingCost.toFixed(2)} €</span></div>
                                {travelFee > 0 && <div className="flex justify-between"><span>Frais de déplacement:</span><span>{travelFee.toFixed(2)} €</span></div>}
                                <div className="flex justify-between"><span>Frais de service GoMoodX:</span><span>{serviceFee.toFixed(2)} €</span></div>
                                <Separator />
                                <div className="flex justify-between text-xl font-bold"><span>Total à payer:</span><span>{totalCost.toFixed(2)} €</span></div>
                             </div>
                             <Alert>
                                <Info className="h-4 w-4"/>
                                <AlertTitle>Paiement Sécurisé</AlertTitle>
                                <AlertDescription>Le montant total sera débité de votre portefeuille et conservé par GoMoodX jusqu'à la confirmation mutuelle du rendez-vous.</AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost" onClick={() => setStep(1)}>Retour</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Confirmer et Payer
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
