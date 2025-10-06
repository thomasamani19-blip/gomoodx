
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { Annonce, User } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Star, MessageCircle, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Copié depuis annonces/page.tsx
const StarRating = ({ rating, ratingCount, className }: { rating: number, ratingCount?: number, className?: string }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ))}
            {halfStar && <Star key="half" className="h-5 w-5 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
            ))}
             {ratingCount !== undefined && (
                <span className="text-sm text-muted-foreground ml-2">({ratingCount} avis)</span>
            )}
        </div>
    );
};

export default function AnnonceDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const annonceRef = doc(firestore, 'services', params.id);
  const { data: annonce, loading: annonceLoading } = useDoc<Annonce>(annonceRef);
  
  // Fetch creator info once we have the annonce data
  const creatorRef = annonce?.createdBy ? doc(firestore, 'users', annonce.createdBy) : null;
  const { data: creator, loading: creatorLoading } = useDoc<User>(creatorRef);

  const loading = annonceLoading || creatorLoading;

  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="w-full h-96 rounded-lg" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!annonce) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Annonce non trouvée</h2>
        <p className="text-muted-foreground">Cette annonce n'existe pas ou a été supprimée.</p>
        <Button asChild className="mt-4">
            <Link href="/annonces">Retour aux annonces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
             <Image
                src={annonce.imageUrl || 'https://picsum.photos/seed/annonce-detail/1200/400'}
                alt={annonce.title}
                fill
                className="object-cover"
                data-ai-hint={annonce.imageHint}
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-24">
            <div className="md:col-span-2 space-y-6">
                <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl lg:text-4xl font-headline">{annonce.title}</CardTitle>
                        <div className="flex items-center pt-2">
                             <StarRating rating={annonce.rating} ratingCount={annonce.ratingCount} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{annonce.description}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Évaluations et Commentaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Le formulaire pour laisser un avis et la liste des avis apparaîtront ici.</p>
                    </CardContent>
                </Card>

            </div>
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader className="text-center">
                        <p className="text-4xl font-bold text-primary">{annonce.price} €</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                         <Button size="lg">Réserver maintenant</Button>
                         <Button size="lg" variant="outline"><MessageCircle className="mr-2 h-4 w-4" /> Contacter</Button>
                    </CardContent>
                 </Card>
                 {creator && (
                    <Card>
                        <CardHeader>
                             <CardTitle>Proposé par</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={creator.profileImage} alt={creator.displayName} />
                                    <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <Link href={`/profil/${creator.id}`} className="font-bold hover:underline">{creator.displayName}</Link>
                                    <p className="text-sm text-muted-foreground capitalize">{creator.role}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" className="flex-1"><Heart className="mr-2 h-4 w-4" /> Suivre</Button>
                                <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}
