import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types";
import PageHeader from "../shared/page-header";

export default function PartenaireDashboard({ user }: { user: User }) {
  return (
    <div>
        <PageHeader
            title={`Tableau de bord de ${user?.displayName || 'Partenaire'}`}
            description="Gérez les informations de votre établissement."
        />
      <Card>
        <CardHeader>
          <CardTitle>Statistiques de l'Établissement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Les statistiques de performance de votre établissement apparaîtront ici.</p>
        </CardContent>
      </Card>
    </div>
  );
}
