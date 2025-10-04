import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const sections = [
  {
    title: 'Services Populaires',
    items: PlaceHolderImages.filter(img => img.id.startsWith('service')),
    link: '/services',
  },
  {
    title: 'Créateurs en Tendance',
    items: PlaceHolderImages.filter(img => img.id.startsWith('creator')),
    link: '/creators',
  },
  {
    title: 'Nouveautés Boutique',
    items: PlaceHolderImages.filter(img => img.id.startsWith('product')),
    link: '/shop',
  },
  {
    title: 'En Direct Maintenant',
    items: PlaceHolderImages.filter(img => img.id.startsWith('live')),
    link: '/live',
  },
  {
    title: 'Derniers Articles',
    items: PlaceHolderImages.filter(img => img.id.startsWith('blog')),
    link: '/blog',
  },
];

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-main');

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
              <Link href="/connexion">Rejoignez-nous</Link>
            </Button>
          </div>
        </section>

        <div className="space-y-16 py-16">
          {sections.map(section => (
            <section key={section.title} className="container mx-auto px-4">
              <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center">
                {section.title}
              </h2>
              <Carousel
                opts={{
                  align: 'start',
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {section.items.map((item, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                          <CardContent className="flex aspect-[4/3] items-center justify-center p-0 relative">
                            <Image
                              src={item.imageUrl}
                              alt={item.description}
                              fill
                              className="object-cover"
                              data-ai-hint={item.imageHint}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <span className="absolute bottom-4 left-4 font-headline text-xl text-white drop-shadow-md">
                              {item.description}
                            </span>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
