
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, BookText, PenSquare, Sparkles, ShoppingBag, Newspaper, Bot, Film, GanttChart } from "lucide-react";
import Link from 'next/link';
import type { User, CreatorStats, MonthlyRevenue } from "@/lib/types";
import PageHeader from "@/components/shared/page-header";
import { useDoc, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import { BarChart as BarChartIcon, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import { AreaChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Area, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';


const chartData: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 1860 },
  { month: 'Fev', revenue: 3050 },
  { month: 'Mar', revenue: 2370 },
  { month: 'Avr', revenue: 730 },
  { month: 'Mai', revenue: 2090 },
  { month: 'Juin', revenue: 2140 },
];

const profileViewsData = [
    { date: '01/06', views: 120 },
    { date: '02/06', views: 180 },
    { date: '03/06', views: 150 },
    { date: '04/06', views: 210 },
    { date: '05/06', views: 190 },
    { date: '06/06', views: 250 },
    { date: '07/06', views: 220 },
];

const chartConfig = {
  revenue: {
    label: 'Revenus',
    color: 'hsl(var(--primary))',
  },
  views: {
    label: 'Vues',
    color: 'hsl(var(--primary))',
  }
};


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
    { title: "Générateur de Scénario", description: "Écrivez un scénario pour votre prochaine vidéo.", href: "/outils-ia/generer-scenario", icon: Film },
    { title: "Idées de Contenu", description: "Trouvez l'inspiration pour vos prochaines publications.", href: "/outils-ia/idees-contenu", icon: Bot },
    { title: "Suggestions de Posts", description: "Générez des publications engageantes pour vos fans.", href: "/outils-ia/posts-sociaux", icon: Bot },
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
      
       <div className="grid gap-8 md:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>Revenus Mensuels</CardTitle>
            <CardDescription>Évolution de vos revenus au cours des 6 derniers mois.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={250}>
                {statsLoading ? <Skeleton className="w-full h-full" /> : 
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.3} />
                </AreaChart>}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
         <Card>
          <CardHeader>
            <CardTitle>Vues de Profil (7 derniers jours)</CardTitle>
            <CardDescription>Évolution journalière des visites sur votre profil.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig}>
                 <ResponsiveContainer width="100%" height={250}>
                   {statsLoading ? <Skeleton className="w-full h-full" /> : 
                    <BarChart data={profileViewsData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltipContent indicator='line'/>} />
                        <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                    </BarChart>}
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
            <CardTitle className="font-headline">Gestion de Contenu</CardTitle>
            <CardDescription>Gérez l'ensemble de vos contenus, services et publications.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" className="w-full">
                    <Link href="/gestion">
                        <GanttChart className="mr-2 h-5 w-5" />
                        Accéder à l'espace de gestion
                    </Link>
                </Button>
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
