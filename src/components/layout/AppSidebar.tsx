'use client';
import { LogoGoMoodX } from '@/components/ui/LogoGoMoodX';
import {
  LayoutDashboard,
  MessageSquare,
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
  Users,
  Building,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// import { useAuth } from '@/hooks/useAuth';

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: ('admin' | 'creator' | 'member' | 'partner')[];
  isMain?: boolean;
};

const navItems: NavItem[] = [
    { title: 'Tableau de bord', href: '/account/dashboard', icon: LayoutDashboard, roles: ['admin', 'creator', 'member', 'partner'], isMain: true },
    // Creator
    { title: 'Statistiques', href: '/account/stats', icon: BarChart3, roles: ['creator'] },
    { title: 'Studio IA', href: '/account/ai-studio', icon: Sparkles, roles: ['creator'] },
    // Member
    { title: 'Services', href: '/services', icon: HeartHandshake, roles: ['member'] },
    { title: 'Boutique', href: '/shop', icon: ShoppingBag, roles: ['member', 'creator'] },
    { title: 'Live', href: '/live', icon: Clapperboard, roles: ['member', 'creator'] },
    { title: 'Blog', href: '/blog', icon: BookOpen, roles: ['member', 'creator'] },
    // Partner
    { title: 'Mon Établissement', href: '/partner-account/establishment', icon: Building, roles: ['partner'] },
    // Admin
    { title: 'Utilisateurs', href: '/admin/users', icon: Users, roles: ['admin'] },
    { title: 'Modération', href: '/admin/moderation', icon: ShieldCheck, roles: ['admin'] },
    // Common
    { title: 'Messagerie', href: '/account/messages', icon: MessageSquare, roles: ['admin', 'creator', 'member', 'partner'] },
    { title: 'Portefeuille', href: '/account/wallet', icon: Wallet, roles: ['creator', 'member'] },
    { title: 'Recherche', href: '/search', icon: Search, roles: ['member', 'creator'] },
];

export function AppSidebar() {
  // const { user } = useAuth();
  const user = { role: 'creator' }; // MOCK USER
  const pathname = usePathname();

  const userNavItems = navItems.filter(item => user?.role && item.roles.includes(user.role));

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <LogoGoMoodX />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {userNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === item.href && "bg-muted text-primary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <Link
            href="/account/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/account/settings" && "bg-muted text-primary"
            )}
          >
            <Settings className="h-4 w-4" />
            Paramètres
        </Link>
      </div>
    </aside>
  );
}
