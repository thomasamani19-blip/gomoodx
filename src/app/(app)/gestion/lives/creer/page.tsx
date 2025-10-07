
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
import { useFirestore, useStorage } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, PlusCircle, Upload, Ticket } from 'lucide-react';
import PageHeader from '@/components/shared/page-header';
import { uploadFile } from '@/lib/storage';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';


const liveSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
  description: z.string().min(10, "La description doit faire au moins 10 caractères."),
  image: z.any().refine(file => file instanceof File, 'Une image de couverture est requise.'),
  startTime: z.date({ required_error: "Une date et une heure sont requises."}).min(new Date(), "La date ne peut être dans le passé."),
  isPaid: z.boolean().default(true),
  ticketPrice: z.coerce.number().optional(),
}).refine(data => !data.isPaid || (data.ticketPrice && data.ticketPrice > 0), {
  message: "Le prix du ticket doit être supérieur à 0 pour un live payant.",
  path: ["ticketPrice"],
});

type LiveFormValues = z.infer<typeof liveSchema>;

export default function CreerLivePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const form = useForm<LiveFormValues>({
        resolver: zodResolver(liveSchema),
        defaultValues: {
            isPaid: true,
            ticketPrice: 10,
        }
    });

    const isPaid = form.watch('isPaid');

    const onSubmit = async (data: LiveFormValues) => {
        if (!user || !firestore || !storage) {
            toast({ title: "Erreur", description: "Impossible de créer la session. Veuillez vous reconnecter.", variant: "destructive" });
            return;
        }
        setIsLoading(true);

        try {
            const imageFile = data.image as File;
            const imagePath = `lives/${user.id}/${Date.now()}_${imageFile.name}`;
            const imageUrl = await uploadFile(storage, imagePath, imageFile);

            await addDoc(collection(firestore, 'lives'), {
                title: data.title,
                description: data.description,
                hostId: user.id,
                creatorName: user.displayName,
                imageUrl,
                imageHint: 'live session',
                startTime: Timestamp.fromDate(data.startTime),
                status: 'scheduled',
                liveType: 'public_paid',
                isPublic: true,
                ticketPrice: data.isPaid ? data.ticketPrice : 0,
                viewersCount: 0,
                likes: 0,
            });

            toast({ title: "Live planifié !", description: "Votre session live est maintenant visible sur la plateforme." });
            router.push('/gestion/lives');

        } catch (error) {
            console.error("Erreur lors de la création du live :", error);
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
            reader.onloadend = () => { setImagePreview(reader.result as string) };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <PageHeader title="Planifier un Live Payant" description="Créez un événement live avec accès par ticket." />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre du Live</Label>
                            <Input id="title" {...form.register('title')} placeholder="Ex: Session Q&A exclusive" />
                            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...form.register('description')} placeholder="Décrivez le contenu de votre live..." rows={3} />
                            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label>Image de couverture</Label>
                             <Controller
                                name="image"
                                control={form.control}
                                render={({ field }) => (
                                    <div>
                                        <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        <label htmlFor="image-upload" className="cursor-pointer">
                                            <Card className="aspect-video w-full max-w-sm hover:bg-muted/50 transition-colors flex items-center justify-center">
                                                {imagePreview ? (
                                                    <Image src={imagePreview} alt="Aperçu" width={400} height={225} className="object-cover rounded-md" />
                                                ) : (
                                                    <div className="text-center text-muted-foreground"><Upload className="mx-auto h-10 w-10 mb-2"/><p>Cliquez pour choisir une image</p></div>
                                                )}
                                            </Card>
                                        </label>
                                    </div>
                                )}
                            />
                            {form.formState.errors.image && <p className="text-sm text-destructive">{form.formState.errors.image.message as string}</p>}
                        </div>
                        
                         <div className="grid md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-2">
                                <Label>Date et Heure du live</Label>
                                <Controller
                                    name="startTime"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP 'à' HH:mm", {locale: fr}) : <span>Choisissez une date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                <div className="p-3 border-t border-border">
                                                    <Input type="time" onChange={(e) => {
                                                        const time = e.target.value.split(':');
                                                        const newDate = field.value || new Date();
                                                        newDate.setHours(parseInt(time[0]), parseInt(time[1]));
                                                        field.onChange(new Date(newDate));
                                                    }} />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                                 {form.formState.errors.startTime && <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>}
                            </div>
                         </div>
                        
                         <Controller
                            name="isPaid"
                            control={form.control}
                            render={({ field }) => (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="paid-switch" className="text-base flex items-center"><Ticket className="mr-2 h-4 w-4 text-primary" />Live Payant</Label>
                                        <p className="text-sm text-muted-foreground">Vendez des tickets d'accès pour ce live.</p>
                                    </div>
                                    <Switch id="paid-switch" checked={field.value} onCheckedChange={field.onChange} />
                                </div>
                            )}
                        />
                        {isPaid && (
                            <div className="space-y-2">
                                <Label htmlFor="ticketPrice">Prix du ticket (€)</Label>
                                <Input id="ticketPrice" type="number" step="0.5" {...form.register('ticketPrice')} />
                                {form.formState.errors.ticketPrice && <p className="text-sm text-destructive">{form.formState.errors.ticketPrice.message}</p>}
                            </div>
                        )}

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading || authLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Planification en cours...' : 'Planifier le Live'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
