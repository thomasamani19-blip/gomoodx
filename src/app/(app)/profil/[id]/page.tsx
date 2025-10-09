
'use client';

import { useCollection, useDoc, useFirestore } from '@/firebase';
import type { User, Call, CallType, Annonce, Product, Settings, SubscriptionTier, Reservation } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Video, Phone, ChevronDown, Star, CheckCircle, Banknote, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp, query, where, limit, and, or, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Wallet } from '@/lib/types';


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

const TierCard = ({ tier, isPopular = false, onSubscribe }: { tier: SubscriptionTier, isPopular?: boolean, onSubscribe: (tier: SubscriptionTier) => void }) => (
    <Card className={cn("flex flex-col", isPopular && "border-primary relative ring-2 ring-primary")}>
        {isPopular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Populaire</Badge>}
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">{tier.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <p className="text-center text-4xl font-bold">{tier.price}€<span className="text-lg font-normal text-muted-foreground">/mois</span></p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                {tier.description.split('\n').map((line, i) => <li key={i}>{line}</li>)}
            </ul>
        </CardContent>
        <CardFooter>
            <Button className="w-full" size="lg" variant={isPopular ? "default" : "secondary"} onClick={() => onSubscribe(tier)}>
                <Star className="mr-2 h-4 w-4"/> S'abonner
            </Button>
        </CardFooter>
    </Card>
);

const CreatorAnnonces = ({ creatorId, name }: { creatorId: string, name: string }) => {
    const firestore = useFirestore();
    const annoncesQuery = useMemo(() => firestore ? query(collection(firestore, 'services'), where('createdBy', '==', creatorId), limit(6)) : null, [firestore, creatorId]);
    const { data: annonces, loading } = useCollection<Annonce>(annoncesQuery);

    if (loading) return <Skeleton className="h-48 w-full" />;
    if (!annonces || annonces.length === 0) return null;

    return (
        <Card>
            <CardHeader><CardTitle>Annonces de {name}</CardTitle></CardHeader>
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

const CreatorProducts = ({ creatorId, name }: { creatorId: string, name: string }) => {
    const firestore = useFirestore();
    const productsQuery = useMemo(() => firestore ? query(collection(firestore, 'products'), where('createdBy', '==', creatorId), limit(6)) : null, [firestore, creatorId]);
    const { data: products, loading } = useCollection<Product>(productsQuery);

    if (loading) return <Skeleton className="h-48 w-full" />;
    if (!products || products.length === 0) return null;

    return (
        <Card>
            <CardHeader><CardTitle>Dans la boutique de {name}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                     <Card key={product.id} className="overflow-hidden group">
                        <Link href={`/boutique/${product.id}`} className="block">
                            <div className="relative aspect-video">
                                <Image src={product.imageUrl || ''} alt={product.title} fill className="object-cover transition-transform group-hover:scale-105" />
                            </div>
                            <div className="p-3">
                                <h4 className="font-semibold truncate">{product.title}</h4>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-primary">{product.price} €</span>
                                </div>
                            </div>
                        </Link>
                    </Card>
                ))}
            </CardContent>
        </Card>
    )
}

