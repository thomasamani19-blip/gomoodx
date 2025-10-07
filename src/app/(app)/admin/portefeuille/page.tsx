
'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import type { Wallet, Transaction } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useMemo } from 'react';
import { doc, collection, query, orderBy } from 'firebase/firestore';

export default function AdminWalletPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  
  const walletRef = useMemo(() => firestore ? doc(firestore, 'wallets', 'platform_wallet') : null, [firestore]);
  const transactionsCollection = useMemo(() => firestore ? collection(firestore, 'wallets', 'platform_wallet', 'transactions') : null, [firestore]);
  const transactionsQuery = useMemo(() => transactionsCollection ? query(transactionsCollection, orderBy('createdAt', 'desc')) : null, [transactionsCollection]);

  const { data: wallet, loading: walletLoading } = useDoc<Wallet>(walletRef);
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const loading = authLoading || walletLoading || transactionsLoading;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'commission':
      case 'credit':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'withdrawal_fee':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="Portefeuille de la Plateforme"
        description="Consultez le solde et l'historique des transactions générées par GoMoodX."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
           <Card>
            <CardHeader>
                 <CardTitle>Solde Actuel</CardTitle>
            </CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-12 w-1/2" />}
                {!loading && wallet && (
                     <p className="text-5xl font-bold">{wallet.balance ? wallet.balance.toFixed(2) : '0.00'} €</p>
                )}
                 {!loading && !wallet && (
                     <p className="text-5xl font-bold">0.00 €</p>
                )}
            </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Transactions</CardTitle>
                    <CardDescription>Liste des commissions et autres revenus de la plateforme.</CardDescription>
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
                                        <TableCell className="font-medium capitalize">{tx.description || tx.type}</TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            + {tx.amount.toFixed(2)} €
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
        </div>
      </div>
    </div>
  );
}
