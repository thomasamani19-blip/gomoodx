
'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './app-header';
import { Header } from './header';
import { Footer } from './footer';
import CallListener from './call-listener';
import { SidebarProvider } from '../ui/sidebar';
import { AppSidebar } from './app-sidebar';

const appRoutes = [
    '/dashboard', '/profil', '/portefeuille', '/messagerie', '/favoris', '/reservations',
    '/gestion', '/statistiques', '/abonnement', '/parametres', '/outils-ia', '/admin'
];

const authRoutes = ['/connexion', '/inscription'];

const publicPagesWithCustomLayout = ['/cgu', '/politique-de-confidentialite', '/contact', '/a-propos', '/recherche'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAppRoute = appRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isPublicWithLayout = publicPagesWithCustomLayout.some(route => pathname.startsWith(route)) || pathname === '/';

  if (isAuthRoute) {
    return <main>{children}</main>;
  }
  
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

  // Default layout for public pages (landing, cgu, etc.)
  return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
            {children}
        </main>
        <Footer />
      </div>
  );
}
