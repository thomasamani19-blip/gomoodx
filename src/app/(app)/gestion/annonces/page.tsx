'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useStorage } from '@/firebase';
import type { Annonce } from '@/lib/types';
import { collection, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useMemo, useState } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash2, Loader2, Pencil, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function GestionAnnoncesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [sponsoringState, setSponsoringState] = useState<{[key: string]: boolean}>({});
  const [annonceToDelete, setAnnonceToDelete] = useState<Annonce | null>(null);

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

  const handleDelete = async () => {
    if (!annonceToDelete || !firestore || !storage) return;

    setIsDeleting(true);
    try {
      // Delete Firestore document
      await deleteDoc(doc(firestore, 'services', annonceToDelete.id));

      // Delete image from Storage if it exists
      if (annonceToDelete.imageUrl) {
        try {
            const imageRef = ref(storage, annonceToDelete.imageUrl);
            await deleteObject(imageRef);
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.warn("Could not delete image from storage:", storageError.message);
            }
        }
      }

      toast({
        title: "Annonce supprimée",
        description: "L'annonce a été supprimée avec succès.",
      });

    } catch (error) {
      console.error("Error deleting annonce:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setAnnonceToDelete(null);
    }
  };
  
  const handleToggleSponsor = async (annonce: Annonce) => {
    if (!firestore) return;
    setSponsoringState(prev => ({ ...prev, [annonce.id]: true }));
    try {
      const annonceRef = doc(firestore, 'services', annonce.id);
      const newSponsorState = !annonce.isSponsored;
      await updateDoc(annonceRef, { isSponsored: newSponsorState });
      toast({
        title: newSponsorState ? "Annonce Sponsorisée !" : "Sponsoring retiré",
        description: `Votre annonce est maintenant ${newSponsorState ? 'mise en avant' : 'standard'}.`,
      });
    } catch (error) {
       console.error("Error updating sponsor status:", error);
       toast({ title: "Erreur", description: "Impossible de modifier le statut de sponsoring.", variant: "destructive" });
    } finally {
      setSponsoringState(prev => ({ ...prev, [annonce.id]: false }));
    }
  };

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
                  <TableRow key={annonce.id} data-state={annonce.isSponsored ? 'selected' : ''}>
                    <TableCell className="font-medium flex items-center gap-2">
                        {annonce.isSponsored && <Star className="h-4 w-4 text-primary" />}
                        {annonce.title}
                    </TableCell>
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
                          <Button variant="ghost" size="icon" disabled={sponsoringState[annonce.id]}>
                             {sponsoringState[annonce.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleToggleSponsor(annonce)}>
                            <Star className="mr-2 h-4 w-4" />
                            {annonce.isSponsored ? 'Retirer le sponsoring' : 'Sponsoriser'}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/gestion/annonces/modifier/${annonce.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setAnnonceToDelete(annonce)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
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
      
      <AlertDialog open={!!annonceToDelete} onOpenChange={(open) => !open && setAnnonceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'annonce "{annonceToDelete?.title}" sera définitivement supprimée
              et toutes les données associées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
