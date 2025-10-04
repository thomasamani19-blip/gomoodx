import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function BlogPage() {
  return (
    <div>
      <PageHeader
        title="Blog"
        description="Lisez les derniers articles de nos créateurs."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Le blog est en cours de construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
