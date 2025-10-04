import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart, Sparkles } from "lucide-react";
import Link from 'next/link';

const stats = [
  { title: "Revenus (30j)", value: "4,250 €", change: "+15.2%", icon: LineChart },
  { title: "Nouveaux Abonnés", value: "78", change: "+32", icon: BarChart },
  { title: "Vues de Profil (7j)", value: "12,345", change: "+8.1%", icon: PieChart },
];

const aiTools = [
    { title: "Générateur de Bio", description: "Créez une biographie captivante et unique.", href: "/outils-ia/generer-bio" },
    { title: "Idées de Contenu", description: "Trouvez l'inspiration pour vos prochaines publications.", href: "/outils-ia/idees-contenu" },
    { title: "Suggestions de Posts", description: "Générez des publications engageantes pour vos fans.", href: "/outils-ia/posts-sociaux" },
    { title: "Studio IA Créatif", description: "Générez images, vidéos et voix par IA.", href: "/outils-ia/studio", icon: Sparkles },
]

export default function EscorteDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change} depuis le mois dernier</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Outils d'Assistance IA</CardTitle>
          <CardDescription>Optimisez votre présence et votre contenu grâce à l'intelligence artificielle.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            {aiTools.map((tool) => (
                <div key={tool.title} className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none flex items-center">
                           {tool.icon && <tool.icon className="mr-2 h-4 w-4 text-primary" />}
                           {tool.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                    <Button asChild><Link href={tool.href}>Utiliser</Link></Button>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
