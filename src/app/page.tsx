
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
import { ArrowRight, Search } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore } from '@/firebase';
import type { BlogArticle } from '@/lib/types';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import AgeGate from '@/components/features/auth/age-gate';

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
            <Link href={`/blog/${article.id}`}>
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
              <h3 className="font-headline text-xl font-semibold mb-3 flex-1 line-clamp-2">
                <Link href={`/blog/${article.id}`} className="hover:text-primary transition-colors">{article.title}</Link>
              </h3>
              <Button variant="link" asChild className="p-0 self-start">
                  <Link href={`/blog/${article.id}`}>Lire la suite <ArrowRight className="ml-2 h-4 w-4" /></Link>
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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const queryValue = formData.get('query');
    const searchParams = new URLSearchParams();

    if (queryValue) {
      searchParams.set('q', queryValue.toString());
    }
    router.push(`/recherche?${searchParams.toString()}`);
  };

  return (
    <>
    <AgeGate />
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative h-[90vh] w-full flex items-center justify-center">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover object-center opacity-30"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-foreground drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
              Élixir Sensuel
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-foreground/80 drop-shadow-md">
              La destination privilégiée pour des rencontres et des contenus uniques.
            </p>
            
            <form onSubmit={handleSearch} className="mt-8 w-full max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input name="query" type="text" placeholder="Rechercher un créateur, un service, un lieu..." className="h-14 pl-12 pr-16 text-lg rounded-full shadow-lg bg-card/80 backdrop-blur-sm border-primary/30 focus:ring-primary" />
                <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-11 w-11">
                  <Search className="h-5 w-5" />
                   <span className="sr-only">Rechercher</span>
                </Button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/recherche?q=escorte" className="px-4 py-2 bg-card/50 rounded-full border border-transparent hover:border-primary/50 transition-colors">Escortes</Link>
                <Link href="/recherche?q=massage" className="px-4 py-2 bg-card/50 rounded-full border border-transparent hover:border-primary/50 transition-colors">Massages</Link>
                <Link href="/recherche?q=paris" className="px-4 py-2 bg-card/50 rounded-full border border-transparent hover:border-primary/50 transition-colors">Paris</Link>
                <Link href="/recherche?q=photographe" className="px-4 py-2 bg-card/50 rounded-full border border-transparent hover:border-primary/50 transition-colors">Photographes</Link>
            </div>
          </div>
        </section>

        <div className="space-y-24 md:space-y-32 py-16 md:py-24 bg-background">
        
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
                    quote="Élixir Sensuel a transformé ma façon de créer du contenu. La plateforme est intuitive et les outils IA sont incroyables."
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
              <Card className="bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground p-8 md:p-12">
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
    </>
  );
}
