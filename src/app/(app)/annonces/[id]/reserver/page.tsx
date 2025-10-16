
'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import type { Annonce, User, EstablishmentPricing } from '@/lib/types';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, Users, Calendar as CalendarIcon, Check, Clock, Timer, BedDouble, UserPlus, XCircle } from 'lucide-react';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

type RoomType = keyof EstablishmentPricing['roomTypes'];

function ReserverAnnonceContent({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState('19:00');
    const [durationHours, setDurationHours] = useState(2);
    const [selectedEscortIds, setSelectedEscortIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [selectedRoomType, setSelectedRoomType] = useState<RoomType>('standard');
    const [totalPrice, setTotalPrice] = useState(0);

    const annonceRef = useMemo(() => firestore ? doc(firestore, 'services', params.id) : null, [firestore, params.id]);
    const { data: annonce, loading: annonceLoading } = useDoc<Annonce>(annonceRef);

    const establishmentRef = useMemo(() => (annonce && firestore) ? doc(firestore, 'users', annonce.createdBy) : null, [annonce, firestore]);
    const { data: establishment, loading: establishmentLoading } = useDoc<User>(establishmentRef);

    const selectedEscortsQuery = useMemo(() => {
        if (!firestore || selectedEscortIds.length === 0) return null;
        return query(collection(firestore, 'users'), where('__name__', 'in', selectedEscortIds));
    }, [firestore, selectedEscortIds]);
    const { data: selectedEscorts, loading: selectedEscortsLoading } = useCollection<User>(selectedEscortsQuery);
    
    const loading = authLoading || annonceLoading || establishmentLoading || selectedEscortsLoading;
    const pricing = establishment?.establishmentSettings?.pricing;

    useEffect(() => {
        const selectedIdsParam = searchParams.get('selected');
        const selectedIds = selectedIdsParam ? selectedIdsParam.split(',').filter(id => id) : [];
        setSelectedEscortIds(selectedIds);
    }, [searchParams]);

    useEffect(() => {
        if (pricing && durationHours > 0) {
            const roomPricePerHour = pricing.basePricePerHour || 0;
            const roomSupplement = pricing.roomTypes[selectedRoomType]?.enabled ? (pricing.roomTypes[selectedRoomType]?.supplement || 0) : 0;
            
            const roomCost = durationHours * roomPricePerHour + roomSupplement;
            
            const escortsCost = selectedEscorts?.reduce((total, escort) => {
                const escortRate = escort.rates?.escortPerHour || 0;
                return total + (escortRate * durationHours);
            }, 0) || 0;
            
            const calculatedPrice = roomCost + escortsCost;
            setTotalPrice(calculatedPrice);
        }
    }, [pricing, durationHours, selectedRoomType, selectedEscorts]);

    const handleSubmit = async () => {
        if (!user || !annonce || !selectedDate || !pricing) {
            toast({ title: "Erreur", description: "Données de tarification ou de réservation manquantes.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const [hours, minutes] = selectedTime.split(':');
        const reservationDateTime = new Date(selectedDate);
        reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

        try {
            const response = await fetch('/api/reservations/create-establishment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: user.id,
                    annonceId: annonce.id,
                    reservationDate: reservationDateTime.toISOString(),
                    durationHours: durationHours,
                    escorts: selectedEscorts?.map(e => ({ id: e.id, name: e.displayName, profileImage: e.profileImage, rate: e.rates?.escortPerHour || 0 })) || [],
                    amount: totalPrice,
                    roomType: selectedRoomType,
                    notes: '', // Add notes if needed
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

    const baseRoomPrice = pricing?.basePricePerHour || 0;
    const roomSupplement = pricing?.roomTypes[selectedRoomType]?.enabled ? (pricing?.roomTypes[selectedRoomType]?.supplement || 0) : 0;
    const roomCost = durationHours * baseRoomPrice + roomSupplement;
    const escortsCost = selectedEscorts?.reduce((total, escort) => total + ((escort.rates?.escortPerHour || 0) * durationHours), 0) || 0;

    return (
        <div>
            <PageHeader title={annonce.title} description={`Réservation à l'établissement`} />
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className={cn("md:col-span-2 space-y-6", step !== 1 && 'hidden md:block')}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5"/> Étape 1: Date, Durée & Chambre</CardTitle>
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
                                 <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><BedDouble className="h-4 w-4"/> Type de chambre</Label>
                                    {pricing ? (
                                        <RadioGroup value={selectedRoomType} onValueChange={(v) => setSelectedRoomType(v as RoomType)} className="space-y-1">
                                            {Object.entries(pricing.roomTypes).filter(([, room]) => room.enabled).map(([key, room]) => (
                                                <div key={key} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={key} id={key} />
                                                    <Label htmlFor={key} className="capitalize">{key} ({key === 'standard' ? `Standard` : `+${room.supplement}€ total`})</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    ) : <p className="text-sm text-muted-foreground">Tarifs non configurés par l'établissement.</p>}
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
                            <CardDescription>Invitez des escortes pour vous accompagner. Le coût est calculé selon leur tarif horaire.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {selectedEscorts && selectedEscorts.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedEscorts.map(escort => (
                                        <div key={escort.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8"><AvatarImage src={escort.profileImage} /><AvatarFallback>{escort.displayName.charAt(0)}</AvatarFallback></Avatar>
                                                <span className="text-sm font-medium">{escort.displayName}</span>
                                            </div>
                                            <span className="text-sm">{(escort.rates?.escortPerHour || 0).toFixed(0)}€/h</span>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun accompagnateur sélectionné.</p>
                             )}
                        </CardContent>
                        <CardFooter className="flex-col gap-2 items-start md:flex-row md:justify-between">
                            <Button asChild>
                                <Link href={`/reservations/selection-escorte?redirect=/annonces/${params.id}/reserver&selected=${selectedEscortIds.join(',')}`}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Modifier ou Ajouter
                                </Link>
                            </Button>
                            <div className="flex md:hidden w-full justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4"/> Précédent</Button>
                                <Button onClick={() => setStep(3)}>Suivant <ArrowRight className="ml-2 h-4 w-4"/></Button>
                            </div>
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
                             <Separator />
                             <div className="space-y-2">
                                <h4 className="font-semibold">Détail du prix</h4>
                                 <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Chambre ({baseRoomPrice.toFixed(2)}€ x {durationHours}h)</span>
                                    <span>{(baseRoomPrice * durationHours).toFixed(2)} €</span>
                                </div>
                                {roomSupplement > 0 && (
                                     <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Supplément chambre {selectedRoomType}</span>
                                        <span>{roomSupplement.toFixed(2)} €</span>
                                    </div>
                                )}
                                {selectedEscorts && selectedEscorts.length > 0 && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Accompagnateurs ({selectedEscorts.length})</span>
                                        <span>{escortsCost.toFixed(2)} €</span>
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Coût total</h4>
                                <p className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} €</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                             <Button size="lg" className="w-full" onClick={handleSubmit} disabled={isSubmitting || !pricing}>
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

export default function ReserverAnnoncePage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div><Skeleton className="w-full h-96"/></div>}>
            <ReserverAnnonceContent params={params} />
        </Suspense>
    )
}
