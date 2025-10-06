
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { GoMoodXLogo } from '@/components/GoMoodXLogo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '../theme-switcher';

const navItems = [
  { label: 'Accueil', href: '/' },
  { label: 'Annonces', href: '/annonces' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Live', href: '/live' },
  { label: 'Blog', href: '/blog' },
];

export function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search');
    if (query) {
      router.push(`/recherche?q=${query}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <GoMoodXLogo className="mr-8" />
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4">
          <form onSubmit={handleSearch} className="relative hidden w-full max-w-xs sm:block">
            <Input type="search" name="search" placeholder="Rechercher..." className="pl-10 bg-black/20 border-primary/20 focus:bg-black/30" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </form>

          <ThemeSwitcher />

          {user ? (
             <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/dashboard">Tableau de bord</Link>
             </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/connexion">Connexion</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/inscription">S'inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
