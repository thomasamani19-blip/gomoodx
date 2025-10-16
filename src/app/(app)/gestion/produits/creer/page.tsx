
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Loader2, PlusCircle, Upload, Users, Percent, Trash2, UserSearch, DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { collection, query, where } from 'firebase/firestore';

const revenueShareSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  percentage: z.coerce.number().min(0, "Le % doit être positif.").max(100, "Le % ne peut dépasser 100."),
});

const productSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
  description: z.string().min(20, "La description doit faire au moins 20 caractères."),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif.").refine(price => {
    return true;
  }),
  originalPrice: z.coerce.number().optional(),
  productType: z.enum(['digital', 'physique'], { required_error: 'Veuillez sélectionner un type de produit.'}),
  quantity: z.coerce.number().optional(),
  image: z.any().refine(file => file instanceof File, 'Une image est requise.'),
  isCollaborative: z.boolean().default(false),
  revenueShares: z.array(revenueShareSchema).optional(),
}).refine(data => {
    if (!data.isCollaborative) return true;
    const total = data.revenueShares?.reduce((sum, share) => sum + share.percentage, 0) || 0;
    return total === 100;
}, {
    message: "La somme des pourcentages doit être exactement 100%.",
    path: ["revenueShares"],
});


type ProductFormValues = z.infer<typeof productSchema>;

export default function CreerProduitPage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const isProducer = user?.role === 'partenaire' && user?.partnerType === 'producer';

    const escortesQuery = useMemo(() => {
        if (!firestore || !isProducer) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'escorte'));
    }, [firestore, isProducer]);
    const { data: allEscortes, loading: escortesLoading } = useCollection<User>(escortesQuery);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productType: 'digital',
            price: 10,
            isCollaborative: false,
            revenueShares: [],
        }
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "revenueShares",
    });
    
    useEffect(() => {
        if(isProducer && user && fields.length === 0) {
            append({ userId: user.id, displayName: 'Moi (Producteur)', percentage: 100 });
        }
    }, [user, fields.length, append, isProducer]);


    const productType = form.watch('productType');
    const isCollaborative = form.watch('isCollaborative');

    const onSubmit = async (data: ProductFormValues) => {
        if (!user) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('price', data.price.toString());
        if (data.originalPrice) {
            formData.append('originalPrice', data.originalPrice.toString());
        }
        formData.append('productType', data.productType);
        if (data.productType === 'physique' && data.quantity) {
          formData.append('quantity', data.quantity.toString());
        }
        formData.append('image', data.image);
        formData.append('authorId', user.id);
        formData.append('isCollaborative', String(data.isCollaborative));
        if (data.isCollaborative && data.revenueShares) {
             formData.append('revenueShares', JSON.stringify(data.revenueShares));
        }

        try {
            const response = await fetch('/api/products/create', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'La création du produit a échoué.');
            }

            toast({ title: "Produit créé !", description: "Votre nouveau produit est maintenant dans votre boutique." });
            router.push('/gestion/produits');
        } catch (error: any) {
            console.error("Erreur:", error);
            toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('image', file, { shouldValidate: true });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const totalPercentage = form.watch('revenueShares')?.reduce((sum, share) => sum + (share.percentage || 0), 0) || 0;

    return (
        <div>
            <PageHeader title="Créer un Nouveau Produit" description="Remplissez les détails de votre produit pour votre boutique." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre du produit</Label>
                            <Input id="title" {...form.register('title')} />
                            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description détaillée</Label>
                            <Textarea id="description" {...form.register('description')} rows={5} />
                            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Image du produit</Label>
                            <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <Card className="aspect-video w-full max-w-sm hover:bg-muted/50 transition-colors flex items-center justify-center">
                                    {imagePreview ? <Image src={imagePreview} alt="Aperçu" width={400} height={225} className="object-cover rounded-md" /> : <div className="text-center text-muted-foreground"><Upload className="mx-auto h-10 w-10 mb-2"/><p>Cliquez pour choisir une image</p></div>}
                                </Card>
                            </label>
                            {form.formState.errors.image && <p className="text-sm text-destructive">{form.formState.errors.image.message as string}</p>}
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Controller name="productType" control={form.control} render={({ field }) => (
                                <div className="space-y-2">
                                    <Label>Type de produit</Label>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                                        <RadioGroupItem value="digital" id="digital" /><Label htmlFor="digital">Contenu Digital</Label>
                                        <RadioGroupItem value="physique" id="physique" /><Label htmlFor="physique">Produit Physique</Label>
                                    </RadioGroup>
                                </div>
                            )}/>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="price">Prix de vente (€)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="price" type="number" step="0.01" {...form.register('price')} className="pl-8" />
                                </div>
                                {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="originalPrice">Prix original (barré)</Label>
                                 <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="originalPrice" type="number" step="0.01" {...form.register('originalPrice')} placeholder="Optionnel" className="pl-8" />
                                </div>
                            </div>
                            {productType === 'physique' && (
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantité en stock</Label>
                                    <Input id="quantity" type="number" {...form.register('quantity')} placeholder="Ex: 10" />
                                </div>
                            )}
                        </div>

                        {isProducer && (
                            <>
                                <Separator/>
                                <Controller
                                    name="isCollaborative"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="collaborative-switch" className="text-base flex items-center"><Users className="mr-2 h-4 w-4 text-primary"/> Contenu Collaboratif</Label>
                                                <p className="text-sm text-muted-foreground">Activez pour partager les revenus avec d'autres créateurs.</p>
                                            </div>
                                            <Switch id="collaborative-switch" checked={field.value} onCheckedChange={field.onChange} />
                                        </div>
                                    )}
                                />

                                {isCollaborative && (
                                    <div className="space-y-4">
                                        <CardTitle>Partage des Revenus</CardTitle>
                                        <CardDescription>Ajoutez les escortes participantes et définissez leur pourcentage sur les ventes. Le total doit faire 100%.</CardDescription>
                                        
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-4 p-2 rounded-md border">
                                                <p className="font-medium flex-1">{field.displayName}</p>
                                                <div className="relative w-28">
                                                    <Input type="number" {...form.register(`revenueShares.${index}.percentage`)} className="pr-8" />
                                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                                </div>
                                                {field.userId !== user?.id && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                                            </div>
                                        ))}

                                        <div className={cn("p-2 rounded-md font-bold text-right", totalPercentage === 100 ? "text-green-600" : "text-destructive")}>
                                            Total: {totalPercentage} / 100 %
                                        </div>
                                        {form.formState.errors.revenueShares && <p className="text-sm text-destructive text-right">{form.formState.errors.revenueShares.message}</p>}

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" disabled={escortesLoading}><UserSearch className="mr-2 h-4 w-4" /> Ajouter une escorte</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Command>
                                                    <CommandInput placeholder="Rechercher une escorte..." />
                                                    <CommandList>
                                                        <CommandEmpty>Aucune escorte trouvée.</CommandEmpty>
                                                        <CommandGroup>
                                                            {allEscortes?.filter(escort => !fields.some(f => f.userId === escort.id)).map(escort => (
                                                                <CommandItem key={escort.id} onSelect={() => append({ userId: escort.id, displayName: escort.displayName, percentage: 0 })}>
                                                                    <Avatar className="mr-2 h-6 w-6"><AvatarImage src={escort.profileImage}/><AvatarFallback>{escort.displayName.charAt(0)}</AvatarFallback></Avatar>
                                                                    {escort.displayName}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading || authLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Ajouter le produit
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
