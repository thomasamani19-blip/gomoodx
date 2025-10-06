
'use client';

import { useDoc } from '@/firebase';
import type { User } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Video } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { data: user, loading: userLoading } = useDoc<User>(`users/${params.id}`);
  const firestore = useFirestore();
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

    const userRef = doc(firestore, 'users', currentUser.id);

    try {
        if (isFavorite) {
            await updateDoc(userRef, {
                favorites: arrayRemove(params.id)
            });
            toast({ title: `${user?.displayName} a été retiré de vos favoris.`});
        } else {
            await updateDoc(userRef, {
                favorites: arrayUnion(params.id)
            });
            toast({ title: `${user?.displayName} a été ajouté à vos favoris !`});
        }
    } catch (error) {
        console.error("Error updating favorites:", error);
        toast({ title: "Une erreur est survenue.", variant: 'destructive'});
    }
  };

  if (userLoading || authLoading) {
    return (
        <div>
            <div className="mb-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="mt-2 h-6 w-1/2" />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
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
    <div>
        <div className="relative mb-8">
             <div className="h-48 w-full rounded-lg bg-muted overflow-hidden">
                {/* Placeholder for a banner image */}
                <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{backgroundImage: `url(https://picsum.photos/seed/${user.id}/1200/400)`}}
                 />
            </div>
            <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={user.profileImage} alt={user.displayName} />
                    <AvatarFallback className="text-4xl">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
        </div>
        
        <div className="pt-20 px-6 flex flex-col md:flex-row justify-between items-start gap-4">
             <div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">{user.displayName}</h1>
                <p className="text-lg text-muted-foreground">@{user.pseudo || user.displayName.toLowerCase().replace(/\s/g, '')}</p>
            </div>
            {!isOwnProfile && (
                <div className="flex gap-2">
                    <Button onClick={handleToggleFavorite} variant={isFavorite ? "secondary" : "default"}>
                        <Heart className="mr-2 h-4 w-4" /> 
                        {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </Button>
                    <Button variant="outline"><MessageCircle className="mr-2 h-4 w-4" /> Message</Button>
                     {user.role === 'escorte' && <Button variant="outline"><Video className="mr-2 h-4 w-4" /> Appeler</Button>}
                </div>
            )}
        </div>


        <div className="p-6 mt-8">
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
