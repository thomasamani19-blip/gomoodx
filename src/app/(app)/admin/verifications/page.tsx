
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore } from '@/firebase';
import type { User, VerificationStatus, Settings } from '@/lib/types';
import { collection, query, where, doc, updateDoc, writeBatch, getDoc, FieldValue, increment } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';

const statusVariantMap: { [key in VerificationStatus]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'outline',
    verified: 'default',
    rejected: 'destructive',
};

const statusTextMap = {
    pending: 'En attente',
    verified: 'Vérifié',
    rejected: 'Rejeté',
};


export default function AdminVerificationsPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);
    const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settings, loading: settingsLoading } = useDoc<Settings>(settingsRef);
    
    useEffect(() => {
        if (!authLoading) {
            if (currentUser && ['founder', 'administrateur', 'moderator'].includes(currentUser.role)) {
                setIsAllowed(true);
            } else if (currentUser) {
                 setIsAllowed(false);
                 router.push('/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);

    const verificationQuery = useMemo(() => isAllowed && firestore 
        ? query(
            collection(firestore, 'users'), 
            where('role', '==', 'escorte'), 
            where('verificationStatus', '==', 'pending')
          ) 
        : null, [isAllowed, firestore]);
        
    const { data: users, loading: usersLoading, setData: setUsers } = useCollection<User>(verificationQuery);
    
    const loading = authLoading || !isAllowed || usersLoading || settingsLoading;

    const handleUpdateVerification = async (userId: string, status: 'verified' | 'rejected') => {
        if (!firestore) return;

        setLoadingStates(prev => ({...prev, [userId]: true}));

        try {
            const userRef = doc(firestore, 'users', userId);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) throw new Error("Utilisateur introuvable.");
            
            const userData = userDoc.data() as User;
            const batch = writeBatch(firestore);

            batch.update(userRef, { 
                verificationStatus: status,
                status: status === 'verified' ? 'active' : 'suspended',
                isVerified: status === 'verified',
            });

            // Check for profile completion bonus
            let bonusAwarded = false;
            const PROFILE_COMPLETION_BONUS = settings?.rewards?.profileCompletionBonus || 0;

            if (status === 'verified' && !userData.hasCompletedProfile && PROFILE_COMPLETION_BONUS > 0) {
                const profileIsComplete = userData.profileImage && !userData.profileImage.includes('picsum.photos') && userData.bannerImage && !userData.bannerImage.includes('picsum.photos') && userData.bio && userData.galleryImages && userData.galleryImages.length >= 3;
                
                if (profileIsComplete) {
                    const walletRef = doc(firestore, 'wallets', userId);
                    const rewardTxRef = doc(collection(walletRef, 'transactions'));
                    
                    batch.update(userRef, {
                        hasCompletedProfile: true,
                        rewardPoints: increment(PROFILE_COMPLETION_BONUS),
                    });

                    batch.set(rewardTxRef, {
                        amount: PROFILE_COMPLETION_BONUS,
                        type: 'reward',
                        description: 'Bonus pour profil complet et vérifié !',
                        status: 'success',
                        createdAt: new Date(),
                    });
                    bonusAwarded = true;
                }
            }
            
            await batch.commit();

            toast({
                title: 'Statut mis à jour',
                description: `Le créateur a été ${status === 'verified' ? 'approuvé' : 'rejeté'}. ${bonusAwarded ? `Et a reçu ${PROFILE_COMPLETION_BONUS} points bonus !` : ''}`,
            });

            setUsers(prev => prev?.filter(u => u.id !== userId) || null);
        } catch (error: any) {
            console.error("Error updating verification status:", error);
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible de mettre à jour le statut.',
                variant: 'destructive',
            });
        } finally {
            setLoadingStates(prev => ({...prev, [userId]: false}));
        }
    };
    
    if (!isAllowed && !authLoading) {
        return (
             <div>
                <PageHeader title="Vérifications d'Identité" />
                <Card><CardHeader><CardTitle>Accès non autorisé</CardTitle></CardHeader><CardContent className="h-40 flex items-center justify-center"><p className="text-muted-foreground">Permissions insuffisantes.</p></CardContent></Card>
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                title="Vérifications d'Identité"
                description="Examinez et validez les nouveaux créateurs de la plateforme."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Demandes en attente</CardTitle>
                    <CardDescription>
                        {loading ? 'Chargement...' : `Il y a actuellement ${users?.length || 0} demande(s) en attente.`}
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
                                <TableHead>Créateur</TableHead>
                                <TableHead>Type de vérification</TableHead>
                                <TableHead>Date d'inscription</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users && users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.profileImage} />
                                                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant="secondary" className="capitalize">{user.verificationType === 'complete' ? 'Complète' : 'Selfie'}</Badge>
                                     </TableCell>
                                    <TableCell>
                                        {user.createdAt ? format(user.createdAt.toDate(), 'd MMM yyyy', { locale: fr }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleUpdateVerification(user.id, 'verified')}
                                                disabled={loadingStates[user.id]}
                                            >
                                                {loadingStates[user.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleUpdateVerification(user.id, 'rejected')}
                                                disabled={loadingStates[user.id]}
                                            >
                                                <XCircle className="h-5 w-5 text-destructive" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/profil/${user.id}`}>Voir le profil</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled>Voir les documents (Bientôt)</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                    {!loading && (!users || users.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">Aucune demande de vérification en attente.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
