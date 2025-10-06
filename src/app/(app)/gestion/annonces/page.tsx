
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { Annonce } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default function GestionAnnoncesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const annoncesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'services'),
      where('createdBy', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: annonces, loading: annoncesLoading } = useCollection<Annonce>(annoncesQuery);

  const loading = authLoading || annoncesLoading;

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          title="Gérer mes Annonces"
          description="Créez, modifiez ou supprimez vos services proposés sur la plateforme."
        />
        <Button asChild>
            <Link href="/gestion/annonces/creer">
                <PlusCircle className="mr-2 h-4 w-4" />
                Créer une annonce
            </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mes Annonces</CardTitle>
          <CardDescription>
            {loading ? 'Chargement de vos annonces...' : `Vous avez actuellement ${annonces?.length || 0} annonce(s).`}
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
                  <TableHead>Titre</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annonces && annonces.map(annonce => (
                  <TableRow key={annonce.id}>
                    <TableCell className="font-medium">{annonce.title}</TableCell>
                    <TableCell>{annonce.price.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Badge variant={annonce.status === 'active' ? 'default' : 'secondary'}>
                        {annonce.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {annonce.createdAt ? format(annonce.createdAt.toDate(), 'd MMMM yyyy', { locale: fr }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && (!annonces || annonces.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Vous n'avez créé aucune annonce pour le moment.</p>
               <Button asChild className="mt-4">
                    <Link href="/gestion/annonces/creer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Créer ma première annonce
                    </Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
