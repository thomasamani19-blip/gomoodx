
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Menu, Search } from 'lucide-react';
import { GoMoodXLogo } from '@/components/GoMoodXLogo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '../theme-switcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navItems = [
  { label: 'Accueil', href: '/' },
  { label: 'Annonces', href: '/annonces' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Live', href: '/live' },
  { label: 'Blog', href: '/blog' },
  { label: 'Recherche', href: '/recherche' },
];

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        
        {/* Desktop Navigation */}
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

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
           <ThemeSwitcher />

          {/* Auth buttons for desktop */}
          <div className="hidden md:flex items-center gap-2">
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
          
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="p-4">
                  <GoMoodXLogo className="mb-8" />
                  <nav className="flex flex-col gap-4">
                    {navItems.map(item => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="text-lg font-medium transition-colors hover:text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-8 pt-8 border-t border-border/50">
                     {user ? (
                       <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Tableau de bord</Link>
                       </Button>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Button variant="ghost" asChild className="w-full text-lg">
                          <Link href="/connexion" onClick={() => setIsMobileMenuOpen(false)}>Connexion</Link>
                        </Button>
                        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                          <Link href="/inscription" onClick={() => setIsMobileMenuOpen(false)}>S'inscrire</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
