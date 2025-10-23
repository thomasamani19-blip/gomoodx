'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from 'react';
import { ThemeSwitcher } from '@/components/theme-switcher';

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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AgeGate />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-background-dark transition-colors duration-700 p-4">

        {/* Logo avec halo lumineux */}
        <div className="halo mb-6">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]">
            GoMoodX
          </h1>
        </div>

        {/* Carte principale */}
        <div className="p-8 rounded-3xl bg-gradient-gold text-black dark:text-white shadow-glow max-w-md text-center backdrop-blur-md">
          <p className="opacity-90 mb-5 text-lg">
            Découvrez votre humeur à travers la lumière et la vibration dorée ✨
          </p>

          <Button asChild className="bg-gradient-neon text-white px-6 py-3 rounded-2xl font-semibold shadow-neon hover:scale-105 transition-all duration-300 h-auto text-base">
            <Link href="/inscription">
                Commencer l’expérience 🌟
            </Link>
          </Button>
        </div>

        <div className='absolute top-4 right-4'>
            <ThemeSwitcher />
        </div>
      </div>

       <style jsx global>{`
        .halo {
          position: relative;
          display: inline-block;
        }

        .halo::before {
          content: "";
          position: absolute;
          inset: -40px;
          background: radial-gradient(circle, hsl(var(--primary) / 0.4), transparent);
          filter: blur(50px);
          opacity: 0.7;
          border-radius: 50%;
          animation: haloPulse 4s ease-in-out infinite;
        }

        @keyframes haloPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
