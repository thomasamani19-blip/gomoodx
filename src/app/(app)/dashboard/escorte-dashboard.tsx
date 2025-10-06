
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, BookText, PenSquare, Sparkles, ShoppingBag, Newspaper, Bot } from "lucide-react";
import Link from 'next/link';
import type { User, CreatorStats } from "@/lib/types";
import PageHeader from "@/components/shared/page-header";
import { useDoc, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import { BarChart, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";


const StatCard = ({ title, value, change, icon: Icon, loading }: { title: string, value: string, change: string, icon: React.ElementType, loading: boolean}) => {
    if (loading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-1" />
                    <Skeleton className="h-3 w-1/3" />
                </CardContent>
            </Card>
        );
    }

    const changeIsPositive = change.startsWith('+');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className={`text-xs text-muted-foreground ${changeIsPositive ? 'text-green-600' : 'text-red-600'}`}>{change}</p>
            </CardContent>
        </Card>
    );
};


const aiTools = [
    { title: "Studio IA Créatif", description: "Générez images, vidéos et voix par IA.", href: "/outils-ia/studio", icon: Sparkles },
    { title: "Générateur d'Article", description: "Rédigez des articles de blog en un clic.", href: "/outils-ia/generer-article", icon: BookText },
    { title: "Générateur de Bio", description: "Créez une biographie captivante et unique.", href: "/outils-ia/generer-bio", icon: PenSquare },
    { title: "Idées de Contenu", description: "Trouvez l'inspiration pour vos prochaines publications.", href: "/outils-ia/idees-contenu", icon: Bot },
    { title: "Suggestions de Posts", description: "Générez des publications engageantes pour vos fans.", href: "/outils-ia/posts-sociaux", icon: Bot },
];

const contentManagementTools = [
    { title: "Gérer mes annonces", description: "Modifiez vos services, prix et disponibilités.", href: "/gestion/annonces", icon: Newspaper },
    { title: "Gérer mes produits", description: "Ajoutez ou mettez à jour les articles de votre boutique.", href: "/gestion/produits", icon: ShoppingBag },
    { title: "Gérer mes articles", description: "Rédigez et publiez de nouveaux articles de blog.", href: "/gestion/articles", icon: BookText },
];

export default function EscorteDashboard({ user }: { user: User }) {
    const firestore = useFirestore();
    const statsRef = useMemo(() => user && firestore ? doc(firestore, `/creators/${user.id}/stats/main`) : null, [user, firestore]);
    const { data: stats, loading: statsLoading } = useDoc<CreatorStats>(statsRef);

  return (
    <div className="space-y-8">
        <PageHeader
            title={`Bienvenue, ${user?.displayName || '...'}`}
            description="Voici un aperçu de votre activité sur GoMoodX."
        />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
            title="Revenus (30j)"
            value={stats?.monthlyRevenue?.value ? `${stats.monthlyRevenue.value.toLocaleString('fr-FR')} €` : '0 €'}
            change={stats?.monthlyRevenue?.change ? `${stats.monthlyRevenue.change > 0 ? '+' : ''}${stats.monthlyRevenue.change.toFixed(1)}%` : '-'}
            icon={TrendingUp}
            loading={statsLoading}
        />
        <StatCard
            title="Nouveaux Abonnés"
            value={stats?.newSubscribers?.value ? `+${stats.newSubscribers.value}` : '0'}
            change={stats?.newSubscribers?.change ? `${stats.newSubscribers.change > 0 ? '+' : ''}${stats.newSubscribers.change} depuis hier` : '-'}
            icon={Users}
            loading={statsLoading}
        />
        <StatCard
            title="Vues de Profil (7j)"
            value={stats?.profileViews?.value ? stats.profileViews.value.toLocaleString('fr-FR') : '0'}
            change={stats?.profileViews?.change ? `${stats?.profileViews?.change > 0 ? '+' : ''}${stats.profileViews.change.toFixed(1)}%` : '-'}
            icon={UserIcon}
            loading={statsLoading}
        />
        <Card className="flex flex-col justify-center items-center">
            <CardContent className="pt-6 text-center">
                 <p className="text-sm font-medium">Statistiques Détaillées</p>
                 <Button variant="link" asChild className="mt-2">
                     <Link href="/statistiques">Voir plus</Link>
                 </Button>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Gestion de Contenu</CardTitle>
          <CardDescription>Gérez l'ensemble de vos contenus, services et publications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            {contentManagementTools.map((tool) => (
                <Link key={tool.title} href={tool.href} className="flex items-center justify-between space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none flex items-center">
                           {tool.icon && <tool.icon className="mr-2 h-4 w-4 text-primary" />}
                           {tool.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                    <Button variant="secondary">Gérer</Button>
                </Link>
            ))}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Outils d'Assistance IA</CardTitle>
          <CardDescription>Optimisez votre présence et votre contenu grâce à l'intelligence artificielle.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            {aiTools.map((tool) => (
                <Link key={tool.title} href={tool.href} className="flex items-center justify-between space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none flex items-center">
                           {tool.icon && <tool.icon className="mr-2 h-4 w-4 text-primary" />}
                           {tool.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                    <Button variant="secondary">Lancer</Button>
                </Link>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
