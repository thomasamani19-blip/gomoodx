
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore, useStorage } from '@/firebase';
import type { BlogArticle } from '@/lib/types';
import { collection, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useMemo, useState } from 'react';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, PlusCircle, Trash2, Loader2, Pencil } from 'lucide-react';
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
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function GestionArticlesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<BlogArticle | null>(null);

  const articlesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'blog'),
      where('authorId', '==', user.id),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const { data: articles, loading: articlesLoading } = useCollection<BlogArticle>(articlesQuery);

  const loading = authLoading || articlesLoading;

  const handleDelete = async () => {
    if (!articleToDelete || !firestore || !storage) return;

    setIsDeleting(true);
    try {
      // Delete Firestore document
      await deleteDoc(doc(firestore, 'blog', articleToDelete.id));

      // Delete image from Storage if it exists and is not a placeholder
      if (articleToDelete.imageUrl && !articleToDelete.imageUrl.includes('picsum.photos')) {
        try {
            const imageRef = ref(storage, articleToDelete.imageUrl);
            await deleteObject(imageRef);
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.warn("Could not delete image from storage:", storageError.message);
            }
        }
      }

      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès.",
      });

    } catch (error) {
      console.error("Error deleting article:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setArticleToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          title="Gérer mes Articles de Blog"
          description="Rédigez, modifiez et publiez vos articles pour votre audience."
        />
        <Button asChild>
            <Link href="/outils-ia/generer-article">
              <PlusCircle className="mr-2 h-4 w-4" />
              Écrire un article (avec IA)
            </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mes Articles</CardTitle>
          <CardDescription>
            {loading ? 'Chargement de vos articles...' : `Vous avez publié ${articles?.length || 0} article(s).`}
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
                  <TableHead>Titre de l'article</TableHead>
                  <TableHead>Date de publication</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles && articles.map(article => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Image 
                                src={article.imageUrl || `https://picsum.photos/seed/${article.id}/50/50`}
                                alt={article.title}
                                width={40}
                                height={40}
                                className="rounded-md object-cover"
                            />
                            <span>{article.title}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      {article.date ? format(article.date.toDate(), 'd MMMM yyyy', { locale: fr }) : 'N/A'}
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
                            <Link href={`/gestion/articles/modifier/${article.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setArticleToDelete(article)}>
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
          {!loading && (!articles || articles.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Vous n'avez écrit aucun article pour le moment.</p>
               <Button asChild className="mt-4">
                 <Link href="/outils-ia/generer-article">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Écrire mon premier article
                 </Link>
               </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article "{articleToDelete?.title}" sera définitivement supprimé.
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
