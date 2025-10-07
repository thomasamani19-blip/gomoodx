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
import { Loader2, Wand2, Image as ImageIcon, Video, Mic, Upload, X, Clapperboard, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

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
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [mediaDataUrls, setMediaDataUrls] = useState<string[]>([]);
    const [mediaTypes, setMediaTypes] = useState<('image'|'video')[]>([]);
    const [duration, setDuration] = useState(5);
    
    const { toast } = useToast();
    const [isSavingLive, setIsSavingLive] = useState(false);

    const { user } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();


    const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const newPreviews = fileArray.map(file => URL.createObjectURL(file));
            setMediaPreviews(prev => [...prev, ...newPreviews]); 
            const dataUrls = await Promise.all(fileArray.map(fileToDataUrl)); 
            setMediaDataUrls(prevUrls => [...prevUrls, ...dataUrls]);
            const types = fileArray.map(file => file.type.startsWith('video') ? 'video' : 'image');
            setMediaTypes(prev => [...prev, ...types]);
        }
    };

    const removeMedia = (index: number) => {
        const urlToRemove = mediaPreviews[index];
        URL.revokeObjectURL(urlToRemove);

        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
        setMediaDataUrls(prev => prev.filter((_, i) => i !== index));
        setMediaTypes(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);
        const input = {
            prompt: formData.get('prompt') as string,
            base64Media: mediaDataUrls,
            dureeSecondes: duration,
            format: '16:9' as '16:9' | '9:16'
        };

        if (!input.prompt && mediaDataUrls.length === 0) {
            toast({
                title: 'Entrée requise',
                description: 'Veuillez décrire la vidéo ou fournir une image/vidéo.',
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
                description: "La génération a échoué. Cela peut être dû à une forte demande ou à une erreur de configuration. Veuillez réessayer.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLaunchLive = async () => {
        if (!result?.videoUrl || !user || !firestore) {
            toast({ title: "Erreur", description: "Aucune vidéo à lancer en live.", variant: "destructive" });
            return;
        }
        setIsSavingLive(true);
        try {
            const liveSessionData = {
                title: `Live de ${user.displayName}`,
                description: 'Session live promotionnelle générée par IA.',
                hostId: user.id,
                creatorName: user.displayName,
                isPublic: true,
                startTime: serverTimestamp(),
                status: 'live',
                streamUrl: result.videoUrl,
                imageUrl: user.profileImage || `https://picsum.photos/seed/${user.id}/600/400`,
                viewersCount: 0,
                likes: 0,
                price_per_minute: 0, // Always free
            };
            const docRef = await addDoc(collection(firestore, 'lives'), liveSessionData);
            toast({ title: "Live lancé !", description: "Votre session de live simulé est maintenant visible." });
            router.push(`/live/${docRef.id}`);

        } catch(error) {
            console.error("Error launching live session:", error);
            toast({ title: "Erreur", description: "Impossible de lancer la session live.", variant: "destructive" });
        } finally {
            setIsSavingLive(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Générateur de Vidéo</CardTitle>
                            <CardDescription>Créez une courte vidéo à partir d'un texte et/ou d'un média. Cette fonctionnalité est expérimentale.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prompt-video">Description (Prompt)</Label>
                                <Textarea name="prompt" id="prompt-video" placeholder="Ex: un clin d'œil et un sourire, dans un style cinématique..." rows={3} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Média de référence (image ou vidéo)</Label>
                                <Card className="border-2 border-dashed p-4 text-center hover:border-primary">
                                    <Input id="media-video" type="file" multiple accept="image/*,video/mp4,video/quicktime,video/x-matroska,video/webm" className="hidden" onChange={handleMediaUpload} />
                                    <Label htmlFor="media-video" className="cursor-pointer">
                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Cliquez ou glissez-déposez des médias ici</p>
                                    </Label>
                                </Card>
                            </div>

                            {mediaPreviews.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {mediaPreviews.map((mediaSrc, index) => (
                                        <div key={index} className="relative group">
                                            {mediaTypes[index] === 'video' ? (
                                                <video src={mediaSrc} className="rounded-md object-cover w-full aspect-square" />
                                            ) : (
                                                <Image src={mediaSrc} alt={`Aperçu ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square" />
                                            )}
                                            <div className="absolute top-0 left-0 bg-black/50 text-white rounded-br-md px-1 py-0.5 text-xs">
                                                {mediaTypes[index]}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={() => removeMedia(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                             <div className="space-y-2">
                                <Label htmlFor="duration">Durée de la vidéo ({duration}s)</Label>
                                <Slider
                                    id="duration"
                                    min={5}
                                    max={8}
                                    step={1}
                                    value={[duration]}
                                    onValueChange={(value) => setDuration(value[0])}
                                />
                             </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                                Générer la Vidéo
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
            <div>
                <Card className="min-h-[400px] flex items-center justify-center">
                    <CardContent className="pt-6 w-full h-full flex flex-col">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                                <p className="mt-4 text-sm text-muted-foreground">Génération de la vidéo en cours...</p>
                                <p className="mt-2 text-xs text-muted-foreground/80">Cette opération peut prendre jusqu'à une minute. Merci de votre patience.</p>
                            </div>
                        )}
                        {result?.videoUrl && (
                            <div className="flex flex-col items-center justify-center h-full w-full gap-4">
                                <div className="relative aspect-video w-full">
                                    <video controls autoPlay loop muted src={result.videoUrl} className="rounded-md object-contain w-full h-full">
                                        Votre navigateur ne supporte pas la lecture de vidéos.
                                    </video>
                                </div>
                                <Button onClick={handleLaunchLive} disabled={isSavingLive} className="w-full">
                                    {isSavingLive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-2 h-4 w-4" />}
                                    Lancer en Live (Gratuit & Public)
                                </Button>
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
