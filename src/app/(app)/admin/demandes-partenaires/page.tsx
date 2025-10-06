
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore } from '@/firebase';
import type { PartnerRequest } from '@/lib/types';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

const statusVariantMap: { [key in PartnerRequest['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'outline',
    approved: 'default',
    rejected: 'destructive',
};

const statusTextMap = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Rejetée',
};

export default function AdminPartnerRequestsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const requestsQuery = useMemo(() => firestore ? query(collection(firestore, 'partnerRequests'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: requests, loading: requestsLoading } = useCollection<PartnerRequest>(requestsQuery);

    const handleUpdateRequest = async (id: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;
        const requestRef = doc(firestore, 'partnerRequests', id);
        try {
            await updateDoc(requestRef, { status: status });
            toast({
                title: 'Demande mise à jour',
                description: `La demande a été marquée comme ${status === 'approved' ? 'approuvée' : 'rejetée'}.`,
            });
            // In a real app, approving would also trigger user creation.
        } catch (error) {
            console.error("Error updating partner request:", error);
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour la demande.',
                variant: 'destructive',
            });
        }
    };
    
    return (
        <div>
            <PageHeader
                title="Demandes d'Inscription Partenaire"
                description="Examinez et approuvez les nouvelles demandes de partenariat."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Liste des demandes</CardTitle>
                    <CardDescription>
                        {requestsLoading ? 'Chargement...' : `Il y a actuellement ${requests?.length || 0} demande(s).`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {requestsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom de l'entreprise</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date de la demande</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests && requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.companyName}</div>
                                        <div className="text-sm text-muted-foreground">{req.companyEmail}</div>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant="secondary" className="capitalize">{req.type === 'establishment' ? 'Établissement' : 'Producteur'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {req.createdAt ? format(req.createdAt.toDate(), 'd MMM yyyy', { locale: fr }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariantMap[req.status] || 'default'} className="capitalize">{statusTextMap[req.status]}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleUpdateRequest(req.id, 'approved')}>
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleUpdateRequest(req.id, 'rejected')}>
                                                    <XCircle className="h-5 w-5 text-destructive" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                    {!requestsLoading && (!requests || requests.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">Aucune demande de partenariat pour le moment.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
