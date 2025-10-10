
'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './app-header';
import { Header } from './header';
import { Footer } from './footer';
import CallListener from './call-listener';
import { SidebarProvider } from '../ui/sidebar';
import { AppSidebar } from './app-sidebar';

const appRoutePrefixes = [
    '/dashboard', '/profil/', '/portefeuille', '/messagerie', '/favoris', '/reservations',
    '/gestion', '/statistiques', '/abonnement', '/parametres', '/outils-ia', '/admin',
    '/annonces/', '/boutique/', '/live/', '/blog/'
];

const publicOnlyRoutes = ['/', '/connexion', '/inscription'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAppRoute = appRoutePrefixes.some(prefix => pathname.startsWith(prefix));

  if (isAppRoute) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30">
              {children}
            </main>
          </div>
        </div>
        <CallListener />
      </SidebarProvider>
    );
  }

  // Layout for public pages (landing, cgu, etc.)
  if (publicOnlyRoutes.includes(pathname) || ['/cgu', '/politique-de-confidentialite', '/contact', '/a-propos', '/recherche'].some(p => pathname.startsWith(p))) {
      return (
          <>
            <Header />
            <main>{children}</main>
            <Footer />
          </>
      )
  }

  // Fallback for pages that don't fit either layout (e.g. auth pages without Header/Footer)
  return <main>{children}</main>;
}
