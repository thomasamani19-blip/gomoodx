import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartenaireDashboard() {
  return (
    <div>
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
