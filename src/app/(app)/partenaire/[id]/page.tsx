
'use client';

import { useDoc, useFirestore } from '@/firebase';
import type { User } from '@/lib/types';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

  if (!user || user.role !== 'partenaire') {
    return (
        <div>
            <PageHeader title="Profil non trouvé" description="Ce partenaire n'existe pas ou plus." />
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
                 <Card>
                    <CardHeader>
                        <CardTitle>Galerie</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({length: 6}).map((_, i) => (
                             <div key={i} className="aspect-square relative rounded-md overflow-hidden group">
                                <Image src={`https://picsum.photos/seed/${user.id}-gallery${i}/400/400`} alt={`Galerie ${i+1}`} fill className="object-cover group-hover:scale-105 transition-transform" />
                            </div>
                        ))}
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
                                <p className="font-medium">Localisation</p>
                                <p className="text-sm text-muted-foreground">Paris, France (bientôt disponible)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

