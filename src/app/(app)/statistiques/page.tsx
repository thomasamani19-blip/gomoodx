
'use client';
import { TrendingUp, Users, BarChart as BarChartIcon, FileSearch, LineChart as LineChartIcon } from 'lucide-react';
import { Area, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart, AreaChart, BarChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import PageHeader from '@/components/shared/page-header';
import type { CreatorStats } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';

const chartConfig = {
  revenue: {
    label: 'Revenus (€)',
    color: 'hsl(var(--primary))',
  },
  subscribers: {
    label: 'Abonnés',
    color: 'hsl(var(--accent))',
  },
   views: {
    label: 'Vues',
    color: 'hsl(var(--primary))',
  },
  sales: {
    label: 'Ventes',
    color: 'hsl(var(--accent))'
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


const StatsPage = () => {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();

    const statsRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `creators/${user.id}/stats/main`);
    }, [user, firestore]);
    
    const { data: stats, loading: statsLoading } = useDoc<CreatorStats>(statsRef);
    
    const loading = authLoading || statsLoading;
    
    const revenueHistory = useMemo(() => stats?.revenueHistory || [], [stats]);
    const viewsHistory = useMemo(() => stats?.viewsHistory || [], [stats]);
    const subscribersHistory = useMemo(() => stats?.subscribersHistory || [], [stats]);
    const salesHistory = useMemo(() => stats?.salesHistory || [], [stats]);

  return (
    <div>
      <PageHeader title="Statistiques" description="Analysez vos performances et suivez votre croissance." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
            title="Revenus (30j)"
            value={stats?.monthlyRevenue?.value ? `${stats.monthlyRevenue.value.toLocaleString('fr-FR')} €` : '0 €'}
            change={stats?.monthlyRevenue?.change ? `${stats.monthlyRevenue.change > 0 ? '+' : ''}${stats.monthlyRevenue.change.toFixed(1)}%` : '-'}
            icon={TrendingUp}
            loading={loading}
        />
        <StatCard
            title="Nouveaux Abonnés"
            value={stats?.newSubscribers?.value ? `+${stats.newSubscribers.value}` : '0'}
            change={stats?.newSubscribers?.change ? `${stats.newSubscribers.change > 0 ? '+' : ''}${stats.newSubscribers.change} depuis hier` : '-'}
            icon={Users}
            loading={loading}
        />
        <StatCard
            title="Vues de Profil (7j)"
            value={stats?.profileViews?.value ? stats.profileViews.value.toLocaleString('fr-FR') : '0'}
            change={stats?.profileViews?.change ? `${stats?.profileViews?.change > 0 ? '+' : ''}${stats.profileViews.change.toFixed(1)}%` : '-'}
            icon={FileSearch}
            loading={loading}
        />
         <StatCard
            title="Taux d'Engagement"
            value={stats?.engagementRate?.value ? `${stats.engagementRate.value.toFixed(1)}%` : '0%'}
            change={stats?.engagementRate?.change ? `${stats.engagementRate.change > 0 ? '+' : ''}${stats.engagementRate.change.toFixed(1)}%` : '-'}
            icon={BarChartIcon}
            loading={loading}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-1">
         <Card>
          <CardHeader>
            <CardTitle>Revenus Mensuels</CardTitle>
            <CardDescription>Évolution de vos revenus au cours des 6 derniers mois.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                {loading ? <Skeleton className="w-full h-full" /> : 
                <ComposedChart data={revenueHistory}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} unit="€" />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                   <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                </ComposedChart>}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nouveaux Abonnés (7 derniers jours)</CardTitle>
            <CardDescription>Suivez le nombre de nouveaux abonnés chaque jour.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig}>
                 <ResponsiveContainer width="100%" height={300}>
                    {loading ? <Skeleton className="w-full h-full" /> : 
                    <LineChart data={subscribersHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="new" name="Nouveaux abonnés" stroke="var(--color-subscribers)" strokeWidth={2} dot={false} />
                    </LineChart>}
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
             <ChartContainer config={{ views: { label: 'Vues', color: 'hsl(var(--primary))' } }}>
                 <ResponsiveContainer width="100%" height={300}>
                   {loading ? <Skeleton className="w-full h-full" /> : 
                    <AreaChart data={viewsHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent indicator='line'/>} />
                        <Area type="monotone" dataKey="views" stroke="var(--color-views)" fill="var(--color-views)" fillOpacity={0.3} />
                    </AreaChart>}
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
                    <ResponsiveContainer width="100%" height={300}>
                    {loading ? <Skeleton className="w-full h-full" /> : 
                    <BarChart data={salesHistory}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltipContent indicator='line'/>} />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                    </BarChart>}
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsPage;
