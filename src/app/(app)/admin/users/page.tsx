
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore } from '@/firebase';
import type { User, UserRole, UserStatus } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const roleVariantMap: { [key in UserRole]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    founder: 'destructive',
    administrateur: 'secondary',
    moderator: 'secondary',
    escorte: 'default',
    partenaire: 'outline',
    client: 'outline',
};

const statusVariantMap: { [key in UserStatus]: 'default' | 'destructive' } = {
    active: 'default',
    suspended: 'destructive',
    pending: 'outline',
};


export default function AdminUsersPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const firestore = useFirestore();
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        if (!authLoading && currentUser) {
            const isAdmin = ['founder', 'administrateur', 'moderator'].includes(currentUser.role);
            if (isAdmin) {
                setIsAllowed(true);
            } else {
                router.push('/dashboard');
            }
        } else if (!authLoading && !currentUser) {
            router.push('/connexion');
        }
    }, [currentUser, authLoading, router]);
    
    const usersQuery = useMemo(() => {
        if (!isAllowed || !firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    }, [isAllowed, firestore]);
    
    const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);

    const loading = authLoading || (isAllowed && usersLoading);

    if (!authLoading && !isAllowed) {
        return (
            <div>
                <PageHeader title="Gestion des Utilisateurs" description="Supervisez et gérez tous les comptes de la plateforme." />
                <Card>
                    <CardHeader>
                        <CardTitle>Accès non autorisé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-40">
                             <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                        </div>
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
                                                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
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
                                                <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                                                <DropdownMenuItem>Modifier</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Suspendre</DropdownMenuItem>
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
