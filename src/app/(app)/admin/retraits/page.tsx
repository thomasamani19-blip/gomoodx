
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollectionGroup, useFirestore } from '@/firebase';
import type { Transaction, User } from '@/lib/types';
import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useDoc } from '@/firebase/firestore/use-doc';

// Helper component to fetch and display user info for a transaction
const UserCell = ({ userId }: { userId: string }) => {
    const firestore = useFirestore();
    const userRef = useMemo(() => firestore ? firestore.collection('users').doc(userId) : null, [firestore, userId]);
    const { data: user, loading } = useDoc<User>(userRef);

    if (loading) return <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-24" /></div>;

    return (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={user?.profileImage} />
                <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-medium">{user?.displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
        </div>
    );
};

export default function AdminWithdrawalsPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    
    useEffect(() => {
        if (!authLoading) {
            if (currentUser?.role === 'founder') {
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
                router.push('/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);

    const withdrawalsQuery = useMemo(() => {
        if (!isAllowed || !firestore) return null;
        return query(
            collectionGroup(firestore, 'transactions'), 
            where('type', '==', 'withdrawal'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
    }, [isAllowed, firestore]);
        
    const { data: withdrawals, loading: withdrawalsLoading, setData: setWithdrawals } = useCollectionGroup<Transaction>(withdrawalsQuery);
    
    const loading = authLoading || !isAllowed || withdrawalsLoading;

    const handleUpdateWithdrawal = async (tx: Transaction, newStatus: 'completed' | 'failed') => {
        if (!firestore) return;
        
        const userId = tx.path.split('/')[1]; // Extract userId from path
        if (!userId) {
            toast({ title: 'Erreur', description: 'ID utilisateur introuvable dans la transaction.', variant: 'destructive' });
            return;
        }

        setLoadingStates(prev => ({ ...prev, [tx.id]: true }));

        try {
            const response = await fetch('/api/admin/process-withdrawal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, transactionId: tx.id, newStatus })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            toast({ title: 'Statut mis à jour', description: result.message });
            setWithdrawals(prev => prev?.filter(w => w.id !== tx.id) || null);
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } finally {
            setLoadingStates(prev => ({ ...prev, [tx.id]: false }));
        }
    };
    
    if (!isAllowed && !authLoading) {
        return (
            <div>
                <PageHeader title="Gestion des Retraits" />
                <Card><CardHeader><CardTitle>Accès non autorisé</CardTitle></CardHeader><CardContent className="h-40 flex items-center justify-center"><p className="text-muted-foreground">Permissions insuffisantes.</p></CardContent></Card>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Gestion des Retraits"
                description="Validez ou rejetez les demandes de retrait des utilisateurs."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Demandes en attente</CardTitle>
                    <CardDescription>
                        {loading ? 'Chargement...' : `Il y a actuellement ${withdrawals?.length || 0} demande(s) en attente.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {withdrawals && withdrawals.map(tx => {
                                const userId = tx.path.split('/')[1];
                                return (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <UserCell userId={userId} />
                                    </TableCell>
                                    <TableCell className="font-bold text-lg">{tx.amount.toFixed(2)} €</TableCell>
                                    <TableCell>
                                        {tx.createdAt ? format(tx.createdAt.toDate(), 'd MMM yyyy HH:mm', { locale: fr }) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button 
                                                variant="destructive"
                                                size="icon" 
                                                onClick={() => handleUpdateWithdrawal(tx, 'failed')}
                                                disabled={loadingStates[tx.id]}
                                                aria-label="Rejeter"
                                            >
                                                {loadingStates[tx.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                                            </Button>
                                            <Button 
                                                variant="default" 
                                                size="icon" 
                                                onClick={() => handleUpdateWithdrawal(tx, 'completed')}
                                                disabled={loadingStates[tx.id]}
                                                aria-label="Approuver"
                                            >
                                                {loadingStates[tx.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    )}
                    {!loading && (!withdrawals || withdrawals.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">Aucune demande de retrait en attente.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
