
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, ShoppingBag, Star, Video, DollarSign } from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";


const managementTools = [
    { title: "Gérer mes annonces", description: "Modifiez vos services, prix et disponibilités.", href: "/gestion/annonces", icon: Newspaper, roles: ['escorte'] },
    { title: "Gérer mes produits", description: "Ajoutez ou mettez à jour les articles de votre boutique.", href: "/gestion/produits", icon: ShoppingBag, roles: ['escorte', 'partenaire'] },
    { title: "Gérer mes articles", description: "Rédigez et publiez de nouveaux articles de blog.", href: "/gestion/articles", icon: Newspaper, roles: ['escorte', 'partenaire'] },
    { title: "Gérer les abonnements Fan", description: "Définissez vos niveaux d'abonnement pour les fans.", href: "/gestion/abonnement", icon: Star, roles: ['escorte'] },
    { title: "Gérer les lives", description: "Planifiez et gérez vos sessions de live streaming.", href: "/gestion/lives", icon: Video, roles: ['escorte', 'partenaire'] },
    { title: "Gérer mes tarifs", description: "Définissez vos prix pour les rencontres et appels.", href: "/gestion/tarifs", icon: DollarSign, roles: ['escorte', 'partenaire'] },
];

export default function GestionPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div>
                <PageHeader title="Gestion de Contenu" />
                <div className="grid gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    if (!user || (user.role !== 'escorte' && user.role !== 'partenaire')) {
        router.push('/dashboard');
        return null;
    }

    const availableTools = managementTools.filter(tool => tool.roles.includes(user.role));
    
    return (
        <div>
            <PageHeader
                title="Gestion de Contenu"
                description="Gérez l'ensemble de vos contenus, services et publications depuis un seul endroit."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Mes Outils de Gestion</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {availableTools.map((tool) => (
                        <Link key={tool.title} href={tool.href} className="flex items-center justify-between space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none flex items-center">
                                {tool.icon && <tool.icon className="mr-2 h-4 w-4 text-primary" />}
                                {tool.title}
                                </p>
                                <p className="text-sm text-muted-foreground">{tool.description}</p>
                            </div>
                            <Button variant="secondary">Gérer</Button>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
