'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User } from "@/lib/types";
import PageHeader from "../shared/page-header";
import Link from "next/link";
import { Button } from "../ui/button";
import { Building, Newspaper } from "lucide-react";

export default function PartenaireDashboard({ user }: { user: User }) {
  const managementTools = [
    { title: "Gérer mon profil", description: "Modifiez les informations, la galerie et les détails de votre profil.", href: "/gestion/etablissement", icon: Building },
    { title: "Gérer les produits", description: "Ajoutez ou mettez à jour les produits ou services que vous proposez.", href: "/gestion/produits", icon: Newspaper },
];


  return (
    <div>
        <PageHeader
            title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
            description="Gérez les informations et les services de votre établissement."
        />
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Gestion du Profil</CardTitle>
          <CardDescription>Gérez l'ensemble de vos informations et contenus.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            {managementTools.map((tool) => (
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