function SuggestedProfiles({ currentUserId }: { currentUserId: string }) {
    const firestore = useFirestore();
    const suggestionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('role', '==', 'escorte'),
            where('__name__', '!=', currentUserId),
            limit(4)
        );
    }, [firestore, currentUserId]);
    
    const { data: profiles, loading } = useCollection<User>(suggestionsQuery);

    if (loading || !profiles || profiles.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader><CardTitle>Profils similaires</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {profiles.map((profile) => (
                     <Link key={profile.id} href={`/profil/${profile.id}`}>
                        <Card className="overflow-hidden group">
                            <div className="relative aspect-[3/4]">
                                <Image
                                    src={profile.profileImage || `https://picsum.photos/seed/${profile.id}/400/600`}
                                    alt={profile.displayName}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <span className="absolute bottom-4 left-4 font-headline text-2xl text-white drop-shadow-md">
                                    {profile.displayName}
                                </span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}

const AdminInfoCard = ({ userId }: { userId: string }) => {
    const firestore = useFirestore();
    const walletRef = useMemo(() => firestore ? doc(firestore, 'wallets', userId) : null, [firestore, userId]);
    const { data: wallet, loading } = useDoc<Wallet>(walletRef);

    if (loading) {
        return <Card><CardHeader><CardTitle>Informations Administrateur</CardTitle></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
    }

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Informations Administrateur</CardTitle>
                <CardDescription>Cette section n'est visible que par l'administration.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Banknote className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">Solde du Portefeuille</p>
                        <p className="text-lg font-bold">{wallet?.balance.toFixed(2) || '0.00'} €</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


const CreatorProfile = ({ user, isOwnProfile }: { user: User, isOwnProfile: boolean }) => {
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const isFavorite = currentUser?.favorites?.includes(user.id);
    const isAdmin = currentUser?.role === 'founder' || currentUser?.role === 'administrateur';
    
    const [callConfirmation, setCallConfirmation] = useState<{ show: boolean; type: CallType | null, isFree?: boolean, price?: number }>({ show: false, type: null, isFree: false, price: 0 });
    const [showContactPassDialog, setShowContactPassDialog] = useState(false);
    const [isBuyingPass, setIsBuyingPass] = useState(false);
    
    const [subscriptionDialog, setSubscriptionDialog] = useState<{ open: boolean, tier: SubscriptionTier | null }>({ open: false, tier: null });
    const [subscriptionDuration, setSubscriptionDuration] = useState(1);
    const [isSubscribing, setIsSubscribing] = useState(false);

    
    const settingsRef = useMemo(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: globalSettings } = useDoc<Settings>(settingsRef);

    const subscriptionTiers = useMemo(() => {
        if (!user.subscriptionSettings?.enabled) return [];
        return Object.values(user.subscriptionSettings.tiers).filter(t => t.isActive).sort((a,b) => a.price - b.price);
    }, [user.subscriptionSettings]);

    const handleToggleFavorite = async () => {
        if (!currentUser || !firestore) {
            toast({ title: "Vous n'êtes pas connecté", variant: 'destructive'});
            router.push('/connexion');
            return;
        };
        const currentUserRef = doc(firestore, 'users', currentUser.id);
        try {
            if (isFavorite) {
                await updateDoc(currentUserRef, { favorites: arrayRemove(user.id) });
                toast({ title: `${user.displayName} a été retiré de vos favoris.`});
            } else {
                await updateDoc(currentUserRef, { favorites: arrayUnion(user.id) });
                toast({ title: `${user.displayName} a été ajouté à vos favoris !`});
            }
        } catch (error) {
            console.error("Error updating favorites:", error);
            toast({ title: "Une erreur est survenue.", variant: 'destructive'});
        }
    };
  
    const confirmCall = async (type: CallType) => {
        if (!currentUser || !firestore) return;

        let price = 0;
        let isFree = false;

        if (type === 'voice') {
            // Check for active confirmed reservation first
            const reservationsQuery = query(
                collection(firestore, 'reservations'),
                where('status', '==', 'confirmed'),
                or(
                    and(where('memberId', '==', currentUser.id), where('creatorId', '==', user.id)),
                    and(where('memberId', '==', user.id), where('creatorId', '==', currentUser.id))
                )
            );
            const reservationsSnapshot = await getDocs(reservationsQuery);
            const hasActiveReservation = reservationsSnapshot.docs.some(doc => 
                (doc.data().reservationDate.toDate().getTime() + (doc.data().durationHours || 0) * 3600 * 1000) > Date.now()
            );

            if (hasActiveReservation) {
                isFree = true;
            } else {
                // If no active reservation, check daily quota
                const FREE_QUOTA_MINUTES = 60;
                const lastReset = currentUser.dailyVoiceCallQuota?.lastReset.toDate();
                const now = new Date();
                let quotaUsed = currentUser.dailyVoiceCallQuota?.minutesUsed || 0;

                if (!lastReset || now.toDateString() !== lastReset.toDateString()) {
                    quotaUsed = 0;
                }

                if (quotaUsed < FREE_QUOTA_MINUTES) {
                    isFree = true;
                } else {
                    price = globalSettings?.callRates?.voicePerMinute || 0;
                }
            }
        } else if (type === 'video') {
            price = user.rates?.videoCallPerMinute || 0;
        }

        setCallConfirmation({ show: true, type, isFree, price });
    };

    const handleInitiateCall = async () => {
        if (!currentUser || !user || !firestore || !callConfirmation.type) return;

        const callType = callConfirmation.type;
        setCallConfirmation({ show: false, type: null });

        toast({ title: "Initiation de l'appel...", description: `Appel ${callType === 'video' ? 'vidéo' : 'vocal'} avec ${user.displayName} en cours de préparation.` });
        
        const callData: Omit<Call, 'id'> = {
            callerId: currentUser.id,
            receiverId: user.id,
            callerName: currentUser.displayName || 'Utilisateur',
            status: 'pending',
            type: callType,
            createdAt: serverTimestamp() as any,
            isFreeCall: callConfirmation.isFree,
            pricePerMinute: callConfirmation.price,
        };
        try {
            const callDocRef = await addDoc(collection(firestore, 'calls'), callData);
            router.push(`/appels/${callDocRef.id}`);
        } catch (error) {
            console.error("Erreur lors de l'initiation de l'appel :", error);
             toast({ title: "Erreur lors de l'initiation de l'appel", variant: 'destructive'});
        }
    };
    
    const handleContact = () => {
        if (!currentUser || !user) {
            toast({ title: 'Connexion requise', variant: 'destructive' });
            router.push('/connexion');
            return;
        }
        // Logic for free contact
        router.push(`/messagerie?contact=${user.id}`);
    };

    const handleOpenSubscriptionDialog = (tier: SubscriptionTier) => {
        if (!currentUser) {
            toast({ title: 'Connexion requise', description: 'Vous devez vous connecter pour vous abonner.', variant: 'destructive'});
            router.push('/connexion');
            return;
        }
        setSubscriptionDialog({ open: true, tier });
    };

    const handleSubscription = async () => {
        if (!currentUser || !subscriptionDialog.tier) return;
        setIsSubscribing(true);

        try {
            const response = await fetch('/api/subscriptions/create-creator-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    memberId: currentUser.id, 
                    creatorId: user.id, 
                    tierId: subscriptionDialog.tier.id,
                    durationMonths: subscriptionDuration,
                }),
            });
            const result = await response.json();
            if (result.status === 'success') {
                toast({ title: 'Abonnement réussi !', description: `Vous êtes maintenant abonné(e) à ${user.displayName}.` });
            } else {
                throw new Error(result.message || "Une erreur est survenue.");
            }
        } catch (error: any) {
            toast({ title: "Erreur d'abonnement", description: error.message, variant: "destructive" });
        } finally {
            setIsSubscribing(false);
            setSubscriptionDialog({ open: false, tier: null });
        }
    };
    
    const calculateTotalPrice = () => {
        if (!subscriptionDialog.tier) return 0;
        const tier = subscriptionDialog.tier;
        let totalPrice = tier.price * subscriptionDuration;
        let discount = 0;
        
        if (subscriptionDuration === 3 && tier.discounts?.quarterly) discount = tier.discounts.quarterly;
        else if (subscriptionDuration === 6 && tier.discounts?.semiAnnual) discount = tier.discounts.semiAnnual;
        else if (subscriptionDuration === 12 && tier.discounts?.annual) discount = tier.discounts.annual;
        
        if (discount > 0) {
            totalPrice = totalPrice * (1 - discount / 100);
        }
        
        return totalPrice.toFixed(2);
    };

    return (
        <>
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
                    <p className="text-lg text-muted-foreground">@{user.pseudo || user.displayName.toLowerCase().replace(/\s/g, '')}</p>
                </div>
                {!isOwnProfile && currentUser && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleToggleFavorite} variant={isFavorite ? "secondary" : "default"}>
                            <Heart className="mr-2 h-4 w-4" /> 
                            {isFavorite ? 'Retiré des favoris' : 'Ajouter aux favoris'}
                        </Button>
                         <Button variant="outline" asChild>
                            <Link href={`/reservations/creer/${user.id}`}>
                                <Calendar className="mr-2 h-4 w-4" /> Prendre rendez-vous
                            </Link>
                        </Button>
                         <Button variant="outline" onClick={handleContact}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Message
                        </Button>
                         {(user.role === 'escorte' || user.partnerType === 'producer') && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Phone className="mr-2 h-4 w-4" /> Appeler <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => confirmCall('video')}>
                                        <Video className="mr-2 h-4 w-4" />
                                        Appel Vidéo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => confirmCall('voice')}>
                                        <Phone className="mr-2 h-4 w-4" />
                                        Appel Vocal
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         )}
                    </div>
                )}
            </div>

            <div className="px-6 grid md:grid-cols-3 gap-8">
               <div className="md:col-span-3 flex flex-col gap-8">
                    
                    {isAdmin && !isOwnProfile && <AdminInfoCard userId={user.id} />}

                    <Card>
                        <CardHeader><CardTitle>À propos de moi</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{user.bio || "Aucune biographie."}</p></CardContent>
                    </Card>

                    {subscriptionTiers.length > 0 && !isOwnProfile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Soutenir {user.displayName}</CardTitle>
                                <CardDescription>Abonnez-vous pour accéder à des avantages exclusifs.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {subscriptionTiers.map((tier, index) => (
                                    <TierCard key={tier.id} tier={tier} isPopular={index === 1} onSubscribe={handleOpenSubscriptionDialog}/>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <CreatorAnnonces creatorId={user.id} name={user.displayName} />

                    <CreatorProducts creatorId={user.id} name={user.displayName} />
                    
                    <Card>
                        <CardHeader><CardTitle>Galerie</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(user.galleryImages && user.galleryImages.length > 0) ? (
                                user.galleryImages.map((imgUrl, i) => (
                                    <div key={i} className="aspect-square relative rounded-md overflow-hidden group">
                                        <Image src={imgUrl} alt={`Galerie ${i+1}`} fill className="object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                ))
                            ) : (
                                Array.from({length: 4}).map((_, i) => (
                                    <div key={i} className="aspect-square relative rounded-md overflow-hidden group bg-muted">
                                        <Image src={`https://picsum.photos/seed/${user.id}-gallery${i}/400/400`} alt={`Galerie ${i+1}`} fill className="object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                    <SuggestedProfiles currentUserId={user.id} />
               </div>
            </div>
        </div>
        
        {/* Subscription Confirmation Dialog */}
        <AlertDialog open={subscriptionDialog.open} onOpenChange={(open) => setSubscriptionDialog({ open, tier: null })}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>S'abonner à "{subscriptionDialog.tier?.name}"</AlertDialogTitle>
                    <AlertDialogDescription>Choisissez votre durée d'engagement. Le montant sera débité de votre portefeuille.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <RadioGroup defaultValue="1" onValueChange={(value) => setSubscriptionDuration(Number(value))}>
                        <div className="grid grid-cols-2 gap-2">
                             {[
                                { duration: 1, label: "1 Mois" },
                                { duration: 3, label: "3 Mois" },
                                { duration: 6, label: "6 Mois" },
                                { duration: 12, label: "1 An" }
                             ].map(d => {
                                const tier = subscriptionDialog.tier;
                                let discount = 0;
                                if (d.duration === 3) discount = tier?.discounts?.quarterly || 0;
                                else if (d.duration === 6) discount = tier?.discounts?.semiAnnual || 0;
                                else if (d.duration === 12) discount = tier?.discounts?.annual || 0;
                                
                                return (
                                <div key={d.duration}>
                                    <RadioGroupItem value={d.duration.toString()} id={`d-${d.duration}`} className="peer sr-only" />
                                    <Label
                                        htmlFor={`d-${d.duration}`}
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span className="font-bold">{d.label}</span>
                                        {discount > 0 && <Badge variant="secondary" className="mt-1">{discount}% OFF</Badge>}
                                    </Label>
                                </div>
                             )})}
                        </div>
                    </RadioGroup>
                    <div className="text-center font-bold text-2xl">
                        Total : {calculateTotalPrice()}€
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubscribing}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubscription} disabled={isSubscribing}>
                        {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer l'Abonnement
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={callConfirmation.show} onOpenChange={(open) => setCallConfirmation({show: open, type: null})}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer l'appel</AlertDialogTitle>
                    <AlertDialogDescription>
                        {callConfirmation.isFree ?
                            `Lancer un appel vocal gratuit avec ${user.displayName} ?` :
                            `Lancer un appel ${callConfirmation.type === 'video' ? 'vidéo' : 'vocal'} avec ${user.displayName} ? Cet appel sera facturé ${callConfirmation.price}€ par minute.`
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleInitiateCall}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};

const MemberProfile = ({ user, isOwnProfile }: { user: User, isOwnProfile: boolean }) => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'founder' || currentUser?.role === 'administrateur';
    return (
      <div className="flex flex-col items-center pt-16 gap-8">
        {isAdmin && !isOwnProfile && <AdminInfoCard userId={user.id} />}
        <Avatar className="h-40 w-40 border-4 border-primary mb-6">
          <AvatarImage src={user.profileImage} alt={user.displayName} />
          <AvatarFallback className="text-5xl">{user.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="font-headline text-4xl font-bold tracking-tight">{user.displayName}</h1>
        <p className="text-lg text-muted-foreground">@{user.pseudo || user.displayName.toLowerCase().replace(/\s/g, '')}</p>
        {!isOwnProfile && (
           <div className="mt-8">
            <Button asChild>
                <Link href={`/messagerie?contact=${user.id}`}>
                    <MessageCircle className="mr-2 h-4 w-4" /> Envoyer un message
                </Link>
            </Button>
           </div>
        )}
      </div>
    );
  };
  

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const userRef = firestore ? doc(firestore, 'users', params.id) : null;
  const { data: user, loading: userLoading } = useDoc<User>(userRef);
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
            <div className="pt-20 px-6"><Skeleton className="h-10 w-1/3 mb-2" /></div>
        </div>
    );
  }

  if (!user) {
    return <PageHeader title="Profil non trouvé" description="Cet utilisateur n'existe pas." />;
  }

  // Handle partners redirecting to their specific profile page
  if (user.role === 'partenaire' && user.partnerType === 'establishment') {
      router.replace(`/partenaire/${user.id}`);
      return (
         <div className="space-y-8">
            <div className="relative mb-8">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                </div>
            </div>
            <div className="pt-20 px-6"><p>Redirection...</p></div>
        </div>
      )
  }

  if (user.role === 'client') {
    return <MemberProfile user={user} isOwnProfile={isOwnProfile} />;
  }
  
  // Default to creator/producer profile view
  return <CreatorProfile user={user} isOwnProfile={isOwnProfile} />;
}
