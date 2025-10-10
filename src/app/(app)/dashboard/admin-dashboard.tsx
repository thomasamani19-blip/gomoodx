
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, Wallet, PartnerRequest } from "@/lib/types";
import PageHeader from "@/components/shared/page-header";
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { DollarSign, Users, ShieldCheck, Handshake, Bot } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useState } from "react";
import { genererResumeAdmin, type GenererResumeAdminOutput } from "@/ai/flows/generer-resume-admin";

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

function AdminAISummary() {
    const [summary, setSummary] = useState<GenererResumeAdminOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            try {
                const result = await genererResumeAdmin();
                setSummary(result);
            } catch (e) {
                console.error("Failed to generate admin summary:", e);
                setError("Le résumé de l'IA n'a pas pu être chargé.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Résumé du Jour par l'IA</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <Skeleton className="h-16 w-full" />}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {summary && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary.resume}</p>}
            </CardContent>
        </Card>
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
    <div className="space-y-8">
      <PageHeader
            title={`Tableau de Bord, ${user.displayName}`}
            description="Vue d'ensemble et résumé intelligent de la plateforme GoMoodX."
        />
      
      <AdminAISummary />
      
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
            href="/admin/verifications"
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

    </div>
  );
}
