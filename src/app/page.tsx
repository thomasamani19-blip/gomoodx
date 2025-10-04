'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useCollection } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Creator, Product, Service } from '@/lib/types';
import { CreatorCarousel } from '@/components/features/creators/creator-carousel';
import { ProductCarousel } from '@/components/features/products/product-carousel';
import { ServiceCarousel } from '@/components/features/services/service-carousel';

// This is a mock of what could be a "sections" collection in Firestore
// to dynamically build the homepage.
const MOCK_SECTIONS = [
    { id: 'services', title: 'Services Populaires', link: '/services', type: 'service' },
    { id: 'creators', title: 'Créateurs en Tendance', link: '/creators', type: 'creator' },
    { id: 'products', title: 'Nouveautés Boutique', link: '/shop', type: 'product' },
    // { id: 'live', title: 'En Direct Maintenant', link: '/live', type: 'live' },
    // { id: 'blog', title: 'Derniers Articles', link: '/blog', type: 'blog' },
]

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-main');
  const { data: sections, loading } = useCollection<{id: string; title: string; link: string; type: string;}>('sections');

  const renderCarousel = (section: { id: string; title: string; link: string; type: string; }) => {
    switch (section.type) {
      case 'creator':
        return <CreatorCarousel />;
      case 'product':
        return <ProductCarousel />;
      case 'service':
        return <ServiceCarousel />;
      default:
        return null;
    }
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold drop-shadow-lg">
              GoMoodX
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow-md">
              Explorez un univers de désirs, de rencontres et de contenus exclusifs.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard">Rejoignez-nous</Link>
            </Button>
          </div>
        </section>

        <div className="space-y-16 py-16">
          {(sections ?? MOCK_SECTIONS).map(section => (
            <section key={section.id} className="container mx-auto px-4">
              <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">
                {section.title}
              </h2>
              {renderCarousel(section)}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
