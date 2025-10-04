'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/page-header';
import { genererImageIA, type GenererImageIAOutput } from '@/ai/flows/generer-image-ia';
import { Loader2, Wand2, Image as ImageIcon, Video, Mic } from 'lucide-react';
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
                <Label htmlFor="prompt">Description de l'image (Prompt)</Label>
                <Textarea name="prompt" id="prompt" placeholder="Ex: une femme élégante dans un jardin secret au crépuscule..." rows={4} />
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


function PlaceholderTab({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center h-64">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Cette fonctionnalité est en cours de développement et sera bientôt disponible.
        </p>
      </CardContent>
    </Card>
  )
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
            <PlaceholderTab 
              title="Générateur de Vidéo"
              description="Créez de courtes vidéos promotionnelles à partir de texte ou d'images."
              icon={Video}
            />
          </TabsContent>
          <TabsContent value="audio" className="mt-6">
             <PlaceholderTab 
              title="Générateur Audio (Text-to-Speech)"
              description="Transformez vos textes en messages audio avec une voix naturelle."
              icon={Mic}
            />
          </TabsContent>
        </Tabs>
    </div>
  );
}
