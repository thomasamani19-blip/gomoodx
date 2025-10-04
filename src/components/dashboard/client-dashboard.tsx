import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientDashboard() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Contenu Récent</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Le contenu que vous avez récemment consulté ou acheté apparaîtra ici.</p>
        </CardContent>
      </Card>
    </div>
  );
}
