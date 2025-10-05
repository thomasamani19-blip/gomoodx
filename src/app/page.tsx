'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CreatorCarousel } from '@/components/features/creators/creator-carousel';
import { ProductCarousel } from '@/components/features/products/product-carousel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Heart, Users } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Placeholder component until AnnonceCarousel is created
const AnnonceCarousel = () => (
    <p className="text-center text-muted-foreground">Le carrousel des annonces apparaîtra ici.</p>
);

const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
    <Card className="bg-card/50 border-primary/20">
        <CardContent className="pt-6">
            <blockquote className="text-lg italic">"{quote}"</blockquote>
            <p className="mt-4 font-bold text-right text-primary">~ {author}, <span className="font-normal text-sm text-foreground">{role}</span></p>
        </CardContent>
    </Card>
)

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-main');

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-black via-background to-background">
      <Header />
      <main className="flex-1">
        <section className="relative h-[70vh] w-full">
          {heroImage && (
            <Image
              src="https://images.unsplash.com/photo-1517832626593-32a3cf17142b?q=80&w=2070&auto=format&fit=crop"
              alt="Ambiance Nuit Dorée"
              fill
              className="object-cover opacity-50"
              data-ai-hint="gold luxury night"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold drop-shadow-[0_2px_2px_rgba(255,190,0,0.5)] text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-500">
              GoMoodX
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow-md">
              Rejoignez la communauté la plus sensuelle du web.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Link href="/inscription">Devenez Membre</Link>
            </Button>
          </div>
        </section>

        <div className="space-y-24 py-16">
          <section className="container mx-auto px-4">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">Créateurs Populaires</h2>
            <CreatorCarousel />
          </section>

          <section className="container mx-auto px-4">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">Annonces à la Une</h2>
             <AnnonceCarousel />
          </section>

           <section className="container mx-auto px-4">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">Boutique Tendance</h2>
            <ProductCarousel />
          </section>
          
          <section className="container mx-auto px-4">
             <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">Récompenses & Parrainage</h2>
             <Card className="bg-gradient-to-br from-card to-background border-primary/30">
                <CardHeader>
                    <CardTitle>Boostez Vos Gains</CardTitle>
                    <CardDescription>Notre programme de récompenses et de parrainage est conçu pour valoriser votre activité sur GoMoodX.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <Gift className="h-10 w-10 text-primary" />
                        <h3 className="font-semibold text-lg">Gagnez des Points</h3>
                        <p className="text-sm text-muted-foreground">Recevez des points pour chaque vente, chaque appel vidéo et chaque objectif atteint.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 text-primary" />
                        <h3 className="font-semibold text-lg">Parrainez vos Amis</h3>
                        <p className="text-sm text-muted-foreground">Invitez de nouveaux membres et gagnez des bonus pour vous et vos filleuls.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Heart className="h-10 w-10 text-primary" />
                        <h3 className="font-semibold text-lg">Profitez des Avantages</h3>
                        <p className="text-sm text-muted-foreground">Convertissez vos points en crédits, en cadeaux ou en boost de visibilité.</p>
                    </div>
                </CardContent>
             </Card>
          </section>

          <section className="container mx-auto px-4">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">Témoignages</h2>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
