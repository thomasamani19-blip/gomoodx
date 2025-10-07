
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CreatorCarousel } from '@/components/features/creators/creator-carousel';
import { AnnonceCarousel } from '@/components/features/annonces/annonce-carousel';
import { ProductCarousel } from '@/components/features/products/product-carousel';
import { EstablishmentCarousel } from '@/components/features/partners/establishment-carousel';
import { ProducerCarousel } from '@/components/features/partners/producer-carousel';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Search, Wand2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore } from '@/firebase';
import type { BlogArticle } from '@/lib/types';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
    <Card className="bg-card/50 border-primary/20 flex flex-col justify-between">
        <CardContent className="pt-6">
            <blockquote className="text-lg italic">"{quote}"</blockquote>
            <p className="mt-4 font-bold text-right text-primary">~ {author}, <span className="font-normal text-sm text-foreground">{role}</span></p>
        </CardContent>
    </Card>
)

function LatestBlogPosts() {
    const firestore = useFirestore();
    const articlesQuery = query(collection(firestore, 'blog'), orderBy('date', 'desc'), limit(3));
    const { data: articles, loading } = useCollection<BlogArticle>(articlesQuery);
  
    if (loading) {
      return (
        <div className="grid md:grid-cols-3 gap-8">
            <Card><CardContent className="p-4"><Skeleton className="h-48 w-full mb-4" /><Skeleton className="h-6 w-3/4" /></CardContent></Card>
            <Card><CardContent className="p-4"><Skeleton className="h-48 w-full mb-4" /><Skeleton className="h-6 w-3/4" /></CardContent></Card>
            <Card><CardContent className="p-4"><Skeleton className="h-48 w-full mb-4" /><Skeleton className="h-6 w-3/4" /></CardContent></Card>
        </div>
      )
    }
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles && articles.map((article) => (
          <Card key={article.id} className="overflow-hidden group flex flex-col">
            <Link href="/blog">
              <div className="relative aspect-video">
                <Image
                  src={article.imageUrl || 'https://picsum.photos/seed/blogpost/600/400'}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </Link>
            <CardContent className="p-6 flex flex-col flex-1">
               <p className="text-sm text-muted-foreground mb-2">
                  {article.date ? format(article.date.toDate(), "d MMMM yyyy", { locale: fr }) : 'Date inconnue'}
              </p>
              <h3 className="font-headline text-xl font-semibold mb-3 flex-1 line-clamp-2">{article.title}</h3>
              <Button variant="link" asChild className="p-0 self-start">
                  <Link href="/blog">Lire la suite <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-main');
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, boolean>>({});

  const handleFilterChange = (filterId: string, checked: boolean | string) => {
      setFilters(prev => ({ ...prev, [filterId]: !!checked }));
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query');
    const searchParams = new URLSearchParams();

    if (query) {
      searchParams.set('q', query.toString());
    }

    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            searchParams.set(key, 'true');
        }
    }

    router.push(`/recherche?${searchParams.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-black via-background to-background">
      <Header />
      <main className="flex-1">
        <section className="relative h-[90vh] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover opacity-30"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold drop-shadow-[0_2px_2px_rgba(255,190,0,0.5)]">
              Trouvez l'Expérience Parfaite
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground drop-shadow-md">
              La destination privilégiée pour des rencontres et des contenus exclusifs.
            </p>
            
            <Card className="mt-8 w-full max-w-3xl bg-black/50 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4 md:p-6">
                    <form onSubmit={handleSearch}>
                        <div className="flex w-full items-center space-x-2">
                            <Input name="query" type="text" placeholder="Rechercher par mot-clé, créateur, ou service..." className="h-12 text-base" />
                            <Button type="submit" size="icon" className="h-12 w-12 flex-shrink-0" aria-label="Recherche">
                                <Search className="h-6 w-6" />
                            </Button>
                        </div>
                    
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="cat-rencontre" onCheckedChange={(c) => handleFilterChange('categorie_rencontre', c)} />
                                <Label htmlFor="cat-rencontre" className="text-sm font-light text-gray-300">Rencontre</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="cat-massage" onCheckedChange={(c) => handleFilterChange('categorie_massage', c)} />
                                <Label htmlFor="cat-massage" className="text-sm font-light text-gray-300">Massage</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="cat-media" onCheckedChange={(c) => handleFilterChange('categorie_media', c)} />
                                <Label htmlFor="cat-media" className="text-sm font-light text-gray-300">Média</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="cat-produit" onCheckedChange={(c) => handleFilterChange('categorie_produit', c)} />
                                <Label htmlFor="cat-produit" className="text-sm font-light text-gray-300">Produit</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="cat-live" onCheckedChange={(c) => handleFilterChange('categorie_live', c)} />
                                <Label htmlFor="cat-live" className="text-sm font-light text-gray-300">Live</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="zone-paris" onCheckedChange={(c) => handleFilterChange('zone_paris', c)} />
                                <Label htmlFor="zone-paris" className="text-sm font-light text-gray-300">Paris</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="genre-femme" onCheckedChange={(c) => handleFilterChange('genre_femme', c)} />
                                <Label htmlFor="genre-femme" className="text-sm font-light text-gray-300">Femme</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="prix-luxe" onCheckedChange={(c) => handleFilterChange('prix_luxe', c)} />
                                <Label htmlFor="prix-luxe" className="text-sm font-light text-gray-300">Luxe</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="type-etablissement" onCheckedChange={(c) => handleFilterChange('type_etablissement', c)} />
                                <Label htmlFor="type-etablissement" className="text-sm font-light text-gray-300">Établissement</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="type-producteur" onCheckedChange={(c) => handleFilterChange('type_producteur', c)} />
                                <Label htmlFor="type-producteur" className="text-sm font-light text-gray-300">Producteur</Label>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

          </div>
        </section>

        <div className="space-y-24 md:space-y-32 py-16 md:py-24">
        
          <section className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Créateurs à la Une</h2>
            </div>
            <CreatorCarousel />
          </section>

          <section className="container mx-auto px-4">
             <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Annonces Populaires</h2>
            </div>
             <AnnonceCarousel />
          </section>

           <section className="container mx-auto px-4">
             <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Boutique Exclusive</h2>
            </div>
             <ProductCarousel />
          </section>

           <section className="container mx-auto px-4">
             <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Établissements Partenaires</h2>
            </div>
             <EstablishmentCarousel />
          </section>

           <section className="container mx-auto px-4">
             <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Producteurs Partenaires</h2>
            </div>
             <ProducerCarousel />
          </section>

          <section className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Derniers Articles du Blog</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-4">Plongez dans l'univers de nos créateurs à travers leurs écrits.</p>
            </div>
            <LatestBlogPosts />
          </section>

          <section className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Ce qu'ils en disent</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <TestimonialCard 
                    quote="GoMoodX a transformé ma façon de créer du contenu. La plateforme est intuitive et les outils IA sont incroyables."
                    author="Eva"
                    role="Créatrice"
                />
                 <TestimonialCard 
                    quote="Enfin une plateforme élégante et sécurisée pour interagir avec des créateurs de qualité. L'expérience est premium."
                    author="Alexandre"
                    role="Membre"
                />
            </div>
          </section>

          <section className="container mx-auto px-4">
              <Card className="bg-gradient-to-r from-secondary/80 to-primary/80 text-primary-foreground p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="text-center md:text-left">
                          <h2 className="font-headline text-3xl font-bold">Prêt à rejoindre l'expérience ?</h2>
                          <p className="mt-2 text-lg opacity-90">Inscrivez-vous dès maintenant et découvrez un monde de contenus exclusifs.</p>
                      </div>
                       <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4">
                          <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                              <Link href="/inscription/escorte">Devenir Créateur</Link>
                          </Button>
                          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
                              <Link href="/inscription/client">Devenir Membre</Link>
                          </Button>
                      </div>
                  </div>
              </Card>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}

    