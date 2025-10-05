'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { LogoGoMoodX } from '@/components/ui/LogoGoMoodX';
// Placeholder for a real i18n solution
// import { useAuth } from '@/hooks/useAuthRedirect';

export function Header({ dict }: { dict: any }) {
  // const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <LogoGoMoodX className="mr-8" />
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/services" className="transition-colors hover:text-primary">{dict.nav.services}</Link>
          <Link href="/shop" className="transition-colors hover:text-primary">{dict.nav.shop}</Link>
          <Link href="/live" className="transition-colors hover:text-primary">{dict.nav.live}</Link>
          <Link href="/blog" className="transition-colors hover:text-primary">{dict.nav.blog}</Link>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4">
          <form className="relative hidden w-full max-w-xs sm:block">
            <Input type="search" name="search" placeholder="Rechercher..." className="pl-10" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </form>
          
          {/* Placeholder for Locale Switcher */}

          {/* {user ? ( */}
             <Button asChild>
                <Link href="/account/dashboard">Tableau de bord</Link>
             </Button>
          {/* ) : ( */}
            <div className="flex gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">{dict.nav.login}</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Inscription</Link>
              </Button>
            </div>
          {/* )} */}
        </div>
      </div>
    </header>
  );
}
