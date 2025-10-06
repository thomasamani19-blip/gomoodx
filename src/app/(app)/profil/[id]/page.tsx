
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { User, Call } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Video } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const userRef = firestore ? doc(firestore, 'users', params.id) : null;
  const { data: user, loading: userLoading } = useDoc<User>(userRef);
  const { toast } = useToast();
  const router = useRouter();


  const isOwnProfile = currentUser?.id === params.id;
  const isFavorite = currentUser?.favorites?.includes(params.id);

  const handleToggleFavorite = async () => {
    if (!currentUser || !firestore) {
        toast({ title: "Vous n'êtes pas connecté", variant: 'destructive'});
        router.push('/connexion');
        return;
    };

    const currentUserRef = doc(firestore, 'users', currentUser.id);

    try {
        if (isFavorite) {
            await updateDoc(currentUserRef, {
                favorites: arrayRemove(params.id)
            });
            toast({ title: `${user?.displayName} a été retiré de vos favoris.`});
        } else {
            await updateDoc(currentUserRef, {
                favorites: arrayUnion(params.id)
            });
            toast({ title: `${user?.displayName} a été ajouté à vos favoris !`});
        }
    } catch (error) {
        console.error("Error updating favorites:", error);
        toast({ title: "Une erreur est survenue.", variant: 'destructive'});
    }
  };
  
    const handleInitiateCall = async () => {
        if (!currentUser || !user || !firestore) return;
        
        toast({ title: "Initiation de l'appel...", description: `Appel avec ${user.displayName} en cours de préparation.` });

        const callData: Omit<Call, 'id'> = {
            callerId: currentUser.id,
            receiverId: user.id,
            callerName: currentUser.displayName,
            status: 'pending',
            type: 'video',
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

  if (!user) {
    return (
        <div>
            <PageHeader title="Profil non trouvé" description="Cet utilisateur n'existe pas ou plus." />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="relative mb-8">
             <div className="h-48 w-full rounded-lg bg-muted overflow-hidden relative">
                <Image
                    src={`https://picsum.photos/seed/${user.id}/1200/400`}
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
                        {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/messagerie?contact=${user.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Message
                      </Link>
                    </Button>
                     {user.role === 'escorte' && (
                        <Button variant="outline" onClick={handleInitiateCall}>
                            <Video className="mr-2 h-4 w-4" /> Appeler
                        </Button>
                     )}
                </div>
            )}
        </div>


        <div className="px-6">
            <Card>
                <CardHeader>
                    <CardTitle>À propos de moi</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{user.bio || "Aucune biographie n'a été ajoutée pour le moment."}</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
