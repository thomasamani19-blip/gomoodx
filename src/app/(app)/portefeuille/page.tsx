'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import type { Wallet, Transaction, Call, UserRole } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, PlusCircle, Video, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, Banknote, Gift } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { doc, collection, query, or, where, orderBy } from 'firebase/firestore';
import { formatDuration } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function CallHistory() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();

    const callsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'calls'),
            or(where('callerId', '==', user.id), where('receiverId', '==', user.id)),
            orderBy('createdAt', 'desc')
        );
    }, [user, firestore]);
    
    const { data: calls, loading: callsLoading } = useCollection<Call>(callsQuery);

    const loading = authLoading || callsLoading;

    const getCallCost = (call: Call) => {
        if (call.isFreeCall || !call.pricePerMinute || !call.billedDuration || call.billedDuration <= 0) {
            return 'Gratuit';
        }
        const minutesBilled = Math.ceil(call.billedDuration / 60);
        const totalCost = minutesBilled * call.pricePerMinute;
        return `${totalCost.toFixed(2)} €`;
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Appels</CardTitle>
                    <CardDescription>Chargement de vos appels récents...</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!calls || calls.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Historique des Appels</CardTitle>
                    <CardDescription>Retrouvez ici vos appels entrants et sortants.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun appel dans votre historique.</p>
                </CardContent>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique des Appels</CardTitle>
                <CardDescription>Retrouvez ici vos appels entrants et sortants.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Interlocuteur</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Coût</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {calls.map((call) => {
                            const isCaller = call.callerId === user?.id;
                            const otherPartyName = isCaller ? 'Destinataire' : call.callerName; // Simplified, ideally fetch other user name
                            
                            return (
                            <TableRow key={call.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                     {isCaller ? <ArrowRight className="h-4 w-4 text-red-500"/> : <ArrowLeft className="h-4 w-4 text-green-500" />}
                                    {otherPartyName}
                                </TableCell>
                                 <TableCell>
                                    {call.type === 'video' ? <Video className="h-5 w-5"/> : <Phone className="h-5 w-5"/>}
                                </TableCell>
                                <TableCell>{call.billedDuration ? formatDuration(call.billedDuration) : '-'}</TableCell>
                                 <TableCell className="font-semibold">
                                    {getCallCost(call)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                     {call.createdAt?.toDate ? format(call.createdAt.toDate(), "d MMM yyyy, HH:mm", { locale: fr }) : 'N/A'}
                                </TableCell>
                            </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function PortefeuillePage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [showBalance, setShowBalance] = useState(true);
  
  const walletRef = useMemo(() => user ? doc(firestore, 'wallets', user.id) : null, [user, firestore]);
  const transactionsCollection = useMemo(() => user ? collection(firestore, 'wallets', user.id, 'transactions') : null, [user, firestore]);
  const transactionsQuery = useMemo(() => transactionsCollection ? query(transactionsCollection, orderBy('createdAt', 'desc')) : null, [transactionsCollection]);

  const { data: wallet, loading: walletLoading } = useDoc<Wallet>(walletRef);
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const loading = authLoading || walletLoading || transactionsLoading;

  const isEligibleForWithdrawal = user?.role === 'escorte' || user?.role === 'partenaire';

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'credit':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'reward':
          return <Gift className="h-5 w-5 text-yellow-500" />;
      case 'purchase':
      case 'debit':
      case 'withdrawal':
      case 'call_fee':
      case 'subscription_fee':
      case 'contact_pass':
      case 'article_purchase':
      case 'live_ticket':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="Mon Portefeuille"
        description="Gérez votre solde et consultez l'historique de vos transactions."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-4">
           <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                 <CardTitle>Solde Actuel</CardTitle>
                 <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)}>
                    {showBalance ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                    <span className="sr-only">Afficher/Cacher le solde</span>
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-12 w-1/2" />}
                {!loading && wallet && (
                     <p className="text-5xl font-bold">{showBalance ? `${wallet.balance ? wallet.balance.toFixed(2) : '0.00'} €` : '****** €'}</p>
                )}
                 {!loading && !wallet && (
                     <p className="text-5xl font-bold">{showBalance ? '0.00 €' : '****** €'}</p>
                )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2">
                <Button asChild>
                    <Link href="/portefeuille/recharger">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Acheter des Crédits
                    </Link>
                </Button>
                {isEligibleForWithdrawal && (
                    <Button variant="outline" asChild>
                        <Link href="/portefeuille/retrait">
                            <Banknote className="mr-2 h-4 w-4"/>
                            Effectuer un retrait
                        </Link>
                    </Button>
                )}
            </CardFooter>
           </Card>
           {user?.rewardPoints !== undefined && user.rewardPoints > 0 && (
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Points de Récompense</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.rewardPoints} pts</p>
                <p className="text-sm text-muted-foreground">Équivaut à environ {(user.rewardPoints / 100).toFixed(2)} €</p>
              </CardContent>
              <CardFooter>
                 <Button variant="secondary" disabled>Convertir (bientôt)</Button>
              </CardFooter>
             </Card>
           )}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Transactions</CardTitle>
                    <CardDescription>Voici la liste de vos dernières transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    {!loading && transactions && transactions.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{getTransactionIcon(tx.type)}</TableCell>
                                        <TableCell className="font-medium capitalize">{tx.description || tx.reference || tx.type}</TableCell>
                                        <TableCell className={`text-right font-semibold ${['deposit', 'credit', 'reward'].includes(tx.type) ? 'text-green-600' : 'text-destructive'}`}>
                                            {['deposit', 'credit', 'reward'].includes(tx.type) ? '+' : '-'} {tx.amount.toFixed(2)} {tx.type === 'reward' ? 'pts' : '€'}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "d MMM yyyy, HH:mm", { locale: fr }) : 'Date inconnue'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!loading && (!transactions || transactions.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction pour le moment.</p>
                     )}
                </CardContent>
            </Card>

            {(user?.role === 'client' || user?.role === 'escorte') && <CallHistory />}
        </div>
      </div>
    </div>
  );
}
