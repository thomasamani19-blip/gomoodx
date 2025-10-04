'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/page-header';
import { suggerePublicationReseauxSociaux, type SuggestionPublicationReseauxSociauxOutput } from '@/ai/flows/suggere-publication-reseaux-sociaux';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PostsSociauxPage() {
  const [result, setResult] = useState<SuggestionPublicationReseauxSociauxOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      theme: formData.get('theme') as string,
      reseauSocial: formData.get('reseauSocial') as string,
      style: formData.get('style') as string,
      nombreSuggestions: 3,
    };

    try {
      const response = await suggerePublicationReseauxSociaux(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération des posts.',
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
          title="Suggestions de Posts"
          description="Besoin d'inspiration pour vos réseaux sociaux ? Laissez l'IA vous aider."
        />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Thème de la publication</Label>
                <Input name="theme" id="theme" placeholder="Ex: conseils beauté, citation du jour..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style de la publication</Label>
                <Input name="style" id="style" placeholder="Ex: humoristique, informatif, provocateur..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reseauSocial">Réseau social</Label>
                <Select name="reseauSocial" defaultValue="Instagram">
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un réseau" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="Twitter">Twitter / X</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Suggérer des Posts
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <PageHeader title="Suggestions" description="Copiez et collez ces suggestions sur vos réseaux." />
        <Card className="min-h-[300px]">
            <CardContent className="pt-6">
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                {result && (
                    <div className="space-y-6">
                        {result.suggestions.map((suggestion, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-muted/50">
                                <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && !result && <p className="text-sm text-muted-foreground">Les suggestions de posts apparaîtront ici.</p>}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
