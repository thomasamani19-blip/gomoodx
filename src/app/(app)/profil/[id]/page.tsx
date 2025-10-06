

'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { User, Call, CallType } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Video, Phone, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const CreatorProfile = ({ user, isOwnProfile }: { user: User, isOwnProfile: boolean }) => {
    const { user: currentUser } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const isFavorite = currentUser?.favorites?.includes(user.id);

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
  
    const handleInitiateCall = async (type: CallType) => {
        if (!currentUser || !user || !firestore) return;
        toast({ title: "Initiation de l'appel...", description: `Appel ${type === 'video' ? 'vidéo' : 'vocal'} avec ${user.displayName} en cours de préparation.` });
        const callData: Omit<Call, 'id'> = {
            callerId: currentUser.id,
            receiverId: user.id,
            callerName: currentUser.displayName,
            status: 'pending',
            type: type,
            createdAt: serverTimestamp(),
        };
        try {
            const callDocRef = await addDoc(collection(firestore, 'calls'), callData);
            router.push(`/appels/${callDocRef.id}`);
        } catch (error) {
            console.error("Erreur lors de l'initiation de l'appel :", error);
             toast({ title: "Erreur lors de l'initiation de l'appel", variant: 'destructive'});
        }
    };

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
                    <p className="text-lg text-muted-foreground">@{user.pseudo || user.displayName.toLowerCase().replace(/\s/g, '')}</p>
                </div>
                {!isOwnProfile && currentUser && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleToggleFavorite} variant={isFavorite ? "secondary" : "default"}>
                            <Heart className="mr-2 h-4 w-4" /> 
                            {isFavorite ? 'Retiré des favoris' : 'Ajouter aux favoris'}
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/messagerie?contact=${user.id}`}>
                            <MessageCircle className="mr-2 h-4 w-4" /> Message
                          </Link>
                        </Button>
                         {user.role === 'escorte' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Phone className="mr-2 h-4 w-4" /> Appeler <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleInitiateCall('video')}>
                                        <Video className="mr-2 h-4 w-4" />
                                        Appel Vidéo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleInitiateCall('voice')}>
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
               <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><CardTitle>À propos de moi</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{user.bio || "Aucune biographie."}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Galerie</CardTitle></CardHeader>
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
               <div className="md:col-span-1 space-y-8"></div>
            </div>
        </div>
    );
};

const MemberProfile = ({ user, isOwnProfile }: { user: User, isOwnProfile: boolean }) => {
    return (
      <div className="flex flex-col items-center pt-16">
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

  if (user.role === 'client') {
    return <MemberProfile user={user} isOwnProfile={isOwnProfile} />;
  }
  
  // Default to creator/partner profile view
  return <CreatorProfile user={user} isOwnProfile={isOwnProfile} />;
}
