
'use client';

import PageHeader from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Heart, Search, ShieldCheck, Sparkles, Users } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center gap-4">
        <div className="bg-primary/10 p-4 rounded-full border-2 border-primary/30">
            <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-headline text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
)

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="À Propos de GoMoodX"
        description="Votre destination pour des contenus et des expériences exclusives."
      />
      <div className="space-y-16">
        <section>
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Comment ça marche ?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Découvrez, connectez-vous et profitez en quelques étapes simples.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                <FeatureCard icon={Search} title="1. Découvrez" description="Explorez une sélection exclusive de profils, de contenus et de services proposés par nos créateurs vérifiés."/>
                <FeatureCard icon={Heart} title="2. Connectez" description="Interagissez via la messagerie privée, les appels vidéo ou en rejoignant des sessions live uniques."/>
                <FeatureCard icon={Gift} title="3. Profitez" description="Achetez du contenu premium, réservez des expériences inoubliables et soutenez vos créateurs favoris."/>
            </div>
        </section>

        <section>
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8">Pourquoi nous choisir ?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Nous offrons une plateforme sûre, innovante et gratifiante pour les créateurs et les membres.</p>
            </div>
            <Card className="bg-gradient-to-br from-card to-background border-primary/30">
                <CardContent className="grid md:grid-cols-3 gap-6 text-center p-8 md:p-12">
                    <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 text-primary" />
                        <h3 className="font-semibold text-lg">Communauté Exclusive</h3>
                        <p className="text-sm text-muted-foreground">Accédez à un cercle privé de créateurs et de membres partageant les mêmes idées, où la qualité prime sur la quantité.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                        <h3 className="font-semibold text-lg">Sécurité & Discrétion</h3>
                        <p className="text-sm text-muted-foreground">Votre vie privée est notre priorité. Profitez de transactions sécurisées et d'échanges confidentiels.</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Sparkles className="h-10 w-10 text-primary" />
                        <h3 className="font-semibold text-lg">Outils IA Innovants</h3>
                        <p className="text-sm text-muted-foreground">Nous équipons nos créateurs d'outils d'IA pour booster leur créativité et leur productivité.</p>
                    </div>
                </CardContent>
            </Card>
        </section>
      </div>
    </div>
  );
}
