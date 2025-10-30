
'use client';

import { AnnonceCarousel } from '@/components/features/annonces/annonce-carousel';
import { CreatorCarousel } from '@/components/features/creators/creator-carousel';
import { EstablishmentCarousel } from '@/components/features/partners/establishment-carousel';
import { ProducerCarousel } from '@/components/features/partners/producer-carousel';
import { ProductCarousel } from '@/components/features/products/product-carousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Star, Building, Camera, Sparkles, Heart, Search, Gift, ShieldCheck, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center gap-4">
        <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
            <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-headline text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
)

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center text-center text-white bg-black">
             <Image
                src="https://images.unsplash.com/photo-1644083589147-55edf02a5b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8Ym91ZG9pciUyMHNlbnN1YWx8ZW58MHx8fHwxNzU5NjAxODMzfDA&ixlib=rb-4.1.0&q=80&w=1920"
                alt="Élégance et séduction"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative z-10 p-4">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">
                    Élixir Sensuel
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-primary-foreground/80">
                    Découvrez un univers de contenus exclusifs et d'expériences uniques, créés pour éveiller vos sens.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/inscription">
                            Rejoindre la Communauté <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                     <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                        Découvrir les Créateurs
                    </Button>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Une Plateforme d'Exception</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Conçue pour les créateurs, les partenaires et les membres exigeants.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                <FeatureCard icon={Search} title="Découvrez" description="Explorez une sélection exclusive de profils, de contenus et de services proposés par nos créateurs vérifiés."/>
                <FeatureCard icon={Heart} title="Connectez" description="Interagissez via la messagerie privée, les appels vidéo ou en rejoignant des sessions live uniques."/>
                <FeatureCard icon={Gift} title="Profitez" description="Achetez du contenu premium, réservez des expériences inoubliables et soutenez vos créateurs favoris."/>
            </div>
          </div>
        </section>


        {/* Creators Carousel */}
        <section className="py-16 md:py-24 bg-secondary/50">
            <div className="container">
                <h2 className="text-3xl font-bold font-headline mb-8 text-center flex items-center justify-center gap-3"><Star className="h-8 w-8 text-primary" />Créateurs à la Une</h2>
                <CreatorCarousel />
            </div>
        </section>

        {/* Services/Annonces Carousel */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container">
                <h2 className="text-3xl font-bold font-headline mb-8 text-center">Expériences Exclusives</h2>
                <AnnonceCarousel />
            </div>
        </section>

        {/* Products Carousel */}
        <section className="py-16 md:py-24 bg-secondary/50">
            <div className="container">
                <h2 className="text-3xl font-bold font-headline mb-8 text-center">Boutique Premium</h2>
                 <ProductCarousel />
            </div>
        </section>
        
         {/* Partners Sections */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container space-y-16">
                 <div>
                    <h2 className="text-3xl font-bold font-headline mb-8 text-center flex items-center justify-center gap-3"><Building className="h-8 w-8 text-primary"/>Établissements Partenaires</h2>
                    <EstablishmentCarousel />
                </div>
                 <div>
                    <h2 className="text-3xl font-bold font-headline mb-8 text-center flex items-center justify-center gap-3"><Camera className="h-8 w-8 text-primary"/>Producteurs Partenaires</h2>
                    <ProducerCarousel />
                </div>
            </div>
        </section>

         {/* Final CTA */}
        <section className="py-16 md:py-24 text-center bg-secondary/50">
            <div className="container">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Prêt à vivre l'expérience GoMoodX ?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                    Rejoignez une communauté où l'exclusivité, la sécurité et la créativité sont au premier plan.
                </p>
                <Button size="lg" asChild>
                    <Link href="/inscription">
                        Créer mon compte
                    </Link>
                </Button>
            </div>
        </section>
      </main>
    </div>
  );
}
