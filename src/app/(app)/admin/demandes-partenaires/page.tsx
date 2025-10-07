
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
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

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
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
    
    useEffect(() => {
        if (!authLoading) {
            if (currentUser && ['founder', 'administrateur'].includes(currentUser.role)) {
                setIsAllowed(true);
            } else {
                 router.push('/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);

    const requestsQuery = useMemo(() => isAllowed && firestore ? query(collection(firestore, 'partnerRequests'), orderBy('createdAt', 'desc')) : null, [isAllowed, firestore]);
    const { data: requests, loading: requestsLoading, setData: setRequests } = useCollection<PartnerRequest>(requestsQuery);
    
    const loading = authLoading || !isAllowed || requestsLoading;

    const handleUpdateRequest = async (id: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;

        setLoadingStates(prev => ({...prev, [id]: true}));

        if (status === 'rejected') {
            const requestRef = doc(firestore, 'partnerRequests', id);
            try {
                await updateDoc(requestRef, { status: 'rejected' });
                toast({
                    title: 'Demande rejetée',
                    description: `La demande a été marquée comme rejetée.`,
                });
                setRequests(prev => prev?.map(r => r.id === id ? {...r, status: 'rejected'} : r) || null);
            } catch (error) {
                console.error("Error rejecting partner request:", error);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de mettre à jour la demande.',
                    variant: 'destructive',
                });
            }
        } else if (status === 'approved') {
            try {
                const response = await fetch('/api/admin/approve-partner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId: id }),
                });

                const result = await response.json();

                if (response.ok) {
                    toast({
                        title: 'Partenaire Approuvé !',
                        description: `Le compte pour ${result.companyName} a été créé.`,
                    });
                    setRequests(prev => prev?.map(r => r.id === id ? {...r, status: 'approved'} : r) || null);
                } else {
                    throw new Error(result.message || 'Une erreur est survenue.');
                }
            } catch (error: any) {
                console.error("Error approving partner request:", error);
                toast({
                    title: 'Erreur d\'approbation',
                    description: error.message || "Impossible de finaliser l'approbation.",
                    variant: 'destructive',
                });
            }
        }

        setLoadingStates(prev => ({...prev, [id]: false}));
    };
    
    if (!isAllowed && !authLoading) {
        return (
             <div>
                <PageHeader title="Demandes Partenaires" />
                <Card><CardHeader><CardTitle>Accès non autorisé</CardTitle></CardHeader><CardContent className="h-40 flex items-center justify-center"><p className="text-muted-foreground">Permissions insuffisantes.</p></CardContent></Card>
            </div>
        )
    }

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
                        {loading ? 'Chargement...' : `Il y a actuellement ${requests?.length || 0} demande(s).`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {loading ? (
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
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleUpdateRequest(req.id, 'approved')}
                                                    disabled={loadingStates[req.id]}
                                                    aria-label="Approuver"
                                                >
                                                    {loadingStates[req.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleUpdateRequest(req.id, 'rejected')}
                                                    disabled={loadingStates[req.id]}
                                                    aria-label="Rejeter"
                                                >
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
                    {!loading && (!requests || requests.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">Aucune demande de partenariat pour le moment.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
