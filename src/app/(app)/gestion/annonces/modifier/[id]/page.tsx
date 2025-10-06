
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { uploadFile } from '@/lib/storage';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { Annonce } from '@/lib/types';

const annonceSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
  description: z.string().min(20, "La description doit faire au moins 20 caractères."),
  price: z.coerce.number().min(1, "Le prix doit être supérieur à 0."),
  category: z.string().min(3, "La catégorie est requise."),
  location: z.string().min(3, "La localisation est requise."),
  image: z.any().optional(), // Image is optional on update
});

type AnnonceFormValues = z.infer<typeof annonceSchema>;

export default function ModifierAnnoncePage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();

    const annonceRef = firestore ? doc(firestore, 'services', params.id) : null;
    const { data: annonce, loading: annonceLoading } = useDoc<Annonce>(annonceRef);

    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { register, handleSubmit, control, formState: { errors }, setValue, reset } = useForm<AnnonceFormValues>({
        resolver: zodResolver(annonceSchema),
    });

    useEffect(() => {
        if (annonce) {
            // Pre-fill form with existing data
            reset({
                title: annonce.title,
                description: annonce.description,
                price: annonce.price,
                category: annonce.category,
                location: annonce.location,
            });
            setImagePreview(annonce.imageUrl);
        }
    }, [annonce, reset]);

    const onSubmit = async (data: AnnonceFormValues) => {
        if (!user || !firestore || !storage || !annonce) {
            toast({ title: "Erreur", description: "Impossible de modifier l'annonce. Session invalide.", variant: "destructive" });
            return;
        }

        if (annonce.createdBy !== user.id) {
            toast({ title: "Action non autorisée", description: "Vous ne pouvez pas modifier cette annonce.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            let imageUrl = annonce.imageUrl;
            // 1. If a new image is provided, upload it
            if (data.image instanceof File) {
                const imageFile = data.image as File;
                const imagePath = `services/${user.id}/${Date.now()}_${imageFile.name}`;
                imageUrl = await uploadFile(storage, imagePath, imageFile);
            }

            // 2. Update document in Firestore
            await updateDoc(doc(firestore, 'services', params.id), {
                title: data.title,
                description: data.description,
                price: data.price,
                category: data.category,
                location: data.location,
                imageUrl: imageUrl,
                updatedAt: serverTimestamp(),
            });

            toast({ title: "Annonce modifiée !", description: "Votre annonce a été mise à jour." });
            router.push('/gestion/annonces');

        } catch (error) {
            console.error("Erreur lors de la modification de l'annonce :", error);
            toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('image', file, { shouldValidate: true });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (authLoading || annonceLoading) {
        return (
             <div>
                <PageHeader title="Modifier une annonce" description="Chargement des informations..." />
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-40 w-full max-w-sm" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!annonce) {
        return <PageHeader title="Annonce introuvable" description="Cette annonce n'existe pas ou a été supprimée." />
    }

    return (
        <div>
            <PageHeader title="Modifier une Annonce" description="Mettez à jour les détails de votre service." />
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre de l'annonce</Label>
                            <Input id="title" {...register('title')} placeholder="Ex: Soirée exclusive à Paris" />
                            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description détaillée</Label>
                            <Textarea id="description" {...register('description')} placeholder="Décrivez ce que vous proposez..." rows={5} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label>Image de l'annonce</Label>
                            <Controller
                                name="image"
                                control={control}
                                render={({ field }) => (
                                    <div>
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                        <label htmlFor="image-upload" className="cursor-pointer">
                                            <Card className="aspect-video w-full max-w-sm hover:bg-muted/50 transition-colors flex items-center justify-center">
                                                {imagePreview ? (
                                                    <Image src={imagePreview} alt="Aperçu" width={400} height={225} className="object-cover rounded-md" />
                                                ) : (
                                                    <div className="text-center text-muted-foreground">
                                                        <Upload className="mx-auto h-10 w-10 mb-2"/>
                                                        <p>Cliquez pour changer l'image</p>
                                                    </div>
                                                )}
                                            </Card>
                                        </label>
                                    </div>
                                )}
                            />
                            {errors.image && <p className="text-sm text-destructive">{errors.image.message as string}</p>}
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="price">Prix (€)</Label>
                                <Input id="price" type="number" step="0.01" {...register('price')} placeholder="Ex: 250" />
                                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Input id="category" {...register('category')} placeholder="Ex: Rencontre, Massage, Soirée" />
                                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="location">Localisation</Label>
                                <Input id="location" {...register('location')} placeholder="Ex: Paris, France" />
                                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading || authLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

    