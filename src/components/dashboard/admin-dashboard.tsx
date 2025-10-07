'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, Wallet, PartnerRequest } from "@/lib/types";
import PageHeader from "../shared/page-header";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { DollarSign, Users, ShieldCheck, Handshake, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";

const StatCard = ({ title, value, icon: Icon, href, loading }: { title: string, value: string | number, icon: React.ElementType, href: string, loading: boolean }) => {
    return (
        <Link href={href}>
            <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
                </CardContent>
            </Card>
        </Link>
    )
}

export default function AdminDashboard({ user }: { user: User }) {
  const firestore = useFirestore();
  
  const platformWalletRef = useMemo(() => firestore ? doc(firestore, 'wallets', 'platform_wallet') : null, [firestore]);
  const { data: platformWallet, loading: walletLoading } = useDoc<Wallet>(platformWalletRef);

  const usersQuery = useMemo(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  const verificationsQuery = useMemo(() => firestore ? query(collection(firestore, 'users'), where('verificationStatus', '==', 'pending')) : null, [firestore]);
  const { data: pendingVerifications, loading: verificationsLoading } = useCollection(verificationsQuery);

  const partnersQuery = useMemo(() => firestore ? query(collection(firestore, 'partnerRequests'), where('status', '==', 'pending')) : null, [firestore]);
  const { data: pendingPartners, loading: partnersLoading } = useCollection<PartnerRequest>(partnersQuery);

  const loading = walletLoading || usersLoading || verificationsLoading || partnersLoading;

  return (
    <div>
      <PageHeader
            title={`Tableau de Bord, ${user.displayName}`}
            description="Vue d'ensemble de la plateforme GoMoodX."
        />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Revenus Plateforme"
            value={platformWallet ? `${platformWallet.balance.toFixed(2)} €` : '0.00 €'}
            icon={DollarSign}
            href="/admin/portefeuille"
            loading={loading}
        />
        <StatCard 
            title="Utilisateurs"
            value={users?.length || 0}
            icon={Users}
            href="/admin/users"
            loading={loading}
        />
        <StatCard 
            title="Vérifications en attente"
            value={pendingVerifications?.length || 0}
            icon={ShieldCheck}
            href="/admin/moderation"
            loading={loading}
        />
        <StatCard 
            title="Partenaires en attente"
            value={pendingPartners?.length || 0}
            icon={Handshake}
            href="/admin/demandes-partenaires"
            loading={loading}
        />
      </div>

      <div className="mt-8">
        <Card>
            <CardHeader>
            <CardTitle>Accès Rapides</CardTitle>
            <CardDescription>Gérez les aspects clés de la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">D'autres modules de gestion apparaîtront ici.</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
