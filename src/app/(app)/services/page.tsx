import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ServicesPage() {
  return (
    <div>
      <PageHeader
        title="Services"
        description="Découvrez le catalogue des services proposés."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Le catalogue de services est en cours de construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
