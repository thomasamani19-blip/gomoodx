'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { updateUserProfile } from '@/lib/user';
import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nom, setNom] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion');
    }
    if (user) {
      setNom(user.nom || '');
      setPseudo(user.pseudo || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar || null);
    }
  }, [user, authLoading, router]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);

    const updatedData: { nom: string; pseudo: string; email: string; avatar?: string } = {
      nom,
      pseudo,
      email,
    };
    
    // NOTE: L'upload de l'avatar n'est pas implémenté.
    // L'URL de l'avatar (avatarPreview) n'est donc pas sauvegardée pour l'instant.
    // Il faudrait ici une logique pour uploader l'image vers un service de stockage
    // (ex: Firebase Storage) et obtenir une URL publique.

    try {
      updateUserProfile(firestore, user.id, updatedData);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès. La mise à jour de l\'avatar n\'est pas encore fonctionnelle.',
      });
    } catch (error) {
       // La gestion d'erreur est faite dans la fonction updateUserProfile,
       // qui émet un événement intercepté par le listener global.
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
        <div>
            <PageHeader title="Mon Profil" description="Consultez et modifiez vos informations personnelles." />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-28" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div>
      <PageHeader title="Mon Profil" description="Consultez et modifiez vos informations personnelles." />
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>
              Ces informations sont utilisées pour identifier votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center gap-6">
                <div className="relative group">
                    <Avatar className="h-24 w-24">
                        {avatarPreview && <AvatarImage src={avatarPreview} alt={nom} />}
                        <AvatarFallback className="text-3xl">{nom?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Camera className="h-8 w-8 text-white" />
                    </button>
                    <Input 
                        ref={fileInputRef} 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleAvatarChange}
                    />
                </div>
                <div>
                    <h3 className="text-xl font-bold">{nom}</h3>
                    <p className="text-sm text-muted-foreground">@{pseudo || 'pseudo'}</p>
                </div>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="pseudo">Pseudo</Label>
                <Input
                    id="pseudo"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Votre nom d'utilisateur public"
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled // Usually, email is not easily changed
                />
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
