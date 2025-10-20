
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, CreatorStats, Reservation } from "@/lib/types";
import PageHeader from "../shared/page-header";
import Link from 'next/link';
import { Button } from "../ui/button";
import { Building, ShoppingBag, Newspaper, DollarSign, PenSquare, UserCircle, GanttChart, Sparkles, BookText, Film, Bot, TrendingUp, BarChart, Calendar, CalendarCheck, Users } from "lucide-react";
import { useDoc, useFirestore, useCollection } from "@/firebase";
import { useMemo } from "react";
import { collection, doc, query, where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { AreaChart, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";


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

function EstablishmentDashboard({ user }: { user: User }) {
    const firestore = useFirestore();
    
    const statsRef = useMemo(() => firestore ? doc(firestore, `/creators/${user.id}/stats/main`) : null, [firestore, user.id]);
    const { data: stats, loading: statsLoading } = useDoc<CreatorStats>(statsRef);
    
    const reservationsQuery = useMemo(() => firestore ? query(collection(firestore, 'reservations'), where('creatorId', '==', user.id), where('status', '==', 'confirmed'), orderBy('reservationDate', 'asc'), limit(5)) : null, [firestore, user.id]);
    const { data: upcomingReservations, loading: reservationsLoading } = useCollection<Reservation>(reservationsQuery);
    
    const annoncesQuery = useMemo(() => firestore ? query(collection(firestore, 'services'), where('createdBy', '==', user.id)) : null, [firestore, user.id]);
    const { data: annonces, loading: annoncesLoading } = useCollection(annoncesQuery);

    const loading = statsLoading || reservationsLoading || annoncesLoading;

    return (
        <div className="space-y-8">
            <PageHeader
                title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
                description="Gérez les informations et les services de votre établissement."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Revenus (30j)"
                    value={stats?.monthlyRevenue?.value ? `${stats.monthlyRevenue.value.toLocaleString('fr-FR')} €` : '0 €'}
                    change={stats?.monthlyRevenue?.change ? `${stats.monthlyRevenue.change > 0 ? '+' : ''}${stats.monthlyRevenue.change.toFixed(1)}%` : '-'}
                    icon={TrendingUp}
                    loading={loading}
                />
                 <StatCard
                    title="Réservations (30j)"
                    value={stats?.contentSales?.value ? `${stats.contentSales.value}` : '0'}
                    change={stats?.contentSales?.change ? `${stats.contentSales.change > 0 ? '+' : ''}${stats.contentSales.change} depuis hier` : '-'}
                    icon={Calendar}
                    loading={loading}
                />
                <StatCard
                    title="Annonces Actives"
                    value={`${annonces?.length || 0}`}
                    change=""
                    icon={Newspaper}
                    loading={loading}
                />
                 <StatCard
                    title="Vues de Profil (7j)"
                    value={stats?.profileViews?.value ? stats.profileViews.value.toLocaleString('fr-FR') : '0'}
                    change={stats?.profileViews?.change ? `${stats?.profileViews?.change > 0 ? '+' : ''}${stats.profileViews.change.toFixed(1)}%` : '-'}
                    icon={UserCircle}
                    loading={loading}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Prochaines Réservations</CardTitle>
                        <CardDescription>Aperçu de vos prochaines réservations confirmées.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reservationsLoading ? <Skeleton className="h-40" /> : (
                            upcomingReservations && upcomingReservations.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingReservations.map(res => (
                                        <div key={res.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                 <Avatar className="h-10 w-10 border">
                                                    {/* You would fetch member image here */}
                                                    <AvatarFallback>{res.memberId.charAt(0)}</AvatarFallback>
                                                 </Avatar>
                                                <div>
                                                    <p className="font-semibold">{res.annonceTitle}</p>
                                                    <p className="text-sm text-muted-foreground">{format(res.reservationDate.toDate(), "d MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                                                </div>
                                            </div>
                                             <Button asChild size="sm" variant="ghost">
                                                <Link href={`/reservations/${res.id}`}>Voir</Link>
                                             </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground text-center py-10">Aucune réservation à venir.</p>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Actions Rapides</CardTitle>
                        <CardDescription>Accès rapide aux fonctionnalités clés.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4">
                         <Button asChild size="lg" className="h-full">
                            <Link href="/gestion/annonces/creer" className="flex-col gap-2 h-24">
                                <Newspaper className="h-6 w-6"/>
                                <span>Créer une Annonce</span>
                            </Link>
                        </Button>
                        <Button asChild size="lg" className="h-full col-span-1" variant="secondary">
                            <Link href="/gestion" className="flex-col gap-2 h-24">
                                <GanttChart className="h-6 w-6"/>
                                <span>Espace de Gestion</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ProducerDashboard({ user }: { user: User }) {
    const firestore = useFirestore();
    const statsRef = useMemo(() => user && firestore ? doc(firestore, `/creators/${user.id}/stats/main`) : null, [user, firestore]);
    const { data: stats, loading: statsLoading } = useDoc<CreatorStats>(statsRef);

    const revenueHistory = useMemo(() => stats?.revenueHistory || [], [stats]);
    const salesHistory = useMemo(() => stats?.salesHistory || [], [stats]);

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
                            <RechartsAreaChart data={revenueHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                            <RechartsBarChart data={salesHistory}>
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
                    <CardDescription>Accès rapide à la gestion de vos produits et de votre profil.</CardDescription>
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
   );
}


export default function PartenaireDashboard({ user }: { user: User }) {
  const isProducer = user.partnerType === 'producer';
  const isEstablishment = user.partnerType === 'establishment';

  if(isEstablishment) {
    return <EstablishmentDashboard user={user} />
  }

  if(isProducer) {
    return <ProducerDashboard user={user} />
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
