import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div>
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
