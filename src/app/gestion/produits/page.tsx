
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useStorage, useDoc } from '@/firebase';
import type { Product, Wallet } from '@/lib/types';
import { collection, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useMemo, useState } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SPONSOR_COST = 10;

export default function GestionProduitsPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [isConfirmingSponsor, setIsConfirmingSponsor] = useState(false);
  const [productToSponsor, setProductToSponsor] = useState<Product | null>(null);
  const [isSponsoring, setIsSponsoring] = useState(false);

  const walletRef = useMemo(() => user && firestore ? doc(firestore, 'wallets', user.id) : null, [user, firestore]);
  const { data: wallet, loading: walletLoading } = useDoc<Wallet>(walletRef);

  const produitsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'products'),
      where('createdBy', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: produits, loading: produitsLoading, setData: setProduits } = useCollection<Product>(produitsQuery);

  const loading = authLoading || produitsLoading || walletLoading;
  
  const handleDelete = async () => {
    if (!productToDelete || !firestore || !storage) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'products', productToDelete.id));

      if (productToDelete.imageUrl && !productToDelete.imageUrl.includes('picsum.photos')) {
        try {
            const imageRef = ref(storage, productToDelete.imageUrl);
            await deleteObject(imageRef);
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.warn("Could not delete image from storage:", storageError.message);
            }
        }
      }

      setProduits(prev => prev?.filter(p => p.id !== productToDelete.id) || null);

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });

    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleSponsorConfirm = async () => {
    if (!productToSponsor || !user) return;
    
    setIsSponsoring(true);
    try {
        const response = await fetch('/api/content/sponsor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: user.id,
                contentId: productToSponsor.id,
                contentType: 'product' 
            }),
        });

        const result = await response.json();
        if (response.ok && result.status === 'success') {
            setProduits(prev => prev?.map(p => p.id === productToSponsor.id ? { ...p, isSponsored: true } : p) || null);
            toast({
                title: "Produit Sponsorisé !",
                description: `Votre produit "${productToSponsor.title}" est maintenant mis en avant.`,
            });
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }

    } catch (error: any) {
       console.error("Error sponsoring content:", error);
       toast({ title: "Erreur de Sponsorisation", description: error.message, variant: "destructive" });
    } finally {
      setIsSponsoring(false);
      setIsConfirmingSponsor(false);
      setProductToSponsor(null);
    }
  };

  const openSponsorDialog = (product: Product) => {
    if ((wallet?.balance || 0) < SPONSOR_COST) {
        toast({
            title: "Solde insuffisant",
            description: `Vous avez besoin de ${SPONSOR_COST}€ pour sponsoriser. Votre solde est de ${wallet?.balance.toFixed(2) || 0}€.`,
            variant: "destructive",
        });
        return;
    }
    setProductToSponsor(product);
    setIsConfirmingSponsor(true);
  };
  
  const isSponsorshipActive = (product: Product) => {
      return product.isSponsored && product.sponsorshipExpiresAt && product.sponsorshipExpiresAt.toDate() > new Date();
  };

  return (
    <TooltipProvider>
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
                  {produits && produits.map(produit => {
                    const isSponsoredAndActive = isSponsorshipActive(produit);
                    const expiration = produit.sponsorshipExpiresAt ? formatDistanceToNowStrict(produit.sponsorshipExpiresAt.toDate(), { locale: fr, addSuffix: true }) : '';
                    
                    return (
                    <TableRow key={produit.id} data-state={produit.isSponsored ? 'selected' : ''}>
                      <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                              {produit.isSponsored && <Star className="h-4 w-4 text-primary" />}
                              <Image 
                                  src={produit.imageUrl || `https://picsum.photos/seed/${produit.id}/50/50`}
                                  alt={produit.title}
                                  width={40}
                                  height={40}
                                  className="rounded-md object-cover"
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
                            {!isSponsoredAndActive && (
                                  <DropdownMenuItem onClick={() => openSponsorDialog(produit)}>
                                      <Star className="mr-2 h-4 w-4" />
                                      Sponsoriser
                                  </DropdownMenuItem>
                              )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuItem asChild disabled={isSponsoredAndActive}>
                                      <Link href={`/gestion/produits/modifier/${produit.id}`}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Modifier
                                      </Link>
                                    </DropdownMenuItem>
                                </TooltipTrigger>
                                {isSponsoredAndActive && (
                                  <TooltipContent>
                                    <p>Modification bloquée jusqu'à la fin du sponsoring ({expiration}).</p>
                                  </TooltipContent>
                                )}
                            </Tooltip>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setProductToDelete(produit)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})}
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
        
        <AlertDialog open={isConfirmingSponsor} onOpenChange={setIsConfirmingSponsor}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la Sponsorisation</AlertDialogTitle>
              <AlertDialogDescription>
                Mettre en avant le produit "{productToSponsor?.title}" coûtera <span className="font-bold">{SPONSOR_COST}€</span>, qui seront débités de votre portefeuille.
                Votre solde actuel est de <span className="font-bold">{wallet?.balance?.toFixed(2) || 0}€</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSponsoring}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleSponsorConfirm} disabled={isSponsoring}>
                {isSponsoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer et Payer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le produit "{productToDelete?.title}" sera définitivement supprimé.
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
    </TooltipProvider>
  );
}
