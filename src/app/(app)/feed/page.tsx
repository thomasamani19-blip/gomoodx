'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function FeedPage() {

    return (
        <div>
            <PageHeader 
                title="Fil d'actualité"
                description="Découvrez les dernières publications de la communauté GoMoodX."
            />

            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">Le contenu du fil d'actualité apparaîtra bientôt ici.</p>
                </CardContent>
            </Card>
        </div>
    )
}
