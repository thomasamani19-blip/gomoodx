
'use client';

import { useMemo } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { Reservation, User } from '@/lib/types';
import { collection, query, where, orderBy, or } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { CalendarCheck, Eye } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

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

const OtherPartyCell = ({ userId }: { userId: string }) => {
    const firestore = useFirestore();
    const userRef = useMemo(() => firestore ? firestore.collection('users').doc(userId) : null, [firestore, userId]);
    const { data: user, loading } = useDoc<User>(userRef);

    if (loading) return <Skeleton className="h-4 w-24" />;
    if (!user) return <span>Utilisateur inconnu</span>;

    return (
        <Link href={`/profil/${user.id}`} className="hover:underline font-medium">
            {user.displayName}
        </Link>
    );
}

export default function ReservationsPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();

    const reservationsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'reservations'),
            or(
                where('memberId', '==', user.id),
                where('creatorId', '==', user.id)
            ),
            orderBy('reservationDate', 'desc')
        );
    }, [user, firestore]);

    const { data: reservations, loading: reservationsLoading } = useCollection<Reservation>(reservationsQuery);
    const loading = authLoading || reservationsLoading;
    const isCreatorOrPartner = user?.role === 'escorte' || user?.role === 'partenaire';

    return (
        <div>
            <PageHeader
                title="Mes Réservations"
                description="Suivez vos réservations passées et à venir."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Liste des réservations</CardTitle>
                    <CardDescription>
                        {loading ? 'Chargement...' : `Vous avez un total de ${reservations?.length || 0} réservation(s).`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>{isCreatorOrPartner ? 'Client' : 'Prestataire'}</TableHead>
                                    <TableHead>Date de la réservation</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reservations && reservations.length > 0 ? (
                                    reservations.map(res => {
                                        const otherPartyId = user?.id === res.memberId ? res.creatorId : res.memberId;
                                        return (
                                        <TableRow key={res.id}>
                                            <TableCell className="font-medium">{res.annonceTitle}</TableCell>
                                            <TableCell>
                                                <OtherPartyCell userId={otherPartyId} />
                                            </TableCell>
                                            <TableCell>
                                                {res.reservationDate ? format(res.reservationDate.toDate(), 'd MMM yyyy à HH:mm', { locale: fr }) : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariantMap[res.status] || 'default'}>{statusTextMap[res.status]}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/reservations/${res.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" /> Voir Détails
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )})
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <CalendarCheck className="h-12 w-12 text-muted-foreground" />
                                                <p className="text-muted-foreground">Vous n'avez aucune réservation pour le moment.</p>
                                                {!isCreatorOrPartner && (
                                                    <Button asChild>
                                                        <Link href="/annonces">Parcourir les annonces</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
