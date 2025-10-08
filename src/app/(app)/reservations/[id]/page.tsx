
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Reservation, User, CallType, ConfirmationStatus, ReservationStatus } from '@/lib/types';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, ShieldQuestion, Calendar, Tag, CreditCard, User as UserIcon, Users, Timer, BedDouble, Clock, HelpCircle, Check, X, Building, MapPin, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const statusVariantMap = {
    pending: 'outline',
    confirmed: 'default',
    cancelled: 'destructive',
    completed: 'secondary',
} as const;

const statusTextMap = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    cancelled: 'Annulée',
    completed: 'Terminée',
};

const confirmationStatusVariantMap = {
    pending: 'outline',
    confirmed: 'default',
    declined: 'destructive',
} as const;

const confirmationStatusTextMap = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    declined: 'Refusé',
};


export default function ReservationDetailPage({ params }: { params: { id: string } }) {
    const { user: currentUser, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const reservationRef = useMemo(() => firestore ? doc(firestore, 'reservations', params.id) : null, [firestore, params.id]);
    const { data: reservation, loading: reservationLoading, setData: setReservation } = useDoc<Reservation>(reservationRef);
    
    const otherPartyId = useMemo(() => {
        if (!reservation || !currentUser) return null;
        return reservation.memberId === currentUser.id ? reservation.creatorId : reservation.memberId;
    }, [reservation, currentUser]);

    const otherPartyRef = useMemo(() => (firestore && otherPartyId) ? doc(firestore, 'users', otherPartyId) : null, [firestore, otherPartyId]);
    const { data: otherParty, loading: otherPartyLoading } = useDoc<User>(otherPartyRef);
    
    const loading = authLoading || reservationLoading || otherPartyLoading;
    
    const isCurrentUserTheMember = currentUser?.id === reservation?.memberId;
    const isCurrentUserTheCreator = currentUser?.id === reservation?.creatorId;
    
    const isUserAllowedToView = isCurrentUserTheMember || isCurrentUserTheCreator;

    const handleStatusUpdate = async (newStatus: ConfirmationStatus | ReservationStatus) => {
        if (!currentUser || !reservation) return;
        setIsUpdatingStatus(true);
        try {
            const response = await fetch('/api/reservations/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: reservation.id, userId: currentUser.id, newStatus })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            toast({ title: "Statut mis à jour", description: result.message });
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    
    const handlePresenceConfirm = async () => {
        if (!currentUser || !reservation) return;
        setIsUpdatingStatus(true);
        try {
            const response = await fetch('/api/reservations/confirm-presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: reservation.id, userId: currentUser.id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            toast({ title: "Confirmation enregistrée", description: result.message });
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };


    if (loading) {
        return (
            <div>
                <PageHeader title="Détails de la réservation" description="Chargement..." />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                         <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!isUserAllowedToView) {
        return <PageHeader title="Accès non autorisé" description="Vous n'êtes pas autorisé à voir cette réservation." />;
    }
    
    if (!reservation || !otherParty) {
        return <PageHeader title="Réservation introuvable" description="Cette réservation n'existe pas." />;
    }
    
    const mainActionButtons = () => {
        if (reservation.status === 'pending') {
            if (isCurrentUserTheMember) {
                return <Button variant="destructive" onClick={() => handleStatusUpdate('cancelled')} disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Annuler la réservation
                </Button>
            }
            if (isCurrentUserTheCreator) {
                return (
                    <div className="flex gap-2">
                         <Button variant="destructive" onClick={() => handleStatusUpdate('cancelled')} disabled={isUpdatingStatus}>
                            {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X />} Refuser
                        </Button>
                        <Button onClick={() => handleStatusUpdate('confirmed')} disabled={isUpdatingStatus}>
                            {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check />} Confirmer
                        </Button>
                    </div>
                );
            }
        }
        
        if (reservation.status === 'confirmed') {
            // ... Presence confirmation logic will go here
        }

        return null;
    }

    const memberHasConfirmed = reservation.memberPresenceConfirmed;
    const creatorHasConfirmed = reservation.escortConfirmations[reservation.creatorId]?.presenceConfirmed;
    const currentUserHasConfirmed = isCurrentUserTheMember ? memberHasConfirmed : creatorHasConfirmed;

    return (
    <TooltipProvider>
        <div>
            <PageHeader title="Détails de la réservation" />

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    {/* Main Reservation Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{reservation.annonceTitle}</CardTitle>
                            <div className="flex items-center gap-2 pt-2">
                                <p className="text-sm">Réservation n° {reservation.id.substring(0, 8)}</p>
                                <Badge variant={statusVariantMap[reservation.status] || 'default'}>
                                    {statusTextMap[reservation.status]}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-6">
                             <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Date & Heure</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {format(reservation.reservationDate.toDate(), 'EEEE d MMMM yyyy \'à\' HH:mm', { locale: fr })}
                                    </p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Timer className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Durée</h4>
                                    <p className="text-sm text-muted-foreground">{reservation.durationHours ? `${reservation.durationHours} heure(s)` : 'Non spécifiée'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Lieu</h4>
                                    <p className="text-sm text-muted-foreground">{reservation.location || 'Non spécifié'}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Montant total</h4>
                                    <p className="text-sm text-muted-foreground">{reservation.amount.toFixed(2)} € (incl. {reservation.fee}€ de frais)</p>
                                </div>
                            </div>
                            {reservation.notes && (
                                <div className="flex items-start gap-3 sm:col-span-2">
                                    <HelpCircle className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div>
                                        <h4 className="font-medium">Notes</h4>
                                        <p className="text-sm text-muted-foreground">{reservation.notes}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                     {/* On-site Presence Card */}
                     {reservation.status === 'confirmed' && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Confirmation sur Site</CardTitle>
                                <CardDescription>Chaque participant doit confirmer sa présence une fois sur les lieux pour finaliser la réservation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className={cn("flex items-center justify-between p-3 rounded-lg", memberHasConfirmed ? "bg-green-500/10 text-green-700" : "bg-muted")}>
                                    <span className="font-semibold">{isCurrentUserTheMember ? 'Votre présence' : `Présence de ${isCurrentUserTheCreator ? reservation.memberId : otherParty.displayName}`}</span>
                                    {memberHasConfirmed ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}
                                </div>
                                <div className={cn("flex items-center justify-between p-3 rounded-lg", creatorHasConfirmed ? "bg-green-500/10 text-green-700" : "bg-muted")}>
                                     <span className="font-semibold">{isCurrentUserTheCreator ? 'Votre présence' : `Présence de ${otherParty.displayName}`}</span>
                                    {creatorHasConfirmed ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}
                                </div>
                            </CardContent>
                             <CardFooter className="flex-col items-start gap-4">
                                {memberHasConfirmed !== creatorHasConfirmed && (
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>En attente de l'autre participant</AlertTitle>
                                        <AlertDescription>
                                            N'oubliez pas de demander à <strong>{otherParty.displayName}</strong> de confirmer sa présence également pour finaliser le rendez-vous.
                                        </AlertDescription>
                                    </Alert>
                                )}
                               <p className="text-xs text-muted-foreground">Lorsque les deux participants auront confirmé leur présence, les fonds seront transférés au créateur.</p>
                               <Button onClick={handlePresenceConfirm} disabled={isUpdatingStatus || currentUserHasConfirmed}>
                                 {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                                 {currentUserHasConfirmed ? 'Votre présence est confirmée' : 'Confirmer ma présence sur les lieux'}
                               </Button>
                             </CardFooter>
                         </Card>
                     )}
                </div>
                
                <div className="space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Participant
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Link href={`/profil/${otherParty.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent">
                                <Avatar className="h-12 w-12"><AvatarImage src={otherParty.profileImage} /><AvatarFallback>{otherParty.displayName.charAt(0)}</AvatarFallback></Avatar>
                                <div><p className="font-bold">{otherParty.displayName}</p><p className="text-xs text-muted-foreground capitalize">{otherParty.role}</p></div>
                            </Link>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            {mainActionButtons()}
                            <Button asChild variant="outline">
                                <Link href={`/messagerie?contact=${otherParty.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Contacter
                                </Link>
                            </Button>
                            {reservation.status === 'confirmed' && (
                                <Button asChild variant="outline">
                                    <Link href={`/messagerie?contact=${otherParty.id}&call=true`}>
                                        <Phone className="mr-2 h-4 w-4" /> Appeler (Gratuit)
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    </TooltipProvider>
    );
}
