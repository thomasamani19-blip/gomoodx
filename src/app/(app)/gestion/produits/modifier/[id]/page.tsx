

'use-client';

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
import { Loader2, Save, Upload, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { uploadFile } from '@/lib/storage';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, ProductType } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const productSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
  description: z.string().min(20, "La description doit faire au moins 20 caractères."),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif."),
  originalPrice: z.coerce.number().optional(),
  productType: z.enum(['digital', 'physique'], { required_error: 'Veuillez sélectionner un type de produit.'}),
  image: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ModifierProduitPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();

    const productRef = firestore ? doc(firestore, 'products', params.id) : null;
    const { data: product, loading: productLoading } = useDoc<Product>(productRef);

    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { register, handleSubmit, control, formState: { errors }, setValue, reset, watch } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
    });

    const productType = watch('productType');

    useEffect(() => {
        if (product) {
            reset({
                title: product.title,
                description: product.description,
                price: product.price,
                originalPrice: product.originalPrice,
                productType: product.productType,
            });
            setImagePreview(product.imageUrl);
        }
    }, [product, reset]);

    const onSubmit = async (data: ProductFormValues) => {
        if (!user || !firestore || !storage || !product) {
            toast({ title: "Erreur", description: "Impossible de modifier le produit. Session invalide.", variant: "destructive" });
            return;
        }

        if (product.createdBy !== user.id) {
            toast({ title: "Action non autorisée", description: "Vous ne pouvez pas modifier ce produit.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            let imageUrl = product.imageUrl;
            if (data.image instanceof File) {
                const imageFile = data.image as File;
                const imagePath = `products/${user.id}/${Date.now()}_${imageFile.name}`;
                imageUrl = await uploadFile(storage, imagePath, imageFile);
            }

            await updateDoc(doc(firestore, 'products', params.id), {
                title: data.title,
                description: data.description,
                price: data.price,
                originalPrice: data.originalPrice,
                productType: data.productType as ProductType,
                imageUrl: imageUrl,
                updatedAt: serverTimestamp(),
            });

            toast({ title: "Produit modifié !", description: "Votre produit a été mis à jour." });
            router.push('/gestion/produits');

        } catch (error) {
            console.error("Erreur lors de la modification du produit :", error);
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

    if (authLoading || productLoading) {
        return (
             <div>
                <PageHeader title="Modifier un produit" description="Chargement des informations..." />
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

    if (!product) {
        return <PageHeader title="Produit introuvable" description="Ce produit n'existe pas ou a été supprimé." />
    }

    return (
        <div>
            <PageHeader title="Modifier un Produit" description="Mettez à jour les détails de votre produit." />
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre du produit</Label>
                            <Input id="title" {...register('title')} />
                            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description détaillée</Label>
                            <Textarea id="description" {...register('description')} rows={5} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label>Image du produit</Label>
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

                        <div className="grid md:grid-cols-2 gap-6">
                            <Controller
                                name="productType"
                                control={control}
                                render={({ field }) => (
                                     <div className="space-y-2">
                                        <Label>Type de produit</Label>
                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="digital" id="digital" />
                                                <Label htmlFor="digital">Contenu Digital</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="physique" id="physique" />
                                                <Label htmlFor="physique">Produit Physique</Label>
                                            </div>
                                        </RadioGroup>
                                         {errors.productType && <p className="text-sm text-destructive">{errors.productType.message}</p>}
                                    </div>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Prix de vente (€)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="price" type="number" step="0.01" {...register('price')} className="pl-8" />
                                    </div>
                                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="originalPrice">Prix original (barré)</Label>
                                     <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="originalPrice" type="number" step="0.01" {...register('originalPrice')} placeholder="Optionnel" className="pl-8" />
                                    </div>
                                </div>
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
