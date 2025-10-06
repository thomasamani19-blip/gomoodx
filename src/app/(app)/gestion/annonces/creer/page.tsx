
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useStorage } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, PlusCircle, Upload } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { uploadFile } from '@/lib/storage';
import Image from 'next/image';

const annonceSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
  description: z.string().min(20, "La description doit faire au moins 20 caractères."),
  price: z.coerce.number().min(1, "Le prix doit être supérieur à 0."),
  category: z.string().min(3, "La catégorie est requise."),
  location: z.string().min(3, "La localisation est requise."),
  image: z.any().refine(file => file instanceof File, 'Une image est requise.'),
});

type AnnonceFormValues = z.infer<typeof annonceSchema>;

export default function CreerAnnoncePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { register, handleSubmit, control, formState: { errors } } = useForm<AnnonceFormValues>({
        resolver: zodResolver(annonceSchema),
    });

    const onSubmit = async (data: AnnonceFormValues) => {
        if (!user || !firestore || !storage) {
            toast({ title: "Erreur", description: "Impossible de créer l'annonce. Veuillez vous reconnecter.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            // 1. Upload image to Firebase Storage
            const imageFile = data.image as File;
            const imagePath = `services/${user.id}/${Date.now()}_${imageFile.name}`;
            const imageUrl = await uploadFile(storage, imagePath, imageFile);

            // 2. Create document in Firestore
            await addDoc(collection(firestore, 'services'), {
                title: data.title,
                description: data.description,
                price: data.price,
                category: data.category,
                location: data.location,
                imageUrl: imageUrl,
                createdBy: user.id,
                status: 'active',
                rating: 0,
                ratingCount: 0,
                views: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast({ title: "Annonce créée !", description: "Votre nouvelle annonce est maintenant en ligne." });
            router.push('/gestion/annonces');

        } catch (error) {
            console.error("Erreur lors de la création de l'annonce :", error);
            toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <PageHeader title="Créer une Nouvelle Annonce" description="Remplissez les détails de votre service pour le proposer à la communauté." />
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
                                            id="image"
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if(file) {
                                                    field.onChange(file);
                                                    handleImageChange(e);
                                                }
                                            }}
                                            ref={field.ref}
                                        />
                                        <label htmlFor="image" className="cursor-pointer">
                                            <Card className="aspect-video w-full max-w-sm hover:bg-muted/50 transition-colors flex items-center justify-center">
                                                {imagePreview ? (
                                                    <Image src={imagePreview} alt="Aperçu" width={400} height={225} className="object-cover rounded-md" />
                                                ) : (
                                                    <div className="text-center text-muted-foreground">
                                                        <Upload className="mx-auto h-10 w-10 mb-2"/>
                                                        <p>Cliquez pour choisir une image</p>
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
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Création en cours...' : 'Publier l\'annonce'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
