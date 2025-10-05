'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/page-header';
import { genererImageIA, type GenererImageIAOutput } from '@/ai/flows/generer-image-ia';
import { genererAudioTTS, type GenererAudioTTSOutput } from '@/ai/flows/generer-audio-tts';
import { genererVideoIA, type GenererVideoIAOutput } from '@/ai/flows/generer-video-ia';
import { Loader2, Wand2, Image as ImageIcon, Video, Mic, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

function ImageGeneratorTab() {
  const [result, setResult] = useState<GenererImageIAOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      prompt: formData.get('prompt') as string,
      style: formData.get('style') as string,
    };

    try {
      const response = await genererImageIA(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la génération de l'image.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <form onSubmit={handleSubmit}>
          <Card>
             <CardHeader>
              <CardTitle>Générateur d'Image</CardTitle>
              <CardDescription>Décrivez l'image que vous souhaitez créer. Soyez aussi précis que possible pour de meilleurs résultats.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-image">Description de l'image (Prompt)</Label>
                <Textarea name="prompt" id="prompt-image" placeholder="Ex: une femme élégante dans un jardin secret au crépuscule..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style artistique</Label>
                <Input name="style" id="style" placeholder="Ex: photoréaliste, peinture à l'huile, art numérique..." />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Générer l'Image
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <Card className="min-h-[400px] flex items-center justify-center">
          <CardContent className="pt-6 w-full h-full">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Génération en cours... Ceci peut prendre un moment.</p>
              </div>
            )}
            {result?.imageUrl && (
              <div className="relative aspect-square w-full h-full">
                 <Image src={result.imageUrl} alt="Image générée par l'IA" fill className="rounded-md object-contain" />
              </div>
            )}
            {!isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">L'image générée apparaîtra ici.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AudioGeneratorTab() {
  const [result, setResult] = useState<GenererAudioTTSOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      texte: formData.get('texte') as string,
    };

     if (!input.texte) {
      toast({
        title: 'Champ requis',
        description: 'Veuillez entrer un texte à convertir.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await genererAudioTTS(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la génération de l'audio.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <form onSubmit={handleSubmit}>
          <Card>
             <CardHeader>
              <CardTitle>Générateur Audio (Text-to-Speech)</CardTitle>
              <CardDescription>Transformez un texte en message audio avec une voix naturelle.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="texte-audio">Texte à convertir</Label>
                <Textarea name="texte" id="texte-audio" placeholder="Écrivez ici le texte que vous souhaitez entendre..." rows={6} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                Générer l'Audio
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <Card className="min-h-[400px] flex items-center justify-center">
          <CardContent className="pt-6 w-full">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Génération audio en cours...</p>
              </div>
            )}
            {result?.audioUrl && (
              <div className="flex flex-col items-center justify-center h-full w-full">
                <p className="text-sm font-medium mb-4">Audio généré avec succès !</p>
                <audio controls src={result.audioUrl} className="w-full">
                  Votre navigateur ne supporte pas l'élément audio.
                </audio>
              </div>
            )}
            {!isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Mic className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">L'audio généré apparaîtra ici.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function VideoGeneratorTab() {
    const [result, setResult] = useState<GenererVideoIAOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const { toast } = useToast();

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const dataUrls = await Promise.all(fileArray.map(fileToDataUrl));
            setImages(prevImages => [...prevImages, ...dataUrls]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);
        const input = {
            prompt: formData.get('prompt') as string,
            imagesBase64: images,
        };

        if (!input.prompt) {
            toast({
                title: 'Champ requis',
                description: 'Veuillez décrire la vidéo à générer.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await genererVideoIA(input);
            setResult(response);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erreur de Génération Vidéo',
                description: "La génération a échoué. Cela peut être dû à une forte demande. Veuillez réessayer dans quelques instants.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Générateur de Vidéo</CardTitle>
                            <CardDescription>Créez une courte vidéo à partir d'un texte et/ou d'images. Cette fonctionnalité est expérimentale.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="prompt-video">Description (Prompt)</Label>
                                <Textarea name="prompt" id="prompt-video" placeholder="Ex: crée une courte promo avec une musique entraînante..." rows={3} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="images-video">Images de référence (optionnel)</Label>
                                <Input id="images-video" type="file" multiple accept="image/*" onChange={handleImageUpload} />
                                <p className="text-xs text-muted-foreground">Téléchargez une ou plusieurs images pour créer un montage.</p>
                            </div>

                            {images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <Image src={img} alt={`Aperçu ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={() => removeImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                                Générer la Vidéo
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
            <div>
                <Card className="min-h-[400px] flex items-center justify-center">
                    <CardContent className="pt-6 w-full h-full">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                                <p className="mt-4 text-sm text-muted-foreground">Génération de la vidéo en cours...</p>
                                <p className="mt-2 text-xs text-muted-foreground/80">Cette opération peut prendre jusqu'à une minute. Merci de votre patience.</p>
                            </div>
                        )}
                        {result?.videoUrl && (
                            <div className="relative aspect-video w-full h-full">
                                <video controls autoPlay loop muted src={result.videoUrl} className="rounded-md object-contain w-full h-full">
                                    Votre navigateur ne supporte pas la lecture de vidéos.
                                </video>
                            </div>
                        )}
                        {!isLoading && !result && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Video className="h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-sm text-muted-foreground">La vidéo générée apparaîtra ici.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function StudioIAPage() {
  return (
    <div>
        <PageHeader
          title="Studio IA Créatif"
          description="Donnez vie à vos idées avec nos outils de génération de contenu par IA."
        />
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image"><ImageIcon className="mr-2" /> Image</TabsTrigger>
            <TabsTrigger value="video"><Video className="mr-2" /> Vidéo</TabsTrigger>
            <TabsTrigger value="audio"><Mic className="mr-2" /> Audio (TTS)</TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="mt-6">
            <ImageGeneratorTab />
          </TabsContent>
          <TabsContent value="video" className="mt-6">
            <VideoGeneratorTab />
          </TabsContent>
          <TabsContent value="audio" className="mt-6">
             <AudioGeneratorTab />
          </TabsContent>
        </Tabs>
    </div>
  );
}
