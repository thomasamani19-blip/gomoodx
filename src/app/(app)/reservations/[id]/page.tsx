
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import type { Reservation, User, CallType } from '@/lib/types';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, ShieldQuestion, Calendar, Tag, CreditCard, User as UserIcon, Users, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
    const { user: currentUser, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const reservationRef = useMemo(() => firestore ? doc(firestore, 'reservations', params.id) : null, [firestore, params.id]);
    const { data: reservation, loading: reservationLoading } = useDoc<Reservation>(reservationRef);
    
    const otherUserId = useMemo(() => {
        if (!currentUser || !reservation) return null;
        return currentUser.id === reservation.memberId ? reservation.creatorId : reservation.memberId;
    }, [currentUser, reservation]);

    const otherUserRef = useMemo(() => (firestore && otherUserId) ? doc(firestore, 'users', otherUserId) : null, [firestore, otherUserId]);
    const { data: otherUser, loading: otherUserLoading } = useDoc<User>(otherUserRef);

    const loading = authLoading || reservationLoading || otherUserLoading;
    
    const isUserAllowed = useMemo(() => {
        if (!currentUser || !reservation) return false;
        return currentUser.id === reservation.memberId || currentUser.id === reservation.creatorId;
    }, [currentUser, reservation]);

    const handleFreeCall = async () => {
        if (!currentUser || !otherUser || !firestore) return;

        toast({ title: "Initiation de l'appel gratuit...", description: `Appel vocal avec ${otherUser.displayName} en cours de préparation.` });

        const callData = {
            callerId: currentUser.id,
            receiverId: otherUser.id,
            callerName: currentUser.displayName || 'Utilisateur',
            status: 'pending',
            type: 'voice' as CallType,
            createdAt: serverTimestamp(),
            isFreeCall: true, // Marquer cet appel comme gratuit
        };

        try {
            const callDocRef = await addDoc(collection(firestore, 'calls'), callData);
            router.push(`/appels/${callDocRef.id}`);
        } catch (error) {
            console.error("Erreur lors de l'initiation de l'appel gratuit:", error);
            toast({ title: "Erreur d'appel", description: "Impossible de démarrer l'appel.", variant: 'destructive' });
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

    if (!isUserAllowed) {
        return <PageHeader title="Accès non autorisé" description="Vous n'êtes pas autorisé à voir cette réservation." />;
    }
    
    if (!reservation) {
        return <PageHeader title="Réservation introuvable" description="Cette réservation n'existe pas." />;
    }

    return (
        <div>
            <PageHeader title="Détails de la réservation" />

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
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
                                <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Montant payé</h4>
                                    <p className="text-sm text-muted-foreground">{reservation.amount.toFixed(2)} €</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Tag className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h4 className="font-medium">Service</h4>
                                    <Link href={`/annonces/${reservation.annonceId}`} className="text-sm text-primary hover:underline">
                                        Voir l'annonce originale
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {reservation.escorts && reservation.escorts.length > 0 && (
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Accompagnateurs/trices</CardTitle>
                             </CardHeader>
                             <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reservation.escorts.map(escort => (
                                    <Link key={escort.id} href={`/profil/${escort.id}`}>
                                        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                            <Avatar>
                                                <AvatarImage src={escort.profileImage} />
                                                <AvatarFallback>{escort.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-medium text-sm">{escort.name}</p>
                                        </div>
                                    </Link>
                                ))}
                             </CardContent>
                        </Card>
                    )}
                </div>
                
                {otherUser && (
                     <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5"/>
                                {currentUser?.id === reservation.memberId ? 'Votre Prestataire' : 'Votre Client'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={otherUser.profileImage} />
                                    <AvatarFallback>{otherUser.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-lg">{otherUser.displayName}</p>
                                    <Link href={`/profil/${otherUser.id}`} className="text-xs text-primary hover:underline">
                                        Voir le profil
                                    </Link>
                                </div>
                            </div>
                             <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Coordonnées</h4>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Email:</strong> {otherUser.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Téléphone:</strong> {otherUser.phone || 'Non fourni'}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 border-t pt-4">
                                <h4 className="font-medium">Actions</h4>
                                <Button asChild>
                                    <Link href={`/messagerie?contact=${otherUser.id}`}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Envoyer un message
                                    </Link>
                                </Button>
                                 <Button variant="outline" onClick={handleFreeCall}>
                                    <Phone className="mr-2 h-4 w-4" /> Appeler (gratuit)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
