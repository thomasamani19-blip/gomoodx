
'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/page-header';
import { rechercheMultilingue, type RechercheMultilingueOutput } from '@/ai/flows/recherche-multilingue';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const langues = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'it', label: 'Italiano' },
    { value: 'ar', label: 'العربية' },
];

function RechercheComponent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [result, setResult] = useState<RechercheMultilingueOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const { toast } = useToast();

  const performSearch = async (searchQuery: string, langSource: string, langCible: string, filtres: Record<string, boolean>) => {
    if (!searchQuery) return;
    setIsLoading(true);
    setResult(null);

    const input = {
      query: searchQuery,
      langueSource: langSource as 'fr' | 'en' | 'es' | 'it' | 'ar',
      langueCible: langCible as 'fr' | 'en' | 'es' | 'it' | 'ar',
      filtres: filtres,
    };

    try {
      const response = await rechercheMultilingue(input);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la recherche.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtres: Record<string, boolean> = {};
    for (const [key, value] of searchParams.entries()) {
        if(key !== 'q') {
            filtres[key] = value === 'true';
        }
    }

    if (initialQuery || Object.keys(filtres).length > 0) {
        performSearch(initialQuery, 'fr', 'fr', filtres);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initialQuery]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const langSource = formData.get('langueSource') as string;
    const langCible = formData.get('langueCible') as string;
    
    // Récupérer les filtres actuels de l'URL pour les conserver lors d'une nouvelle recherche manuelle
    const filtres: Record<string, boolean> = {};
     for (const [key, value] of searchParams.entries()) {
        if(key !== 'q') {
            filtres[key] = value === 'true';
        }
    }

    performSearch(query, langSource, langCible, filtres);
  };

  return (
    <div>
        <PageHeader
          title="Recherche Multilingue"
          description="Trouvez des profils et du contenu dans votre langue."
        />
        <Card>
            <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 grid sm:grid-cols-4 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="query">Terme de recherche</Label>
                        <Input name="query" id="query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Que cherchez-vous ?" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="langueSource">Votre langue</Label>
                        <Select name="langueSource" defaultValue="fr">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{langues.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="langueCible">Langue des résultats</Label>
                        <Select name="langueCible" defaultValue="fr">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{langues.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Rechercher
                </Button>
                </CardFooter>
            </form>
        </Card>

        <div className="mt-8">
            <h2 className="font-headline text-2xl mb-4">Résultats</h2>
            {isLoading && (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {result && result.length > 0 && (
                <div className="grid gap-4">
                    {result.map((item, index) => (
                        <Card key={index}>
                           <CardHeader>
                               <CardTitle className="flex items-center gap-2">
                                  <span className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${item.type === 'profil' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{item.type}</span>
                                  <Link href={item.url} className="hover:underline">{item.titre}</Link>
                                </CardTitle>
                           </CardHeader>
                           <CardContent>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            {result && result.length === 0 && <p className="text-sm text-muted-foreground">Aucun résultat trouvé pour votre recherche.</p>}
            {!isLoading && !result && <p className="text-sm text-muted-foreground">Les résultats de la recherche apparaîtront ici.</p>}
        </div>
    </div>
  );
}

export default function RecherchePage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <RechercheComponent />
        </Suspense>
    )
}
