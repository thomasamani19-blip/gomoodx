
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Heart, MessageSquare, Wallet } from "lucide-react";
import type { User } from "@/lib/types";
import Link from 'next/link';
import { useCollection } from "@/firebase";
import { limit, where } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";

const recentPurchases = [
    { id: 'p1', item: 'Vidéo "Nuit à Paris"', date: 'Il y a 2 jours', amount: '25.00 €' },
    { id: 'p2', item: 'Album photo "Charme Secret"', date: 'Il y a 1 semaine', amount: '15.00 €' },
    { id: 'p3', item: 'Crédits messagerie (100)', date: 'Il y a 1 semaine', amount: '10.00 €' },
];

export default function ClientDashboard({ user }: { user: User }) {
  const { data: creators, loading: creatorsLoading } = useCollection<User>(
    'users',
    {
      constraints: [where('role', '==', 'escorte'), limit(4)],
    }
  );

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
                    <div className="text-2xl font-bold">125.50 €</div>
                    <p className="text-xs text-muted-foreground">Disponible</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Favoris</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12 Créateurs</div>
                     <p className="text-xs text-muted-foreground">+2 depuis votre dernière visite</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">3 Non lus</div>
                    <p className="text-xs text-muted-foreground">dans 2 conversations</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Créateurs à découvrir</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/annonces">
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
                    {!creatorsLoading && creators?.map(creator => (
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
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Achats récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Article</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentPurchases.map(purchase => (
                                <TableRow key={purchase.id}>
                                    <TableCell>
                                        <div className="font-medium">{purchase.item}</div>
                                        <div className="text-xs text-muted-foreground">{purchase.date}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{purchase.amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
