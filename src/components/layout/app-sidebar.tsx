
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
  Sparkles,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


const navConfig: Record<string, { title: string; href: string; icon: React.ElementType }[]> = {
  client: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Annonces', href: '/services', icon: HeartHandshake },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { title: 'Boutique', href: '/boutique', icon: ShoppingBag },
    { title: 'Live', href: '/live', icon: Clapperboard },
    { title: 'Blog', href: '/blog', icon: BookOpen },
    { title: 'Recherche', href: '/recherche', icon: Search },
    { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
  ],
  escorte: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Statistiques', href: '/statistiques', icon: BarChart3 },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { title: 'Recherche', href: '/recherche', icon: Search },
    { title: 'Générer Bio', href: '/outils-ia/generer-bio', icon: PenSquare },
    { title: 'Idées de Contenu', href: '/outils-ia/idees-contenu', icon: ImageIcon },
    { title: 'Posts Réseaux', href: '/outils-ia/posts-sociaux', icon: Bot },
    { title: 'Studio IA', href: '/outils-ia/studio', icon: Sparkles },
    { title: 'Portefeuille', href: '/portefeuille', icon: Wallet },
  ],
  partenaire: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Mon Établissement', href: '/partner/establishment', icon: Building },
    { title: 'Messagerie', href: '/messagerie', icon: MessageSquare },
  ],
  administrateur: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Utilisateurs', href: '/admin/users', icon: Users },
    { title: 'Modération', href: '/admin/moderation', icon: ShieldCheck },
  ],
  // Add fallback for other roles like founder and moderator
  founder: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Utilisateurs', href: '/admin/users', icon: Users },
    { title: 'Modération', href: '/admin/moderation', icon: ShieldCheck },
  ],
  moderator: [
    { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Modération', href: '/admin/moderation', icon: ShieldCheck },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const navItems = user?.role ? navConfig[user.role] || navConfig['client'] : [];

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
            <Link href="/profil" passHref legacyBehavior>
              <SidebarMenuButton tooltip="Profil & Paramètres" isActive={pathname === '/profil'} asChild>
                <a><UserCircle /><span>Profil</span></a>
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
