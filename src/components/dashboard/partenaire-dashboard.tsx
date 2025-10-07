
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User } from "@/lib/types";
import PageHeader from "../shared/page-header";
import Link from "next/link";
import { Button } from "../ui/button";
import { Building, ShoppingBag, Newspaper } from "lucide-react";

export default function PartenaireDashboard({ user }: { user: User }) {
  const isProducer = user.partnerType === 'producer';

  const managementTools = [
    { 
        title: "Gérer le Profil Partenaire", 
        description: "Modifiez les informations, la galerie et les détails de votre profil.", 
        href: "/gestion/etablissement", 
        icon: Building,
        show: true,
    },
    {
        title: "Gérer mes Annonces/Services",
        description: "Créez et gérez les services que votre établissement propose.",
        href: "/gestion/annonces",
        icon: Newspaper,
        show: !isProducer, // Show for establishments
    },
    {
        title: "Gérer mes Produits",
        description: "Ajoutez ou mettez à jour les articles de votre boutique (pour les producteurs).",
        href: "/gestion/produits",
        icon: ShoppingBag,
        show: isProducer, // Show for producers
    }
];


  return (
    <div>
        <PageHeader
            title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
            description="Gérez les informations et les services de votre activité."
        />
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Gestion de votre Présence</CardTitle>
          <CardDescription>Mettez en valeur votre activité pour attirer de nouveaux clients.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            {managementTools.filter(tool => tool.show).map((tool) => (
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
  );
}
