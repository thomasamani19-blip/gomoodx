

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import type { User } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { where, query, collection } from 'firebase/firestore';
import { useMemo } from 'react';

export default function FavorisPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  // Get favorite creator IDs from the user object, if they exist
  const favoriteIds = user?.favorites && user.favorites.length > 0 ? user.favorites : null;

  // Query to fetch the full profiles of favorite creators.
  const favoriteCreatorsQuery = useMemo(() => {
    // The 'in' query requires a non-empty array and Firestore instance.
    if (!favoriteIds || !firestore) return null;
    return query(collection(firestore, 'users'), where('__name__', 'in', favoriteIds));
  }, [favoriteIds, firestore]);

  
  const { data: favoriteCreators, loading: creatorsLoading } = useCollection<User>(
    favoriteCreatorsQuery
  );
  
  // The overall loading state depends on auth and, if there are favorites, the creators query.
  const loading = authLoading || (favoriteIds ? creatorsLoading : false);

  return (
    <div>
      <PageHeader
        title="Mes Favoris"
        description="Retrouvez ici tous les créateurs que vous avez ajoutés à vos favoris."
      />

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full aspect-[3/4]" />
            </Card>
          ))}
        </div>
      )}
      
      {!loading && favoriteCreators && favoriteCreators.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteCreators.map((creator) => (
                <Card key={creator.id} className="overflow-hidden group">
                    <Link href={`/profil/${creator.id}`}>
                        <div className="relative aspect-[3/4]">
                            <Image
                                src={creator.profileImage || `https://picsum.photos/seed/${creator.id}/400/600`}
                                alt={creator.displayName}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                             <span className="absolute bottom-4 left-4 font-headline text-2xl text-white drop-shadow-md">
                                {creator.displayName}
                             </span>
                        </div>
                    </Link>
                </Card>
            ))}
        </div>
      )}

      {!loading && (!favoriteCreators || favoriteCreators.length === 0) && (
        <Card>
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-xl font-semibold">Votre liste de favoris est vide</h3>
                <p className="text-muted-foreground mt-2 mb-4">Parcourez les profils des créateurs et ajoutez-les pour les retrouver facilement ici.</p>
                <Button asChild>
                    <Link href="/annonces">Découvrir des créateurs</Link>
                </Button>
            </div>
        </Card>
      )}

    </div>
  );
}
