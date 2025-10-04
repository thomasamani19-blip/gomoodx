'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/page-header';
import { ideesContenuVisuel, type IdeesContenuVisuelOutput } from '@/ai/flows/idees-contenu-visuel';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IdeesContenuPage() {
  const [result, setResult] = useState<IdeesContenuVisuelOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      theme: formData.get('theme') as string,
      style: formData.get('style') as string,
      objectifs: formData.get('objectifs') as string,
      typeDeContenu: formData.get('typeDeContenu') as "image" | "video" | "les deux",
    };

    try {
      const response = await ideesContenuVisuel(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération des idées.',
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
          title="Idées de Contenu Visuel"
          description="Décrivez ce que vous cherchez et laissez l'IA vous proposer des idées créatives."
        />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Thème général</Label>
                <Input name="theme" id="theme" placeholder="Ex: luxe, voyage, fétichisme..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style souhaité</Label>
                <Input name="style" id="style" placeholder="Ex: artistique, humoristique, provocateur..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectifs">Objectifs du contenu</Label>
                <Input name="objectifs" id="objectifs" placeholder="Ex: attirer de nouveaux abonnés, promouvoir un produit..." />
              </div>
               <div className="space-y-2">
                <Label htmlFor="typeDeContenu">Type de contenu</Label>
                <Select name="typeDeContenu" defaultValue="les deux">
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Vidéo</SelectItem>
                        <SelectItem value="les deux">Les deux</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Générer des Idées
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <PageHeader title="Idées Suggérées" description="Parcourez les suggestions de l'IA." />
        <Card className="min-h-[300px]">
          <CardContent className="pt-6">
             {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {result && (
                <ul className="space-y-3 list-disc list-inside">
                    {result.idees.map((idee, index) => (
                        <li key={index} className="text-sm">{idee}</li>
                    ))}
                </ul>
            )}
            {!isLoading && !result && <p className="text-sm text-muted-foreground">Les idées suggérées apparaîtront ici.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
