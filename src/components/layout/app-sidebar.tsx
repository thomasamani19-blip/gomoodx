

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
  ImageIcon,
  BarChart3,
  Search,
  HeartHandshake,
  Sparkles,
  UserCircle,
  Users,
  ShieldCheck,
  Heart,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

const clientNav = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Annonces', href: '/annonces', icon: HeartHandshake },
  { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
  { title: 'Favoris', href: '/favoris', icon: Heart },
  { title: 'Boutique', href: '/boutique', icon: ShoppingBag },
  { title: 'Live', href: '/live', icon: Clapperboard },
  { title: 'Blog', href: '/blog', icon: BookOpen },
  { title: 'Recherche', href: '/recherche', icon: Search },
  { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
];

const escorteNav = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Statistiques', href: '/statistiques', icon: BarChart3 },
  { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
  { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
];

const toolsNav = [
    { title: 'Studio IA Créatif', href: '/outils-ia/studio', icon: Sparkles },
    { title: 'Générateur de Bio', href: '/outils-ia/generer-bio', icon: PenSquare },
    { title: 'Idées de Contenu', href: '/outils-ia/idees-contenu', icon: ImageIcon },
    { title: 'Posts pour Réseaux', href: '/outils-ia/posts-sociaux', icon: Bot },
];

const adminNav = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Utilisateurs', href: '/admin/users', icon: Users },
  { title: 'Modération', href: '/admin/moderation', icon: ShieldCheck },
];

export function AppSidebar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const renderNavItems = (items: { title: string; href: string; icon: React.ElementType }[]) => {
    return items.map(item => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href)}
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
      return renderNavItems(clientNav.filter(item => ['/annonces', '/boutique', '/live', '/blog'].includes(item.href)));
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
      case 'administrateur':
      case 'founder':
      case 'moderator':
        return renderNavItems(adminNav);
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
                    <Link href="/a-propos" passHref legacyBehavior>
                    <SidebarMenuButton tooltip="À propos" isActive={pathname.startsWith('/a-propos')} asChild>
                        <a><Info /><span>À propos</span></a>
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/profil" passHref legacyBehavior>
                  <SidebarMenuButton tooltip="Profil & Paramètres" isActive={pathname.startsWith('/profil')} asChild>
                    <a><UserCircle /><span>Profil</span></a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
      </Sidebar>
  );
}
