
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, CreatorStats, MonthlyRevenue } from "@/lib/types";
import PageHeader from "../shared/page-header";
import Link from "next/link";
import { Button } from "../ui/button";
import { Building, ShoppingBag, Newspaper, DollarSign, PenSquare, UserCircle, GanttChart, Sparkles, BookText, Film, Bot, TrendingUp, BarChart } from "lucide-react";
import { useDoc, useFirestore } from "@/firebase";
import { useMemo } from "react";
import { doc } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { AreaChart as RechartsAreaChart, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Area, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

const chartConfig = {
  revenue: {
    label: 'Revenus',
    color: 'hsl(var(--primary))',
  },
  sales: {
      label: 'Ventes',
      color: 'hsl(var(--primary))'
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
    { title: "Générateur de Scénario", description: "Écrivez un scénario pour votre prochaine vidéo.", href: "/outils-ia/generer-scenario", icon: Film },
    { title: "Idées de Contenu", description: "Trouvez l'inspiration pour vos prochaines productions.", href: "/outils-ia/idees-contenu", icon: Bot },
];

export default function PartenaireDashboard({ user }: { user: User }) {
  const isProducer = user.partnerType === 'producer';
  const isEstablishment = user.partnerType === 'establishment';

    const firestore = useFirestore();
    const statsRef = useMemo(() => user && firestore ? doc(firestore, `/creators/${user.id}/stats/main`) : null, [user, firestore]);
    const { data: stats, loading: statsLoading } = useDoc<CreatorStats>(statsRef);

  const establishmentTools = [
    { 
        title: "Gérer le Profil Partenaire", 
        description: "Modifiez les informations, la galerie et les détails de votre profil.", 
        href: "/gestion/etablissement",
        icon: Building,
    },
    {
        title: "Gérer mes Tarifs",
        description: "Définissez les prix de vos chambres et services.",
        href: "/gestion/tarifs",
        icon: DollarSign,
    },
    {
        title: "Gérer mes Annonces/Services",
        description: "Créez et gérez les services que votre établissement propose.",
        href: "/gestion/annonces",
        icon: Newspaper,
    }
];

  if(isEstablishment) {
    return (
        <div>
            <PageHeader
                title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
                description="Gérez les informations et les services de votre établissement."
            />
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Gestion de votre Établissement</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {establishmentTools.map((tool) => (
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
        </div>
    )
  }

  if(isProducer) {
       return (
            <div className="space-y-8">
                <PageHeader
                    title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
                    description="Gérez vos productions et collaborations."
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
                        title="Ventes de Contenu"
                        value={stats?.contentSales?.value ? `${stats.contentSales.value}` : '0'}
                        change={stats?.contentSales?.change ? `${stats.contentSales.change > 0 ? '+' : ''}${stats.contentSales.change} depuis hier` : '-'}
                        icon={ShoppingBag}
                        loading={statsLoading}
                    />
                     <StatCard
                        title="Vues de Profil (7j)"
                        value={stats?.profileViews?.value ? stats.profileViews.value.toLocaleString('fr-FR') : '0'}
                        change={stats?.profileViews?.change ? `${stats?.profileViews?.change > 0 ? '+' : ''}${stats.profileViews.change.toFixed(1)}%` : '-'}
                        icon={UserCircle}
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
                            <CardTitle>Revenus des Ventes</CardTitle>
                            <CardDescription>Évolution de vos revenus au cours des 6 derniers mois.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig}>
                            <ResponsiveContainer width="100%" height={250}>
                                {statsLoading ? <Skeleton className="w-full h-full" /> : 
                                <RechartsAreaChart data={stats?.revenueHistory || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.3} />
                                </RechartsAreaChart>}
                            </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Ventes de Contenu (7 derniers jours)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig}>
                                <ResponsiveContainer width="100%" height={250}>
                                {statsLoading ? <Skeleton className="w-full h-full" /> : 
                                <RechartsBarChart data={stats?.salesHistory || []}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <Tooltip content={<ChartTooltipContent indicator='line'/>} />
                                    <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                                </RechartsBarChart>}
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Gestion de Contenu</CardTitle>
                        <CardDescription>Gérez l'ensemble de vos productions collaboratives et produits de la boutique.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <Button asChild size="lg">
                            <Link href="/gestion/produits">
                                <ShoppingBag className="mr-2 h-5 w-5" />
                                Gérer mes produits
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/profil">
                                <PenSquare className="mr-2 h-5 w-5" />
                                Modifier mon profil
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline">Outils d'Assistance IA</CardTitle>
                    <CardDescription>Optimisez votre flux de production et trouvez l'inspiration.</CardDescription>
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
       )
  }

  // Fallback for any other partner type
  return (
    <div>
        <PageHeader
            title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
            description="Bienvenue sur votre espace partenaire."
        />
        <Card>
            <CardHeader><CardTitle>Bienvenue</CardTitle></CardHeader>
            <CardContent><p>Votre tableau de bord est en cours de construction.</p></CardContent>
        </Card>
    </div>
  )
}
