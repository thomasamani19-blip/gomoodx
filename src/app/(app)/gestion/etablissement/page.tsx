
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
import { Loader2, Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/lib/storage';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Renamed from ProfilPage to avoid conflicts
export default function GestionEtablissementPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion');
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setAvatarPreview(user.profileImage || null);
      setBannerPreview(user.bannerImage || `https://picsum.photos/seed/${user.id}/1200/400`);
      setGalleryPreviews(user.galleryImages || []);
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

  const handleGalleryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const newFiles = Array.from(files);
        const newPreviews = await Promise.all(newFiles.map(fileToDataUrl));
        setGalleryFiles(prev => [...prev, ...newFiles]);
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index: number) => {
    const removedPreview = galleryPreviews[index];
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    
    // Check if the image to be removed is one of the new files (by checking if its preview is a data URL)
    if (removedPreview.startsWith('data:')) {
        const fileIndexToRemove = galleryPreviews.slice(0, index).filter(p => p.startsWith('data:')).length;
        
        // Remove from both files and previews state
        setGalleryFiles(prevFiles => prevFiles.filter((_, i) => i !== fileIndexToRemove));
        setGalleryPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));

    } else {
        // If it's an existing URL, just remove it from previews.
        // It will be filtered out from the final list upon saving.
        setGalleryPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
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

      const newGalleryUrls = await Promise.all(
        galleryFiles.map(file => {
            const storagePath = `galleries/${user.id}/${Date.now()}_${file.name}`;
            return uploadFile(storage, storagePath, file);
        })
      );
      
      const existingUrls = user.galleryImages || [];
      const finalGalleryUrls = existingUrls.filter(url => galleryPreviews.includes(url));
      
      const updatedData = {
        displayName,
        email,
        bio,
        location,
        profileImage: avatarUrl,
        bannerImage: bannerUrl,
        galleryImages: [...finalGalleryUrls, ...newGalleryUrls],
      };

      await updateUserProfile(firestore, user.id, updatedData);
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès.',
      });
      setGalleryFiles([]); // Clear file queue after upload
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
            <PageHeader title="Gérer mon Profil" description="Consultez et modifiez vos informations." />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div>
      <PageHeader title="Gérer mon Profil" description="Consultez et modifiez les informations publiques de votre établissement ou studio." />
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
                          <AvatarFallback className="text-4xl">{displayName?.charAt(0)?.toUpperCase() ?? 'P'}</AvatarFallback>
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
                <CardTitle>Galerie du Profil</CardTitle>
                <CardDescription>Ajoutez des photos de votre établissement, vos produits ou vos réalisations.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {galleryPreviews.map((src, index) => (
                        <div key={index} className="relative group aspect-square">
                            <Image src={src} alt={`Galerie ${index+1}`} fill className="object-cover rounded-md" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeGalleryImage(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" className="aspect-square w-full h-full flex flex-col items-center justify-center" onClick={() => galleryInputRef.current?.click()}>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs mt-2 text-muted-foreground">Ajouter</span>
                    </Button>
                </div>
                 <Input 
                    ref={galleryInputRef} 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handleGalleryImageChange}
                />
            </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informations Publiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l'entreprise</Label>
              <Input id="nom" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Paris, France"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="bio">Description</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Décrivez votre activité..." rows={4} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail de contact</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <p className="text-xs text-muted-foreground">Cette adresse sera publique. L'e-mail de connexion reste privé.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
