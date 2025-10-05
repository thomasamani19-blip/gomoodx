import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Heart, MessageSquare, Wallet } from "lucide-react";
import type { User } from "@/lib/types";
import Link from 'next/link';

// Données factices
const favoriteCreators = [
  { id: '1', name: 'Isabelle', avatar: 'https://images.unsplash.com/photo-1615538785945-6625ccdb4b25?w=100&h=100&fit=crop' },
  { id: '2', name: 'Chloé', avatar: 'https://images.unsplash.com/photo-1627577279497-4b24bf1021b6?w=100&h=100&fit=crop' },
  { id: '3', name: 'Sofia', avatar: 'https://images.unsplash.com/photo-1723291875355-cc9be3c07a76?w=100&h=100&fit=crop' },
  { id: '4', name: 'Léa', avatar: 'https://images.unsplash.com/photo-1597855368386-1d0a518883b4?w=100&h=100&fit=crop' },
];

const recentPurchases = [
    { id: 'p1', item: 'Vidéo "Nuit à Paris"', date: 'Il y a 2 jours', amount: '25.00 €' },
    { id: 'p2', item: 'Album photo "Charme Secret"', date: 'Il y a 1 semaine', amount: '15.00 €' },
    { id: 'p3', item: 'Crédits messagerie (100)', date: 'Il y a 1 semaine', amount: '10.00 €' },
];

export default function ClientDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-8">
        <PageHeader
            title={`Bienvenue, ${user?.nom || '...'}`}
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
                    <CardTitle>Vos créateurs favoris</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/favoris">
                            Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {favoriteCreators.map(creator => (
                        <Link href={`/creators/${creator.id}`} key={creator.id} className="flex flex-col items-center gap-2 group">
                            <Avatar className="h-20 w-20 border-2 border-transparent group-hover:border-primary transition-colors">
                                <AvatarImage src={creator.avatar} />
                                <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-center">{creator.name}</span>
                        </Link>
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
