
'use client';

import { useDoc, useFirestore, useCollection } from '@/firebase';
import type { User, Annonce } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// StarRating component copied from annonces/page.tsx
const StarRating = ({ rating, ratingCount, className }: { rating: number, ratingCount?: number, className?: string }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            ))}
            {halfStar && <Star key="half" className="h-4 w-4 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
            ))}
             {ratingCount !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">({ratingCount})</span>
            )}
        </div>
    );
};


const EstablishmentAnnonces = ({ partnerId, name }: { partnerId: string, name: string }) => {
    const firestore = useFirestore();
    const annoncesQuery = useMemo(() => firestore ? query(collection(firestore, 'services'), where('createdBy', '==', partnerId), limit(6)) : null, [firestore, partnerId]);
    const { data: annonces, loading } = useCollection<Annonce>(annoncesQuery);

    if (loading) return <Skeleton className="h-48 w-full" />;
    if (!annonces || annonces.length === 0) return null;

    return (
        <Card>
            <CardHeader><CardTitle>Services proposés par {name}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {annonces.map(annonce => (
                    <Card key={annonce.id} className="overflow-hidden group">
                        <Link href={`/annonces/${annonce.id}`} className="block">
                            <div className="relative aspect-video">
                                <Image src={annonce.imageUrl || ''} alt={annonce.title} fill className="object-cover transition-transform group-hover:scale-105" />
                            </div>
                            <div className="p-3">
                                <h4 className="font-semibold truncate">{annonce.title}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-primary">{annonce.price} €</span>
                                    <StarRating rating={annonce.rating} ratingCount={annonce.ratingCount} />
                                </div>
                            </div>
                        </Link>
                    </Card>
                ))}
            </CardContent>
        </Card>
    )
}

export default function PartnerProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const userRef = firestore ? doc(firestore, 'users', params.id) : null;
  const { data: user, loading: userLoading } = useDoc<User>(userRef);
  const { toast } = useToast();
  const router = useRouter();

  const isOwnProfile = currentUser?.id === params.id;

  if (userLoading || authLoading) {
    return (
        <div className="space-y-8">
            <div className="relative mb-8">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                </div>
            </div>
            <div className="pt-20 px-6">
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-6 w-1/4" />
            </div>
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full mt-2" />
                        <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  if (!user || user.role !== 'partenaire' || user.partnerType !== 'establishment') {
    return (
        <div>
            <PageHeader title="Profil non trouvé" description="Ce partenaire n'existe pas ou n'est pas un établissement." />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="relative mb-8">
             <div className="h-48 w-full rounded-lg bg-muted overflow-hidden relative">
                <Image
                    src={user.bannerImage || `https://picsum.photos/seed/${user.id}/1200/400`}
                    alt={`Bannière de ${user.displayName}`}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={user.profileImage} alt={user.displayName} />
                    <AvatarFallback className="text-4xl">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
        </div>
        
        <div className="pt-16 px-6 flex flex-col md:flex-row justify-between items-start gap-4">
             <div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">{user.displayName}</h1>
                <p className="text-lg text-muted-foreground capitalize">{user.partnerType === 'establishment' ? 'Établissement' : 'Producteur'}</p>
            </div>
            {!isOwnProfile && currentUser && (
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/messagerie?contact=${user.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Contacter
                      </Link>
                    </Button>
                </div>
            )}
        </div>


        <div className="px-6 grid md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>À propos de nous</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">{user.bio || "Aucune description n'a été ajoutée pour le moment."}</p>
                    </CardContent>
                </Card>

                {user.partnerType === 'establishment' && <EstablishmentAnnonces partnerId={user.id} name={user.displayName} />}

                 <Card>
                    <CardHeader>
                        <CardTitle>Galerie</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {(user.galleryImages && user.galleryImages.length > 0) ? (
                                user.galleryImages.map((imgUrl, i) => (
                                    <div key={i} className="aspect-square relative rounded-md overflow-hidden group">
                                        <Image src={imgUrl} alt={`Galerie ${i+1}`} fill className="object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                ))
                            ) : (
                                Array.from({length: 6}).map((_, i) => (
                                     <div key={i} className="aspect-square relative rounded-md overflow-hidden group bg-muted">
                                        <Image src={`https://picsum.photos/seed/${user.id}-gallery${i}/400/400`} alt={`Galerie ${i+1}`} fill className="object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                ))
                            )}
                    </CardContent>
                </Card>
           </div>
            <div className="md:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <h4 className="font-medium">Localisation</h4>
                                <p className="text-sm text-muted-foreground">{user.location || "Non spécifiée"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
