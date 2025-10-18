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
import { Loader2, Camera, Upload, X, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadFile } from '@/lib/storage';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BankDetails, Settings } from '@/lib/types';
import { doc, getDoc, writeBatch, FieldValue, increment, collection } from 'firebase/firestore';

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [bankDetails, setBankDetails] = useState<BankDetails>({ accountType: 'bank', accountNumber: '', bankCode: '' });

  const [isSaving, setIsSaving] = useState(false);
  const isCreatorOrPartner = user?.role === 'escorte' || user?.role === 'partenaire';

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
      setGalleryPreviews(user.galleryImages || []);
      if (user.bankDetails) {
        setBankDetails({
          accountType: user.bankDetails.accountType || 'bank',
          accountNumber: user.bankDetails.accountNumber || '',
          bankCode: user.bankDetails.bankCode || '',
        });
      }
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
    const urlToRemove = galleryPreviews[index];
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryPreviews(newPreviews);
    
    if (urlToRemove.startsWith('data:')) {
        let fileIndexToRemove = -1;
        let dataUrlCount = 0;
        for (let i = 0; i <= index; i++) {
            if (galleryPreviews[i].startsWith('data:')) {
                dataUrlCount++;
            }
        }
        fileIndexToRemove = dataUrlCount - 1;
        
        if (fileIndexToRemove > -1) {
            setGalleryFiles(prev => prev.filter((_, i) => i !== fileIndexToRemove));
        }
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
      
      const finalGalleryUrls = galleryPreviews.filter(url => !url.startsWith('data:'));
      const allGalleryImages = [...finalGalleryUrls, ...newGalleryUrls];
      
      const updatedData: any = {
        displayName,
        pseudo,
        bio,
        profileImage: avatarUrl,
        bannerImage: bannerUrl,
        galleryImages: allGalleryImages,
      };

      if (isCreatorOrPartner) {
        updatedData.bankDetails = bankDetails;
      }
      
      const userRef = doc(firestore, 'users', user.id);
      const batch = writeBatch(firestore);
      let bonusAwarded = false;
      let bonusAmount = 0;

      // Bonus logic for completing profile
      if (isCreatorOrPartner && !user.hasCompletedProfile && user.verificationStatus === 'verified') {
        const settingsDoc = await getDoc(doc(firestore, 'settings', 'global'));
        const PROFILE_COMPLETION_BONUS = (settingsDoc.data() as Settings)?.rewards?.profileCompletionBonus || 0;
        bonusAmount = PROFILE_COMPLETION_BONUS;
        
        const profileIsNowComplete = avatarUrl && !avatarUrl.includes('picsum.photos') && bannerUrl && !bannerUrl.includes('picsum.photos') && bio && allGalleryImages.length >= 3;

        if (profileIsNowComplete && PROFILE_COMPLETION_BONUS > 0) {
            updatedData.hasCompletedProfile = true;
            updatedData.rewardPoints = increment(PROFILE_COMPLETION_BONUS);
            
            const walletRef = doc(firestore, 'wallets', user.id);
            const rewardTxRef = doc(collection(walletRef, 'transactions'));
            
            batch.set(rewardTxRef, {
                amount: PROFILE_COMPLETION_BONUS,
                type: 'reward',
                description: 'Bonus pour profil complet et vérifié !',
                status: 'success',
                createdAt: new Date(),
            });
            bonusAwarded = true;
        }
      }
      
      batch.update(userRef, updatedData);
      await batch.commit();

      toast({
        title: 'Profil mis à jour',
        description: `Vos informations ont été enregistrées. ${bonusAwarded ? `Félicitations, vous avez reçu ${bonusAmount} points bonus !` : ''}`,
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
            <PageHeader title="Mon Profil" description="Consultez et modifiez vos informations personnelles." />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div>
      <PageHeader title="Mon Profil" description="Consultez et modifiez vos informations personnelles et votre apparence." />
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
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
            
            {user.role !== 'client' && (
            <Card>
                <CardHeader>
                    <CardTitle>Galerie du Profil</CardTitle>
                    <CardDescription>Ajoutez des photos à votre galerie publique. Elles seront visibles sur votre profil.</CardDescription>
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
            )}

            <Card>
            <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="nom">Nom d'affichage</Label>
                    <Input id="nom" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="pseudo">Pseudo (@)</Label>
                    <Input id="pseudo" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Votre nom d'utilisateur public" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    <p className="text-xs text-muted-foreground">L'adresse e-mail ne peut pas être modifiée.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bio">Biographie</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Parlez un peu de vous..." rows={4} />
                </div>
            </CardContent>
            </Card>

            {isCreatorOrPartner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Banknote /> Informations de Retrait</CardTitle>
                  <CardDescription>
                    Ces informations sont nécessaires pour recevoir vos paiements. Elles resteront confidentielles et sécurisées.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Type de Compte de Destination</Label>
                        <RadioGroup 
                            value={bankDetails.accountType} 
                            onValueChange={(value) => setBankDetails(prev => ({...prev, accountType: value as 'bank' | 'mobile_money'}))}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bank" id="bank" />
                                <Label htmlFor="bank">Compte Bancaire</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mobile_money" id="mobile_money" />
                                <Label htmlFor="mobile_money">Mobile Money</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {bankDetails.accountType === 'bank' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Numéro de Compte (IBAN)</Label>
                                <Input 
                                    id="accountNumber" 
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails(prev => ({...prev, accountNumber: e.target.value}))} 
                                    placeholder="FR76..." 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bankCode">Code Banque (BIC/SWIFT)</Label>
                                <Input 
                                    id="bankCode" 
                                    value={bankDetails.bankCode}
                                    onChange={(e) => setBankDetails(prev => ({...prev, bankCode: e.target.value}))} 
                                    placeholder="Ex: CITIUS33"
                                />
                            </div>
                        </div>
                    )}

                     {bankDetails.accountType === 'mobile_money' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mobileNumber">Numéro de Téléphone</Label>
                                <Input 
                                    id="mobileNumber" 
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => setBankDetails(prev => ({...prev, accountNumber: e.target.value}))} 
                                    placeholder="Ex: 2250707070707" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobileNetwork">Opérateur Mobile</Label>
                                <Input 
                                    id="mobileNetwork" 
                                    value={bankDetails.bankCode}
                                    onChange={(e) => setBankDetails(prev => ({...prev, bankCode: e.target.value}))} 
                                    placeholder="Ex: MTN, ORANGE, MOOV"
                                />
                                <p className="text-xs text-muted-foreground">Entrez le code opérateur fourni par Flutterwave (ex: `MTN_CIV`)</p>
                            </div>
                        </div>
                    )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer les modifications
                </Button>
            </div>
        </div>
      </form>
    </div>
  );
}
