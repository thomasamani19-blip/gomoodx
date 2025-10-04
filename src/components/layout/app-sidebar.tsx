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
  useSidebar
} from '@/components/ui/sidebar';
import { GoMoodXLogo } from '../GoMoodXLogo';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Building,
  ShieldCheck,
  ShoppingBag,
  Clapperboard,
  BookOpen,
  Wallet,
  Settings,
  Bot,
  PenSquare,
  ImageIcon,
  BarChart3,
  Search,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


const navConfig: Record<UserRole, { title: string; href: string; icon: React.ElementType }[]> = {
  client: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Services', href: '/services', icon: HeartHandshake },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { title: 'Shop', href: '/shop', icon: ShoppingBag },
    { title: 'Live', href: '/live', icon: Clapperboard },
    { title: 'Blog', href: '/blog', icon: BookOpen },
    { title: 'Recherche', href: '/recherche', icon: Search },
    // { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
  ],
  escorte: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    // { title: 'Statistiques', href: '/statistiques', icon: BarChart3 },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { title: 'Générer Bio', href: '/outils-ia/generer-bio', icon: PenSquare },
    { title: 'Idées de Contenu', href: '/outils-ia/idees-contenu', icon: ImageIcon },
    { title: 'Posts Réseaux', href: '/outils-ia/posts-sociaux', icon: Bot },
    { title: 'Studio IA', href: '/outils-ia/studio', icon: Sparkles },
    // { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
  ],
  partenaire: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    // { title: 'Mon Établissement', href: '/etablissement', icon: Building },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
  ],
  administrateur: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    // { title: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
    // { title: 'Contenus', href: '/admin/contenus', icon: BookOpen },
    // { title: 'Modération', href: '/admin/moderation', icon: ShieldCheck },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const navItems = user?.role ? navConfig[user.role] : [];

  const renderMenuItems = () => (
    <SidebarMenu>
      {navItems.map(item => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === item.href}
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
      ))}
    </SidebarMenu>
  );

  const sidebarContent = (
    <>
      <SidebarHeader className='flex items-center justify-between'>
        <GoMoodXLogo />
        <SidebarTrigger className={cn(isMobile ? "hidden" : "flex")} />
      </SidebarHeader>
      <SidebarContent>
        {renderMenuItems()}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/parametres" passHref legacyBehavior>
              <SidebarMenuButton tooltip="Paramètres" isActive={pathname === '/parametres'} asChild>
                <a><Settings /><span>Paramètres</span></a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  return (
      <Sidebar side="left" collapsible="icon" className='border-r'>
        {sidebarContent}
      </Sidebar>
  );
}
