
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

export default function GestionProduitsPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const produitsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'products'),
      where('createdBy', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: produits, loading: produitsLoading } = useCollection<Product>(produitsQuery);

  const loading = authLoading || produitsLoading;

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          title="Gérer mes Produits"
          description="Créez et gérez les articles de votre boutique."
        />
        <Button asChild>
            <Link href="/gestion/produits/creer">
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer un produit
            </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mes Produits</CardTitle>
          <CardDescription>
            {loading ? 'Chargement de vos produits...' : `Vous avez actuellement ${produits?.length || 0} produit(s) en vente.`}
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
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produits && produits.map(produit => (
                  <TableRow key={produit.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Image 
                                src={produit.imageUrl || `https://picsum.photos/seed/${produit.id}/50/50`}
                                alt={produit.title}
                                width={40}
                                height={40}
                                className="rounded-md"
                            />
                            <span>{produit.title}</span>
                        </div>
                    </TableCell>
                    <TableCell>{produit.price.toFixed(2)} €</TableCell>
                    <TableCell>
                      {produit.createdAt ? format(produit.createdAt.toDate(), 'd MMMM yyyy', { locale: fr }) : 'N/A'}
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
          {!loading && (!produits || produits.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Vous n'avez mis aucun produit en vente pour le moment.</p>
              <Button asChild className="mt-4">
                    <Link href="/gestion/produits/creer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Créer mon premier produit
                    </Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
