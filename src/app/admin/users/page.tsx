
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore } from '@/firebase';
import type { User, UserRole, UserStatus } from '@/lib/types';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ShieldOff, UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const roleVariantMap: { [key in UserRole]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    founder: 'destructive',
    administrateur: 'secondary',
    moderator: 'secondary',
    escorte: 'default',
    partenaire: 'outline',
    client: 'outline',
};

const statusVariantMap: { [key in UserStatus]: 'default' | 'destructive' | 'outline' } = {
    active: 'default',
    suspended: 'destructive',
    pending: 'outline',
};


export default function AdminUsersPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (currentUser && ['founder', 'administrateur'].includes(currentUser.role)) {
                setIsAllowed(true);
            } else {
                 setIsAllowed(false);
                 router.push('/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);
    
    const usersQuery = useMemo(() => {
        if (!isAllowed || !firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    }, [isAllowed, firestore]);
    
    const { data: users, loading: usersLoading, setData: setUsers } = useCollection<User>(usersQuery);

    const loading = authLoading || !isAllowed || usersLoading;
    
    const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
        if (!firestore) return;
        
        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, { status: newStatus });
            
            setUsers(prevUsers => 
                prevUsers?.map(user => 
                    user.id === userId ? { ...user, status: newStatus } : user
                ) || null
            );

            toast({ title: "Statut mis à jour", description: `L'utilisateur a été ${newStatus === 'suspended' ? 'suspendu' : 'activé'}.` });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de mettre à jour le statut de l'utilisateur.", variant: 'destructive' });
            console.error("Error updating user status:", error);
        }
    }


    if (!isAllowed && !authLoading) {
        return (
            <div>
                <PageHeader title="Gestion des Utilisateurs" />
                <Card>
                    <CardHeader>
                        <CardTitle>Accès non autorisé</CardTitle>
                    </CardHeader>
                    <CardContent className="h-40 flex items-center justify-center">
                         <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                title="Gestion des Utilisateurs"
                description="Supervisez et gérez tous les comptes de la plateforme."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Liste des utilisateurs</CardTitle>
                    <CardDescription>
                        {loading ? 'Chargement...' : `Il y a actuellement ${users?.length || 0} utilisateurs enregistrés.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date d'inscription</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
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
                                        <Badge variant={roleVariantMap[user.role] || 'default'} className="capitalize">{user.role}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant={statusVariantMap[user.status] || 'default'} className="capitalize">{user.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.createdAt ? format(user.createdAt.toDate(), 'd MMM yyyy', { locale: fr }) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
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
                                                {user.status === 'active' && (
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateStatus(user.id, 'suspended')}>
                                                        <ShieldOff className="mr-2 h-4 w-4" />
                                                        Suspendre
                                                    </DropdownMenuItem>
                                                )}
                                                {user.status === 'suspended' && (
                                                     <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, 'active')}>
                                                         <UserCheck className="mr-2 h-4 w-4" />
                                                         Réactiver
                                                     </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                    {!loading && (!users || users.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
