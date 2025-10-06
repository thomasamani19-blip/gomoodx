
'use client';
import { AreaChart, BarChart, FileSearch, TrendingUp, Users } from 'lucide-react';
import { Area, Bar, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import PageHeader from '@/components/shared/page-header';
import type { CreatorStats, MonthlyRevenue } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';


const chartData: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 1860 },
  { month: 'Fev', revenue: 3050 },
  { month: 'Mar', revenue: 2370 },
  { month: 'Avr', revenue: 730 },
  { month: 'Mai', revenue: 2090 },
  { month: 'Juin', revenue: 2140 },
];

const chartConfig = {
  revenue: {
    label: 'Revenus',
    color: 'hsl(var(--primary))',
  },
  subscribers: {
    label: 'Abonnés',
    color: 'hsl(var(--accent))',
  },
};

const newSubscribersData = [
  { date: '01/06', new: 5 },
  { date: '02/06', new: 7 },
  { date: '03/06', new: 4 },
  { date: '04/06', new: 9 },
  { date: '05/06', new: 6 },
  { date: '06/06', new: 11 },
  { date: '07/06', new: 8 },
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
    const statsPath = user ? doc(firestore, `/creators/${user.id}/stats/main`) : null;
    const { data: stats, loading: statsLoading } = useDoc<CreatorStats>(statsPath);

    const loading = authLoading || statsLoading;

  return (
    <div>
      <PageHeader title="Statistiques" description="Analysez vos performances et suivez votre croissance." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
            title="Revenus (30j)"
            value={stats?.monthlyRevenue?.value ? `${stats.monthlyRevenue.value.toLocaleString('fr-FR')} €` : 'N/A'}
            change={stats?.monthlyRevenue?.change ? `${stats.monthlyRevenue.change > 0 ? '+' : ''}${stats.monthlyRevenue.change.toFixed(1)}%` : '-'}
            icon={TrendingUp}
            loading={loading}
        />
        <StatCard
            title="Nouveaux Abonnés"
            value={stats?.newSubscribers?.value ? `+${stats.newSubscribers.value}` : 'N/A'}
            change={stats?.newSubscribers?.change ? `${stats.newSubscribers.change > 0 ? '+' : ''}${stats.newSubscribers.change} depuis hier` : '-'}
            icon={Users}
            loading={loading}
        />
        <StatCard
            title="Vues de Profil (7j)"
            value={stats?.profileViews?.value ? stats.profileViews.value.toLocaleString('fr-FR') : 'N/A'}
            change={stats?.profileViews?.change ? `${stats.profileViews.change > 0 ? '+' : ''}${stats.profileViews.change.toFixed(1)}%` : '-'}
            icon={FileSearch}
            loading={loading}
        />
         <StatCard
            title="Taux d'Engagement"
            value={stats?.engagementRate?.value ? `${stats.engagementRate.value.toFixed(1)}%` : 'N/A'}
            change={stats?.engagementRate?.change ? `${stats.engagementRate.change > 0 ? '+' : ''}${stats.engagementRate.change.toFixed(1)}%` : '-'}
            icon={BarChart}
            loading={loading}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>Revenus Mensuels</CardTitle>
            <CardDescription>Évolution de vos revenus au cours des 6 derniers mois.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                </BarChart>
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
                    <LineChart data={newSubscribersData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="new" name="Nouveaux abonnés" stroke="var(--color-subscribers)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vues de Profil (7 derniers jours)</CardTitle>
            <CardDescription>Évolution journalière des visites sur votre profil.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{ views: { label: 'Vues', color: 'hsl(var(--primary))' } }}>
                 <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={profileViewsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent indicator='line'/>} />
                        <Area type="monotone" dataKey="views" name="Vues de profil" stroke="var(--color-views)" fill="var(--color-views)" fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsPage;
