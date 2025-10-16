'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { GoMoodXLogo } from '../GoMoodXLogo';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Clapperboard,
  BookOpen,
  Wallet,
  Bot,
  PenSquare,
  BarChart3,
  Search,
  HeartHandshake,
  Sparkles,
  UserCircle,
  Users,
  ShieldCheck,
  Heart,
  Info,
  BookText,
  Building,
  FileText,
  Settings,
  Film,
  CalendarCheck,
  Star,
  Newspaper,
  Crown,
  Video,
  GanttChart,
  Banknote,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

const clientNav = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: "Fil d'actualité", href: '/feed', icon: Newspaper },
  { title: 'Annonces', href: '/annonces', icon: HeartHandshake },
  { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
  { title: 'Mes Réservations', href: '/reservations', icon: CalendarCheck },
  { title: 'Favoris', href: '/favoris', icon: Heart },
  { title: 'Boutique', href: '/boutique', icon: ShoppingBag },
  { title: 'Panier', href: '/panier', icon: ShoppingCart },
  { title: 'Live', href: '/live', icon: Clapperboard },
  { title: 'Blog', href: '/blog', icon: BookOpen },
  { title: 'Recherche', href: '/recherche', icon: Search },
  { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
];

const escorteNav = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: "Fil d'actualité", href: '/feed', icon: Newspaper },
  { title: 'Statistiques', href: '/statistiques', icon: BarChart3 },
  { title: 'Gestion', href: '/gestion', icon: GanttChart },
  { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
  { title: 'Mes Réservations', href: '/reservations', icon: CalendarCheck },
  { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
  { title: 'Passer Premium', href: '/abonnement', icon: Crown },
];

const partenaireNav = [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: "Fil d'actualité", href: '/feed', icon: Newspaper },
    { title: 'Profil Partenaire', href: '/profil', icon: Building },
    { title: 'Gérer mes Tarifs', href: '/gestion/tarifs', icon: DollarSign },
    { title: 'Gérer les Lives', href: '/gestion/lives', icon: Video },
    { title: 'Mes Réservations', href: '/reservations', icon: CalendarCheck },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
    { title: 'Passer Premium', href: '/abonnement', icon: Crown },
];

const toolsNav = [
    { title: 'Studio IA Créatif', href: '/outils-ia/studio', icon: Sparkles },
    { title: 'Générateur d\'Article', href: '/outils-ia/generer-article', icon: BookText },
    { title: 'Générateur de Bio', href: '/outils-ia/generer-bio', icon: PenSquare },
    { title: 'Générateur de Scénario', href: '/outils-ia/generer-scenario', icon: Film },
    { title: 'Idées de Contenu', href: '/outils-ia/idees-contenu', icon: Bot },
    { title: 'Posts pour Réseaux', href: '/outils-ia/posts-sociaux', icon: Bot },
];

const adminNav = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Utilisateurs', href: '/admin/users', icon: Users },
  { title: 'Demandes Partenaires', href: '/admin/demandes-partenaires', icon: FileText },
  { title: 'Vérifications Identité', href: '/admin/verifications', icon: ShieldCheck },
  { title: 'Modération Contenu', href: '/admin/moderation', icon: AlertTriangle },
  { title: 'Tickets de Support', href: '/admin/support', icon: LifeBuoy },
  { title: 'Portefeuille Plateforme', href: '/admin/portefeuille', icon: Wallet },
  { title: 'Gestion des Retraits', href: '/admin/retraits', icon: Banknote },
  { title: 'Abonnements Plateforme', href: "/admin/abonnements", icon: Crown },
  { title: 'Paramètres Financiers', href: '/admin/parametres-financiers', icon: DollarSign },
  { title: 'Paramètres Récompenses', href: '/admin/parametres', icon: Settings },
  { title: "Fil d'actualité", href: '/feed', icon: Newspaper },
];

export function AppSidebar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const renderNavItems = (items: { title: string; href: string; icon: React.ElementType }[]) => {
    return items.map(item => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              tooltip={item.title}
              asChild
            >
              <a>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ));
  }

  const renderLoadingSkeleton = () => (
    <div className="p-2 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
             <Skeleton key={i} className="h-8 w-full" />
        ))}
    </div>
  )

  const renderMenuForRole = () => {
    if (loading) {
      return renderLoadingSkeleton();
    }

    if (!user) {
      return renderNavItems(clientNav.filter(item => ['/annonces', '/boutique', '/live', '/blog', '/recherche'].includes(item.href)));
    }

    switch (user.role) {
      case 'client':
        return renderNavItems(clientNav);
      case 'escorte':
        return (
            <>
                {renderNavItems(escorteNav)}
                <SidebarMenuItem>
                    <span className="p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Outils IA</span>
                </SidebarMenuItem>
                {renderNavItems(toolsNav)}
            </>
        )
      case 'partenaire':
        return renderNavItems(partenaireNav);
      case 'founder':
      case 'administrateur':
        return renderNavItems(adminNav);
      case 'moderator':
        return renderNavItems(adminNav.filter(i => ['/dashboard', '/admin/verifications', '/admin/moderation', '/admin/support', '/feed'].includes(i.href)));
      default:
        // Default to client view to avoid blank screen
        return renderNavItems(clientNav);
    }
  }

  return (
      <Sidebar side="left" collapsible="icon" className='border-r'>
          <SidebarHeader className='flex items-center justify-between'>
            <GoMoodXLogo />
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                {renderMenuForRole()}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/support" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="Support" isActive={pathname.startsWith('/support')} asChild>
                        <a><LifeBuoy /><span>Support</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/parametres" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="Paramètres" isActive={pathname.startsWith('/parametres')} asChild>
                      <a><Settings /><span>Paramètres</span></a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/profil" passHref legacyBehavior>
                  <SidebarMenuButton tooltip="Profil" isActive={pathname.startsWith('/profil')} asChild>
                    <a><UserCircle /><span>Profil</span></a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
      </Sidebar>
  );
}
