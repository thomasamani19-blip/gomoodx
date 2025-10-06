
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/page-header';
import { genererScenarioVideo, type GenererScenarioVideoOutput } from '@/ai/flows/generer-scenario-video';
import { Loader2, Wand2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple Markdown-to-HTML converter
const Markdown = ({ content }: { content: string }) => {
    const html = content
      .replace(/^### (.*$)/gim, '<h3 class="font-headline text-xl mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="font-headline text-2xl mt-8 mb-4 border-b pb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n').map(p => p.trim() ? `<p class="mb-2">${p}</p>` : '').join('');

    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function GenererScenarioPage() {
  const [result, setResult] = useState<GenererScenarioVideoOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      sujet: formData.get('sujet') as string,
      ton: formData.get('ton') as string,
      duree: formData.get('duree') as string,
    };

    if (!input.sujet) {
        toast({ title: "Le sujet est requis", variant: "destructive" });
        setIsGenerating(false);
        return;
    }

    try {
      const response = await genererScenarioVideo(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la génération du scénario.",
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = () => {
    if (result) {
        const textToCopy = `Titre: ${result.titre}\n\nSynopsis: ${result.synopsis}\n\n---\n\n${result.scenario}`;
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "Copié !", description: "Le scénario a été copié dans le presse-papiers." });
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <PageHeader
          title="Générateur de Scénario Vidéo"
          description="Transformez une idée en un scénario vidéo structuré pour votre prochain contenu."
        />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sujet">Idée ou sujet de la vidéo</Label>
                <Textarea name="sujet" id="sujet" placeholder="Ex: Un tutoriel de massage sensuel, une vidéo Q&R intime, un court-métrage romantique..." required rows={3}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ton">Ton de la vidéo</Label>
                    <Select name="ton" defaultValue="sensuel">
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un ton" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sensuel">Sensuel</SelectItem>
                            <SelectItem value="romantique">Romantique</SelectItem>
                            <SelectItem value="humoristique">Humoristique</SelectItem>
                            <SelectItem value="éducatif">Éducatif</SelectItem>
                            <SelectItem value="artistique">Artistique</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duree">Durée approximative</Label>
                    <Input name="duree" id="duree" placeholder="Ex: 5 minutes" defaultValue="5 minutes" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Générer le Scénario
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <PageHeader title="Résultat" description="Voici le scénario généré. Vous pouvez le copier pour l'utiliser." />
        <Card className="min-h-[400px]">
          <CardHeader>
            {result && (
                <div className="flex gap-2">
                     <Button variant="outline" onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copier
                    </Button>
                </div>
            )}
          </CardHeader>
          <CardContent>
            {isGenerating && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">L'IA rédige votre scénario...</p>
                </div>
            )}
            {result && (
                <div>
                    <h2 className="font-headline text-2xl font-bold mb-2">{result.titre}</h2>
                    <p className="text-sm italic text-muted-foreground mb-6">{result.synopsis}</p>
                    <Markdown content={result.scenario} />
                </div>
            )}
            {!isGenerating && !result && <p className="text-sm text-muted-foreground p-8 text-center">Le scénario généré par l'IA apparaîtra ici.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
