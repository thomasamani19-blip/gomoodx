import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types";
import PageHeader from "../shared/page-header";

export default function AdminDashboard({ user }: { user: User }) {
  return (
    <div>
      <PageHeader
            title="Tableau de Bord Administrateur"
            description="Vue d'ensemble de la plateforme GoMoodX."
        />
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble de la Plateforme</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Les métriques globales de la plateforme et les tâches de modération apparaîtront ici.</p>
        </CardContent>
      </Card>
    </div>
  );
}
