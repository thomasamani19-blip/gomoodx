

'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useStorage } from '@/firebase';
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
import { uploadFile } from '@/lib/storage';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion');
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setPseudo(user.pseudo || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setAvatarPreview(user.profileImage || null);
      setBannerPreview(user.bannerImage || `https://picsum.photos/seed/${user.id}/1200/400`);
    }
  }, [user, authLoading, router]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'avatar') {
          setAvatarFile(file);
          setAvatarPreview(result);
        } else {
          setBannerFile(file);
          setBannerPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !storage || !firestore) return;
    
    setIsSaving(true);

    try {
      let avatarUrl = user.profileImage;
      if (avatarFile) {
        const storagePath = `avatars/${user.id}/${avatarFile.name}`;
        avatarUrl = await uploadFile(storage, storagePath, avatarFile);
      }

      let bannerUrl = user.bannerImage;
       if (bannerFile) {
        const storagePath = `banners/${user.id}/${bannerFile.name}`;
        bannerUrl = await uploadFile(storage, storagePath, bannerFile);
      }

      const updatedData = {
        displayName,
        pseudo,
        email,
        bio,
        profileImage: avatarUrl,
        bannerImage: bannerUrl,
      };

      await updateUserProfile(firestore, user.id, updatedData);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès.',
      });
    } catch (error) {
       console.error("Erreur lors de la mise à jour du profil:", error);
       toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil. Veuillez réessayer.',
        variant: 'destructive',
       })
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
        <div>
            <PageHeader title="Mon Profil" description="Consultez et modifiez vos informations personnelles." />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div>
      <PageHeader title="Mon Profil" description="Consultez et modifiez vos informations personnelles et votre apparence." />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Apparence du Profil</CardTitle>
            <CardDescription>
              Personnalisez l'apparence de votre profil public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-24">
                <div className="h-48 w-full rounded-lg bg-muted overflow-hidden relative group">
                    {bannerPreview && (
                      <Image
                          src={bannerPreview}
                          alt={`Bannière de ${displayName}`}
                          fill
                          className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button type="button" variant="outline" onClick={() => bannerInputRef.current?.click()}>
                          <Camera className="mr-2 h-4 w-4" /> Changer la bannière
                       </Button>
                    </div>
                </div>
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                    <div className="relative group">
                       <Avatar className="h-32 w-32 border-4 border-background">
                          {avatarPreview && <AvatarImage src={avatarPreview} alt={displayName} />}
                          <AvatarFallback className="text-4xl">{displayName?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button type="button" size="icon" variant="ghost" className="h-12 w-12 hover:bg-black/50" onClick={() => avatarInputRef.current?.click()}>
                           <Camera className="h-6 w-6 text-white" />
                         </Button>
                       </div>
                    </div>
                </div>
            </div>
             <Input 
                ref={avatarInputRef} 
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={(e) => handleImageChange(e, 'avatar')}
            />
             <Input 
                ref={bannerInputRef} 
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={(e) => handleImageChange(e, 'banner')}
            />
          </CardContent>
        </Card>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom d'affichage</Label>
                  <Input id="nom" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pseudo">Pseudo</Label>
                  <Input id="pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Votre nom d'utilisateur public" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bio">Biographie</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Parlez un peu de vous..." rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
