
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Reservation, User, CallType } from '@/lib/types';
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
import { MessageSquare, Phone, ShieldQuestion, Calendar, Tag, CreditCard, User as UserIcon, Users, Timer, BedDouble, Clock, HelpCircle, Check, X, Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

    const reservationRef = useMemo(() => firestore ? doc(firestore, 'reservations', params.id) : null, [firestore, params.id]);
    const { data: reservation, loading: reservationLoading } = useDoc<Reservation>(reservationRef);
    
    const establishmentRef = useMemo(() => (firestore && reservation) ? doc(firestore, 'users', reservation.creatorId) : null, [firestore, reservation]);
    const { data: establishment, loading: establishmentLoading } = useDoc<User>(establishmentRef);
    
    const memberRef = useMemo(() => (firestore && reservation) ? doc(firestore, 'users', reservation.memberId) : null, [firestore, reservation]);
    const { data: member, loading: memberLoading } = useDoc<User>(memberRef);

    const loading = authLoading || reservationLoading || establishmentLoading || memberLoading;
    
    const isCurrentUserTheMember = currentUser?.id === reservation?.memberId;
    const isCurrentUserTheEstablishment = currentUser?.id === reservation?.creatorId;
    const isCurrentUserAnEscortInvolved = reservation?.escorts?.some(e => e.id === currentUser?.id) ?? false;
    const isUserAllowed = isCurrentUserTheMember || isCurrentUserTheEstablishment || isCurrentUserAnEscortInvolved;


    const handleFreeCall = async (otherUserId: string, otherUserName: string) => {
        if (!currentUser || !firestore) return;
        toast({ title: "Initiation de l'appel gratuit...", description: `Appel vocal avec ${otherUserName} en cours de préparation.` });
        // ... (call logic)
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

    if (!isUserAllowed) {
        return <PageHeader title="Accès non autorisé" description="Vous n'êtes pas autorisé à voir cette réservation." />;
    }
    
    if (!reservation || !establishment || !member) {
        return <PageHeader title="Réservation introuvable" description="Cette réservation n'existe pas." />;
    }
    
    const mainActionButtons = () => {
        if (reservation.status === 'pending') {
            if (isCurrentUserTheMember) {
                return <Button variant="destructive">Annuler la réservation</Button>
            }
            if (isCurrentUserTheEstablishment) {
                return <Button>Confirmer la réservation</Button>
            }
        }
        
        if (reservation.status === 'confirmed') {
            return (
                <div className="flex flex-col gap-2">
                    {isCurrentUserTheMember && !reservation.memberPresenceConfirmed && <Button>Confirmer ma présence</Button>}
                    {isCurrentUserTheEstablishment && !reservation.establishmentPresenceConfirmed && <Button>Confirmer la présence des participants</Button>}
                    {isCurrentUserAnEscortInvolved && !reservation.escortConfirmations?.[currentUser!.id]?.presenceConfirmed && <Button>Confirmer ma présence</Button>}
                </div>
            );
        }

        return null;
    }

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
                                <BedDouble className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Type de Chambre</h4>
                                    <p className="text-sm text-muted-foreground capitalize">{reservation.roomType || 'Standard'}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Montant</h4>
                                    <p className="text-sm text-muted-foreground">{reservation.amount.toFixed(2)} €</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Confirmation Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldQuestion className="h-5 w-5"/> Statut des Confirmations</CardTitle>
                            <CardDescription>Suivi des validations par chaque participant.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-3">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-semibold">{establishment.displayName} (Établissement)</span>
                                </div>
                                <Badge variant={reservation.establishmentConfirmed ? 'default' : 'outline'}>
                                    {reservation.establishmentConfirmed ? 'Confirmé' : 'En attente'}
                                </Badge>
                            </div>
                            {reservation.escorts && reservation.escorts.length > 0 && reservation.escorts.map(escort => {
                                const confirmation = reservation.escortConfirmations?.[escort.id];
                                return (
                                    <div key={escort.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                        <div className="flex items-center gap-3">
                                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-semibold">{escort.name} (Escorte)</span>
                                        </div>
                                         <div className='flex items-center gap-2'>
                                            {isCurrentUserAnEscortInvolved && currentUser?.id === escort.id && confirmation?.status === 'pending' && (
                                                <div className='flex gap-1'>
                                                    <Button size='sm' variant='destructive' className='h-8'>Refuser</Button>
                                                    <Button size='sm' className='h-8'>Accepter</Button>
                                                </div>
                                            )}
                                             <Badge variant={confirmationStatusVariantMap[confirmation?.status || 'pending']}>
                                                {confirmationStatusTextMap[confirmation?.status || 'pending']}
                                             </Badge>
                                         </div>
                                    </div>
                                )
                            })}
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
                                <div className={cn("flex items-center justify-between p-3 rounded-lg", reservation.memberPresenceConfirmed ? "bg-green-500/10 text-green-700" : "bg-muted")}>
                                    <span className="font-semibold">{member.displayName} (Client)</span>
                                    {reservation.memberPresenceConfirmed ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}
                                </div>
                                {reservation.escorts && reservation.escorts.map(escort => (
                                    <div key={escort.id} className={cn("flex items-center justify-between p-3 rounded-lg", reservation.escortConfirmations?.[escort.id]?.presenceConfirmed ? "bg-green-500/10 text-green-700" : "bg-muted")}>
                                        <span className="font-semibold">{escort.name} (Escorte)</span>
                                        {reservation.escortConfirmations?.[escort.id]?.presenceConfirmed ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}
                                    </div>
                                ))}
                            </CardContent>
                             <CardFooter>
                                <p className="text-xs text-muted-foreground">La confirmation finale par l'établissement déclenchera le paiement.</p>
                             </CardFooter>
                         </Card>
                     )}
                </div>
                
                <div className="space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Participants
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href={`/profil/${member.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent">
                                <Avatar className="h-12 w-12"><AvatarImage src={member.profileImage} /><AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback></Avatar>
                                <div><p className="font-bold">{member.displayName}</p><p className="text-xs text-muted-foreground">Client</p></div>
                            </Link>
                            <Link href={`/partenaire/${establishment.id}`} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent">
                                <Avatar className="h-12 w-12"><AvatarImage src={establishment.profileImage} /><AvatarFallback>{establishment.displayName.charAt(0)}</AvatarFallback></Avatar>
                                <div><p className="font-bold">{establishment.displayName}</p><p className="text-xs text-muted-foreground">Établissement</p></div>
                            </Link>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            {mainActionButtons()}
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className="w-full" disabled={reservation.status !== 'confirmed'}>
                                        <Phone className="mr-2 h-4 w-4" /> Appeler (Gratuit)
                                    </Button>
                                </TooltipTrigger>
                                {reservation.status !== 'confirmed' && (
                                    <TooltipContent><p>L'appel gratuit sera disponible une fois la réservation confirmée.</p></TooltipContent>
                                )}
                            </Tooltip>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    </TooltipProvider>
    );
}
