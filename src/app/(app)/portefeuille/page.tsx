'use client';

import PageHeader from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useCollection } from '@/firebase';
import type { Wallet, Transaction } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, PlusCircle } from 'lucide-react';
import { useMemo } from 'react';

export default function PortefeuillePage() {
  const { user, loading: authLoading } = useAuth();
  
  const walletPath = user ? `users/${user.id}/wallet/main` : null;
  const transactionsPath = user ? `users/${user.id}/transactions` : null;
  
  const { data: wallet, loading: walletLoading } = useDoc<Wallet>(walletPath);
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsPath);

  const loading = authLoading || walletLoading || transactionsLoading;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'credit':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'purchase':
      case 'debit':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  }

  // Sort history by date descending
  const sortedHistory = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);


  return (
    <div>
      <PageHeader
        title="Mon Portefeuille"
        description="Gérez votre solde et consultez l'historique de vos transactions."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
           <Card>
            <CardHeader>
              <CardTitle>Solde Actuel</CardTitle>
            </CardHeader>
            <CardContent>
                {walletLoading && <Skeleton className="h-12 w-1/2" />}
                {!walletLoading && wallet && (
                     <p className="text-5xl font-bold">{wallet.balance ? wallet.balance.toFixed(2) : '0.00'} €</p>
                )}
                 {!walletLoading && !wallet && (
                     <p className="text-5xl font-bold">0.00 €</p>
                )}
            </CardContent>
            <CardFooter>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Recharger le compte
                </Button>
            </CardFooter>
           </Card>
        </div>
        <div className="md:col-span-2">
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
                    {!loading && sortedHistory && sortedHistory.length > 0 && (
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
                                {sortedHistory.map((tx, index) => (
                                    <TableRow key={tx.id || index}>
                                        <TableCell>{getTransactionIcon(tx.type)}</TableCell>
                                        <TableCell className="font-medium capitalize">{tx.description || tx.type}</TableCell>
                                        <TableCell className={`text-right font-semibold ${tx.type === 'deposit' || tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'deposit' || tx.type === 'credit' ? '+' : '-'} {tx.amount.toFixed(2)} €
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {format(new Date(tx.date), "d MMM yyyy, HH:mm", { locale: fr })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!loading && (!sortedHistory || sortedHistory.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">Aucune transaction pour le moment.</p>
                     )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
