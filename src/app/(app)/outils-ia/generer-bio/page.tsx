'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/page-header';
import { genererBioEscorte, type GenererBioEscorteOutput } from '@/ai/flows/generer-bio-escorte';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GenererBioPage() {
  const [result, setResult] = useState<GenererBioEscorteOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      typeDeService: formData.get('typeDeService') as string,
      personnalite: formData.get('personnalite') as string,
      gouts: formData.get('gouts') as string,
      attentesClients: formData.get('attentesClients') as string,
    };

    try {
      const response = await genererBioEscorte(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération de la bio.',
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
          title="Générateur de Bio IA"
          description="Remplissez les champs ci-dessous pour créer une biographie unique et attrayante."
        />
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typeDeService">Type de service</Label>
                <Input name="typeDeService" id="typeDeService" placeholder="Ex: rencontres, massages, accompagnement..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personnalite">Votre personnalité</Label>
                <Input name="personnalite" id="personnalite" placeholder="Ex: charmante, aventureuse, douce..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gouts">Vos goûts et passions</Label>
                <Input name="gouts" id="gouts" placeholder="Ex: voyages, gastronomie, art, musique..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attentesClients">Vos attentes envers les clients</Label>
                <Input name="attentesClients" id="attentesClients" placeholder="Ex: respect, discrétion, bonne humeur..." />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Générer la Bio
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
      <div>
        <PageHeader title="Résultat" description="Voici la biographie générée par l'IA." />
        <Card className="min-h-[300px]">
          <CardContent className="pt-6">
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {result && <p className="text-sm text-foreground whitespace-pre-wrap">{result.bio}</p>}
            {!isLoading && !result && <p className="text-sm text-muted-foreground">Le résultat de la génération apparaîtra ici.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
