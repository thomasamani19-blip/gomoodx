
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/page-header';
import { rechercheMultilingue, type RechercheMultilingueOutput } from '@/ai/flows/recherche-multilingue';
import { Loader2, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const langues = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'it', label: 'Italiano' },
    { value: 'ar', label: 'العربية' },
];

interface Filters {
    types: ('profil' | 'contenu')[];
    priceRange: [number, number];
    location: string;
}

const ResultCard = ({ item }: { item: RechercheMultilingueOutput[0] }) => (
    <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
            <Link href={item.url} className="flex items-start gap-4">
                <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                     {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.titre} fill className="object-cover" />
                    ) : (
                        <Avatar className="h-20 w-20 rounded-md">
                            <AvatarFallback className="text-xl rounded-md">{item.titre.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${item.type === 'profil' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'}`}>{item.type}</span>
                        <h3 className="font-semibold line-clamp-1">{item.titre}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                     {item.price != null && <p className="text-sm font-bold text-primary mt-1">{item.price.toFixed(2)} €</p>}
                </div>
            </Link>
        </CardContent>
    </Card>
);

function RechercheComponent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [result, setResult] = useState<RechercheMultilingueOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<Filters>({
      types: ['profil', 'contenu'],
      priceRange: [0, 5000],
      location: '',
  });

  const performSearch = async (searchQuery: string, currentFilters: Filters) => {
    if (!searchQuery && !currentFilters.location) {
        setResult([]); // Clear results if query is empty
        return;
    }
    setIsLoading(true);
    setResult(null);

    const input = {
      query: searchQuery,
      langueSource: 'fr' as 'fr',
      langueCible: 'fr' as 'fr',
      types: currentFilters.types,
      priceMin: currentFilters.priceRange[0],
      priceMax: currentFilters.priceRange[1] === 5000 ? undefined : currentFilters.priceRange[1], // Don't send max if it's the default highest
      location: currentFilters.location,
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
    if (initialQuery) {
        performSearch(initialQuery, filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Debounce for search on query change
  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query, filters);
    }, 500); 

    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Immediate search for filter changes
   const handleFilterChange = (newFilters: Filters) => {
      setFilters(newFilters);
      performSearch(query, newFilters);
   }

  const handleTypeChange = (type: 'profil' | 'contenu', checked: boolean | string) => {
    handleFilterChange({
        ...filters,
        types: checked ? [...filters.types, type] : filters.types.filter(t => t !== type),
    });
  };

  return (
    <div>
        <PageHeader
          title="Recherche Avancée"
          description="Trouvez des profils, services et contenus sur mesure."
        />
        <div className="grid md:grid-cols-4 gap-8 items-start">
            {/* Filters Sidebar */}
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5"/> Filtres</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Catégories</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="type-profil" checked={filters.types.includes('profil')} onCheckedChange={(c) => handleTypeChange('profil', c)} />
                                <Label htmlFor="type-profil">Profils</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="type-contenu" checked={filters.types.includes('contenu')} onCheckedChange={(c) => handleTypeChange('contenu', c)} />
                                <Label htmlFor="type-contenu">Contenus & Services</Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Fourchette de prix</Label>
                             <Slider
                                value={filters.priceRange}
                                onValueChange={(value) => handleFilterChange({...filters, priceRange: value as [number, number]})}
                                max={5000}
                                step={10}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{filters.priceRange[0]}€</span>
                                <span>{filters.priceRange[1] >= 5000 ? '5000€+' : `${filters.priceRange[1]}€`}</span>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Localisation</Label>
                            <Input id="location" placeholder="Ex: Paris" value={filters.location} onChange={(e) => handleFilterChange({...filters, location: e.target.value})}/>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Search Results */}
            <div className="md:col-span-3 space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        placeholder="Rechercher par mot-clé..."
                        className="pl-10 h-12 text-lg"
                    />
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    </div>
                )}
                
                {result && (
                    <p className="text-sm text-muted-foreground">{result.length} résultat(s) trouvé(s).</p>
                )}

                {result && result.length > 0 && (
                    <div className="grid gap-4">
                        {result.map((item, index) => (
                            <ResultCard key={item.url + index} item={item} />
                        ))}
                    </div>
                )}

                {!isLoading && result && result.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            Aucun résultat trouvé pour votre recherche. Essayez d'ajuster vos filtres ou votre recherche.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}

export default function RecherchePage() {
    return (
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto mt-16" />}>
            <RechercheComponent />
        </Suspense>
    )
}
