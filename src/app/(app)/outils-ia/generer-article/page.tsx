
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/page-header';
import { genererArticleBlog, type GenererArticleBlogOutput } from '@/ai/flows/generer-article-blog';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GenererArticlePage() {
  const [result, setResult] = useState<GenererArticleBlogOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      sujet: formData.get('sujet') as string,
      motsCles: formData.get('motsCles') as string,
      ton: formData.get('ton') as string,
    };

    if (!input.sujet) {
        toast({ title: "Le sujet est requis", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const response = await genererArticleBlog(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la génération de l'article.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <PageHeader
          title="Générateur d'Article IA"
          description="Transformez une simple idée en un article de blog complet et structuré."
        />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sujet">Sujet de l'article</Label>
                <Input name="sujet" id="sujet" placeholder="Ex: Les secrets d'un massage réussi" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motsCles">Mots-clés (séparés par des virgules)</Label>
                <Input name="motsCles" id="motsCles" placeholder="Ex: bien-être, relaxation, huiles essentielles" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ton">Ton de l'article</Label>
                <Select name="ton" defaultValue="informatif">
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un ton" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="informatif">Informatif</SelectItem>
                        <SelectItem value="séducteur">Séducteur</SelectItem>
                        <SelectItem value="humoristique">Humoristique</SelectItem>
                        <SelectItem value="professionnel">Professionnel</SelectItem>
                        <SelectItem value="poétique">Poétique</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Générer l'Article
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <PageHeader title="Résultat" description="Voici l'article généré. Vous pouvez le copier et le modifier." />
        <Card className="min-h-[400px]">
          <CardContent className="pt-6">
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {result && (
                <div className="prose prose-sm prose-invert max-w-none">
                    <h2>{result.titre}</h2>
                    <p className="whitespace-pre-wrap">{result.contenu}</p>
                </div>
            )}
            {!isLoading && !result && <p className="text-sm text-muted-foreground">Le résultat de la génération apparaîtra ici.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
