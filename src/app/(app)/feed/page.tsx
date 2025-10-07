
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function CreatePost() {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handlePostSubmit = async () => {
        if (!content.trim() && !image) {
            toast({ title: "Contenu vide", description: "Veuillez écrire un message ou ajouter une image.", variant: "destructive"});
            return;
        }
        setIsLoading(true);

        const formData = new FormData();
        formData.append('content', content);
        formData.append('authorId', user!.id);
        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await fetch('/api/posts/create', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'La publication a échoué.');
            }

            toast({ title: "Publié !", description: "Votre publication est maintenant visible sur le fil d'actualité."});
            setContent('');
            setImage(null);
            setImagePreview(null);
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive"});
        } finally {
            setIsLoading(false);
        }
    };


    if (!user || (user.role !== 'escorte' && user.role !== 'partenaire')) {
        return null;
    }

    return (
        <Card className="mb-8">
            <CardHeader className="flex flex-row items-start gap-4">
                 <Avatar>
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <Textarea 
                        placeholder={`Quoi de neuf, ${user.displayName} ?`}
                        className="w-full border-none focus-visible:ring-0 shadow-none p-0"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                     {imagePreview && (
                        <div className="mt-4 relative max-w-sm">
                            <img src={imagePreview} alt="Aperçu" className="rounded-lg w-full h-auto" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => { setImage(null); setImagePreview(null); }}>
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardFooter className="flex justify-between items-center">
                 <div>
                    <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                    <Button variant="ghost" size="icon" asChild>
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <ImageIcon className="text-primary"/>
                        </label>
                    </Button>
                </div>
                <Button onClick={handlePostSubmit} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                    Publier
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function FeedPage() {

    return (
        <div>
            <PageHeader 
                title="Fil d'actualité"
                description="Découvrez les dernières publications de la communauté GoMoodX."
            />
            
            <CreatePost />

            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">Le contenu du fil d'actualité apparaîtra bientôt ici.</p>
                </CardContent>
            </Card>
        </div>
    )
}
