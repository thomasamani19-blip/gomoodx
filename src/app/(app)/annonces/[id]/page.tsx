
'use client';

import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { Annonce, User, Review } from '@/lib/types';
import { doc, collection, query, orderBy, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Star, MessageCircle, Heart, Share2, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const ReviewForm = ({ annonceId }: { annonceId: string }) => {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({
                title: "Connexion requise",
                description: "Vous devez être connecté pour laisser un avis.",
                variant: "destructive",
            });
            router.push('/connexion');
            return;
        }

        if (rating === 0 || !comment.trim()) {
            toast({
                title: "Champs incomplets",
                description: "Veuillez donner une note et écrire un commentaire.",
                variant: "destructive",
            });
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            if (!firestore) {
                throw new Error("Firestore is not initialized");
            }
            
            const annonceRef = doc(firestore, 'services', annonceId);
            const reviewRef = doc(collection(annonceRef, 'reviews'));

            await runTransaction(firestore, async (transaction) => {
                 const annonceDoc = await transaction.get(annonceRef);
                if (!annonceDoc.exists()) {
                    throw new Error("Cette annonce n'existe plus !");
                }
                
                const currentData = annonceDoc.data() as Annonce;
                const currentRating = currentData.rating || 0;
                const currentRatingCount = currentData.ratingCount || 0;

                const newRatingCount = currentRatingCount + 1;
                const newTotalRating = (currentRating * currentRatingCount) + rating;
                const newAverageRating = newTotalRating / newRatingCount;

                // Mettre à jour l'annonce
                 transaction.update(annonceRef, {
                    rating: newAverageRating,
                    ratingCount: newRatingCount
                });
                
                // Créer le nouvel avis
                const reviewData = {
                    authorId: user.id,
                    authorName: user.displayName,
                    authorImage: user.profileImage || '',
                    rating,
                    comment,
                    createdAt: serverTimestamp(),
                };
                transaction.set(reviewRef, reviewData);
            });
            
            toast({
                title: "Avis publié !",
                description: "Merci pour votre contribution.",
            });
            setRating(0);
            setComment('');

        } catch (error) {
            console.error("Erreur lors de la publication de l'avis:", error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue. Veuillez réessayer.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Laissez votre avis</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">Votre note</p>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, index) => {
                                const starValue = index + 1;
                                return (
                                    <button
                                        type="button"
                                        key={starValue}
                                        onClick={() => setRating(starValue)}
                                        onMouseEnter={() => setHover(starValue)}
                                        onMouseLeave={() => setHover(rating)}
                                        className="p-1"
                                    >
                                        <Star
                                            className={cn("h-6 w-6 transition-colors", starValue <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <Textarea 
                        placeholder="Rédigez votre commentaire ici..." 
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmitting || authLoading}
                    />
                    <Button type="submit" disabled={isSubmitting || authLoading}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Envoyer l'avis
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function ReviewList({ annonceId }: { annonceId: string }) {
    const firestore = useFirestore();
    const reviewsQuery = useMemo(() => {
        if (!firestore || !annonceId) return null;
        return query(collection(firestore, 'services', annonceId, 'reviews'), orderBy('createdAt', 'desc'));
    }, [firestore, annonceId]);
    
    const { data: reviews, loading } = useCollection<Review>(reviewsQuery);

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Évaluations des membres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-4">
                         <Skeleton className="h-10 w-10 rounded-full" />
                         <div className="space-y-2 flex-1">
                             <Skeleton className="h-4 w-1/4" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                    </div>
                     <div className="flex gap-4">
                         <Skeleton className="h-10 w-10 rounded-full" />
                         <div className="space-y-2 flex-1">
                             <Skeleton className="h-4 w-1/4" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (!reviews || reviews.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Évaluations des membres</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Aucun avis pour cette annonce pour le moment.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Évaluations des membres ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className="flex gap-4">
                        <Avatar>
                            <AvatarImage src={review.authorImage} />
                            <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{review.authorName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {review.createdAt && format(review.createdAt.toDate(), 'd MMMM yyyy', {locale: fr})}
                                </p>
                            </div>
                             <StarRating rating={review.rating} />
                            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function AnnonceDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isReserving, setIsReserving] = useState(false);


  const annonceRef = useMemo(() => firestore ? doc(firestore, 'services', params.id) : null, [firestore, params.id]);
  const { data: annonce, loading: annonceLoading } = useDoc<Annonce>(annonceRef);
  
  // Fetch creator info once we have the annonce data
  const creatorRef = useMemo(() => (annonce?.createdBy && firestore) ? doc(firestore, 'users', annonce.createdBy) : null, [annonce, firestore]);
  const { data: creator, loading: creatorLoading } = useDoc<User>(creatorRef);

  const loading = annonceLoading || creatorLoading;
  
  const handleReservation = async () => {
    if (!user) {
        toast({ title: 'Connexion requise', description: 'Vous devez être connecté pour réserver.', variant: 'destructive'});
        router.push('/connexion');
        return;
    }

    if (user.id === annonce?.createdBy) {
        toast({ title: 'Action impossible', description: 'Vous ne pouvez pas réserver votre propre service.', variant: 'destructive'});
        return;
    }

    setIsReserving(true);

    try {
        const response = await fetch('/api/reservations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                memberId: user.id,
                annonceId: params.id,
                reservationDate: new Date().toISOString(), // Using current date as a placeholder
            }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({
                title: 'Réservation confirmée !',
                description: "Votre réservation a été effectuée avec succès.",
            });
            // Optionnel: rediriger vers une page "Mes réservations"
            // router.push('/mes-reservations');
        } else {
            throw new Error(result.message || 'Une erreur est survenue.');
        }

    } catch (error: any) {
        toast({
            title: 'Échec de la réservation',
            description: error.message || "Impossible de finaliser la réservation. Veuillez réessayer.",
            variant: 'destructive',
        });
    } finally {
        setIsReserving(false);
    }
};


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
  
  const canReserve = creator?.partnerType === 'establishment';


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

                <div className="space-y-6">
                    <ReviewForm annonceId={params.id} />
                    <ReviewList annonceId={params.id} />
                </div>

            </div>
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader className="text-center">
                        <p className="text-4xl font-bold text-primary">{annonce.price} €</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {canReserve ? (
                             <Button size="lg" onClick={handleReservation} disabled={isReserving}>
                                {isReserving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isReserving ? 'Réservation en cours...' : 'Réserver maintenant'}
                            </Button>
                        ) : (
                             <Button size="lg" asChild>
                                <Link href={`/messagerie?contact=${creator?.id}`}>
                                    <MessageCircle className="mr-2 h-4 w-4" /> Contacter
                                </Link>
                            </Button>
                        )}
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
