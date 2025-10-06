

'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Heart, MessageSquare, Wallet } from "lucide-react";
import type { User, Transaction } from "@/lib/types";
import Link from 'next/link';
import { useCollection, useDoc, useFirestore } from "@/firebase";
import { limit, where, query, collection, doc, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientDashboard({ user }: { user: User }) {
  const firestore = useFirestore();

  // Query for favorite creators
  const favoriteIds = user?.favorites && user.favorites.length > 0 ? user.favorites : [];
  const creatorsQuery = useMemo(() => {
    if (favoriteIds.length === 0 || !firestore) return null;
    // Query for the first 4 favorite creators
    return query(collection(firestore, 'users'), where('__name__', 'in', favoriteIds.slice(0, 4)));
  }, [firestore, favoriteIds]);
  const { data: creators, loading: creatorsLoading } = useCollection<User>(creatorsQuery);
  
  // Query for wallet
  const walletRef = useMemo(() => firestore ? doc(firestore, 'wallets', user.id) : null, [firestore, user.id]);
  const { data: wallet, loading: walletLoading } = useDoc<any>(walletRef);

  // Query for recent purchases
  const transactionsQuery = useMemo(() => 
    firestore 
      ? query(
          collection(firestore, `wallets/${user.id}/transactions`), 
          where('type', 'in', ['purchase', 'debit']), 
          orderBy('createdAt', 'desc'), 
          limit(3)
        )
      : null,
    [firestore, user.id]
  );
  const { data: recentPurchases, loading: purchasesLoading } = useCollection<Transaction>(transactionsQuery);

  // Query for unread messages (simplified)
  const messagesQuery = useMemo(() => 
      firestore ? query(collection(firestore, 'messages'), where('receiverId', '==', user.id), where('isRead', '==', false)) : null,
      [firestore, user.id]
  );
  const { data: unreadMessages, loading: messagesLoading } = useCollection(messagesQuery);

  const unreadConversationsCount = useMemo(() => {
    if (!unreadMessages) return 0;
    const senderIds = new Set(unreadMessages.map((msg: any) => msg.senderId));
    return senderIds.size;
  }, [unreadMessages]);


  return (
    <div className="space-y-8">
        <PageHeader
            title={`Bienvenue, ${user?.displayName || '...'}`}
            description="Votre espace personnel sur GoMoodX."
        />
        
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Portefeuille</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {walletLoading ? <Skeleton className="h-8 w-1/2" /> : (
                        <div className="text-2xl font-bold">{wallet?.balance?.toFixed(2) || '0.00'} €</div>
                    )}
                    <p className="text-xs text-muted-foreground">Disponible</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Favoris</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{user.favorites?.length || 0} Créateurs</div>
                     <p className="text-xs text-muted-foreground">Vos créateurs préférés</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {messagesLoading ? <Skeleton className="h-8 w-1/2"/> : (
                        <>
                            <div className="text-2xl font-bold">{unreadMessages?.length || 0} Non lus</div>
                            <p className="text-xs text-muted-foreground">dans {unreadConversationsCount} conversation(s)</p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Vos Créateurs Favoris</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/favoris">
                            Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {creatorsLoading && Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                             <Skeleton className="h-20 w-20 rounded-full" />
                             <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                    {!creatorsLoading && creators && creators.length > 0 && creators.map(creator => (
                        <div key={creator.id} className="flex flex-col items-center gap-2 group">
                            <Link href={`/profil/${creator.id}`} className="flex flex-col items-center gap-2 text-center">
                                <Avatar className="h-20 w-20 border-2 border-transparent group-hover:border-primary transition-colors">
                                    <AvatarImage src={creator.profileImage} alt={creator.displayName} />
                                    <AvatarFallback>{creator.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{creator.displayName}</span>
                            </Link>
                        </div>
                    ))}
                     {!creatorsLoading && (!creators || creators.length === 0) && (
                        <p className="col-span-full text-center text-sm text-muted-foreground py-4">Ajoutez des créateurs à vos favoris pour les voir ici.</p>
                     )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Achats récents</CardTitle>
                </CardHeader>
                <CardContent>
                    {purchasesLoading ? <Skeleton className="h-24 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Article</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPurchases && recentPurchases.length > 0 ? recentPurchases.map(purchase => (
                                    <TableRow key={purchase.id}>
                                        <TableCell>
                                            <div className="font-medium">{purchase.description}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {purchase.createdAt?.toDate ? formatDistanceToNow(purchase.createdAt.toDate(), { addSuffix: true, locale: fr }) : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-red-500">- {purchase.amount.toFixed(2)} €</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">Aucun achat récent.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    