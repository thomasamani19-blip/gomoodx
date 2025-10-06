
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/page-header';
import { genererArticleBlog, type GenererArticleBlogOutput } from '@/ai/flows/generer-article-blog';
import { Loader2, Wand2, Save, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function GenererArticlePage() {
  const [result, setResult] = useState<GenererArticleBlogOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      sujet: formData.get('sujet') as string,
      motsCles: formData.get('motsCles') as string,
      ton: formData.get('ton') as string,
    };

    if (!input.sujet) {
        toast({ title: "Le sujet est requis", variant: "destructive" });
        setIsGenerating(false);
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
      setIsGenerating(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!result || !user || !firestore) {
        toast({ title: "Erreur", description: "Aucun article à enregistrer ou utilisateur non connecté.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    try {
        await addDoc(collection(firestore, 'blog'), {
            title: result.title,
            content: result.content,
            authorName: user.displayName,
            authorId: user.id,
            date: serverTimestamp(),
            imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
            imageHint: 'abstract background',
        });
        toast({ title: "Article Enregistré !", description: "Votre article a été ajouté à votre blog."});
        router.push('/gestion/articles');
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'article :", error);
        toast({ title: "Erreur", description: "Impossible d'enregistrer l'article.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleCopy = () => {
    if (result) {
        navigator.clipboard.writeText(`## ${result.titre}\n\n${result.contenu}`);
        toast({ title: "Copié !", description: "Le titre et le contenu de l'article ont été copiés." });
    }
  }

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
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Générer l'Article
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <PageHeader title="Résultat" description="Voici l'article généré. Vous pouvez le copier ou l'enregistrer." />
        <Card className="min-h-[400px]">
          <CardHeader>
            {result && (
                <div className="flex gap-2">
                    <Button onClick={handleSaveArticle} disabled={isSaving || authLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer l'Article
                    </Button>
                     <Button variant="outline" onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copier
                    </Button>
                </div>
            )}
          </CardHeader>
          <CardContent>
            {isGenerating && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {result && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h2>{result.titre}</h2>
                    <p className="whitespace-pre-wrap">{result.contenu}</p>
                </div>
            )}
            {!isGenerating && !result && <p className="text-sm text-muted-foreground">Le résultat de la génération apparaîtra ici.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
