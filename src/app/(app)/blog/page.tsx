
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useFirestore } from '@/firebase';
import type { BlogArticle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BlogPage() {
  const firestore = useFirestore();
  const articlesQuery = useMemo(() => firestore ? query(collection(firestore, 'blog'), orderBy('date', 'desc')) : null, [firestore]);
  const { data: articles, loading } = useCollection<BlogArticle>(articlesQuery);

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Lisez les derniers articles de nos créateurs."
      />
      
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-56" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-3/4 mt-1" />
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && articles && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden group flex flex-col">
              <Link href={`/blog/${article.id}`} className="block">
                <div className="relative aspect-video">
                  <Image
                    src={article.imageUrl || 'https://picsum.photos/seed/blog/600/400'}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={article.imageHint}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </Link>
              <CardContent className="p-6 flex flex-col flex-1">
                 <p className="text-sm text-muted-foreground mb-2">
                    {article.date ? format(article.date.toDate(), "d MMMM yyyy", { locale: fr }) : 'Date inconnue'}
                </p>
                <h3 className="font-headline text-xl font-semibold mb-3 flex-1">
                  <Link href={`/blog/${article.id}`} className="hover:text-primary transition-colors">{article.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{article.content}</p>
                <Button variant="link" asChild className="p-0 mt-auto self-start">
                    <Link href={`/blog/${article.id}`}>Lire la suite <ArrowRight className="ml-2 h-4 w-4" /></Link>
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (!articles || articles.length === 0) && (
         <Card>
            <CardContent className="pt-6">
            <p className="text-muted-foreground">
                Aucun article de blog n'est disponible pour le moment.
            </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

