'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { Header } from './header';
import { Footer } from './footer';
import CallListener from './call-listener';
import { SidebarProvider } from '../ui/sidebar';

const appRoutes = [
    '/dashboard', '/profil', '/portefeuille', '/messagerie', '/favoris', '/reservations',
    '/gestion', '/statistiques', '/abonnement', '/parametres', '/outils-ia', '/admin'
];

const authRoutes = ['/connexion', '/inscription'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAppRoute = appRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

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
            <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background/95">
              {children}
            </main>
          </div>
        </div>
        <CallListener />
      </SidebarProvider>
    );
  }

  // Default layout for public pages
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
