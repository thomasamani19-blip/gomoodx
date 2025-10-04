import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function MessageriePage() {
  return (
    <div>
      <PageHeader
        title="Messagerie Privée"
        description="Échangez avec les autres membres en toute discrétion."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            La messagerie privée est en cours de construction. Vous pourrez bientôt communiquer de manière sécurisée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
