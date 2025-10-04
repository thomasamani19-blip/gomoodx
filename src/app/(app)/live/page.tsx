import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function LivePage() {
  return (
    <div>
      <PageHeader
        title="Live Streaming"
        description="Rejoignez les créateurs en direct pour des moments uniques."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            La section Live est en cours de développement. Bientôt, vous pourrez interagir en direct avec vos créateurs favoris.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
