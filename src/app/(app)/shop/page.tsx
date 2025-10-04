import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ShopPage() {
  return (
    <div>
      <PageHeader
        title="Boutique"
        description="Parcourez les contenus premium et produits exclusifs."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            La boutique est en cours de construction. Revenez bientôt pour découvrir des photos, vidéos et produits exclusifs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
