
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
import { Loader2, Save, Upload, Star } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { uploadFile } from '@/lib/storage';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { BlogArticle } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

const articleSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
  content: z.string().min(50, "L'article doit contenir au moins 50 caractères."),
  image: z.any().optional(),
  isPremium: z.boolean().default(false),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function ModifierArticlePage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();

    const articleRef = firestore ? doc(firestore, 'blog', params.id) : null;
    const { data: article, loading: articleLoading } = useDoc<BlogArticle>(articleRef);

    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { register, handleSubmit, control, formState: { errors }, setValue, reset } = useForm<ArticleFormValues>({
        resolver: zodResolver(articleSchema),
    });

    useEffect(() => {
        if (article) {
            reset({
                title: article.title,
                content: article.content,
                isPremium: article.isPremium || false,
            });
            setImagePreview(article.imageUrl);
        }
    }, [article, reset]);

    const onSubmit = async (data: ArticleFormValues) => {
        if (!user || !firestore || !storage || !article) {
            toast({ title: "Erreur", description: "Impossible de modifier l'article. Session invalide.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            let imageUrl = article.imageUrl;
            if (data.image instanceof File) {
                const imageFile = data.image as File;
                const imagePath = `blog/${user.id}/${Date.now()}_${imageFile.name}`;
                imageUrl = await uploadFile(storage, imagePath, imageFile);
            }

            await updateDoc(doc(firestore, 'blog', params.id), {
                title: data.title,
                content: data.content,
                imageUrl: imageUrl,
                date: serverTimestamp(),
                isPremium: data.isPremium,
            });

            toast({ title: "Article modifié !", description: "Votre article a été mis à jour." });
            router.push('/gestion/articles');

        } catch (error) {
            console.error("Erreur lors de la modification de l'article :", error);
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

    if (authLoading || articleLoading) {
        return (
             <div>
                <PageHeader title="Modifier un article" description="Chargement des informations..." />
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full max-w-sm" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!article) {
        return <PageHeader title="Article introuvable" description="Cet article n'existe pas ou a été supprimé." />
    }

    return (
        <div>
            <PageHeader title="Modifier l'article" description="Mettez à jour le contenu de votre publication." />
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="space-y-2">
                             <Controller
                                name="isPremium"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="premium-switch" className="text-base flex items-center">
                                                <Star className="mr-2 h-4 w-4 text-primary" />
                                                Article Premium
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                               Cochez pour rendre cet article visible uniquement par les membres Premium.
                                            </p>
                                        </div>
                                        <Switch
                                            id="premium-switch"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Image de l'article</Label>
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
                            {errors.image && <p className="text-sm text-destructive">{errors.image.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Titre</Label>
                            <Input id="title" {...register('title')} />
                            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Contenu</Label>
                            <Textarea id="content" {...register('content')} rows={15} />
                            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
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
