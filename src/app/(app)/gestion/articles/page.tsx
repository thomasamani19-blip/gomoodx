'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { BlogArticle } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
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

export default function GestionArticlesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Pour l'instant, on récupère tous les articles. On pourra filtrer par auteur plus tard.
  const articlesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'blog'),
      orderBy('date', 'desc')
    );
  }, [firestore]);

  const { data: articles, loading: articlesLoading } = useCollection<BlogArticle>(articlesQuery);

  const loading = authLoading || articlesLoading;

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          title="Gérer mes Articles de Blog"
          description="Rédigez, modifiez et publiez vos articles pour votre audience."
        />
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Écrire un article
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
          {!loading && (!articles || articles.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Vous n'avez écrit aucun article pour le moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
