
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
    const sections = [
        { title: "1. Collecte de l'information", content: "Nous recueillons des informations lorsque vous vous inscrivez sur notre site, lorsque vous vous connectez à votre compte, effectuez un achat, et/ou lorsque vous vous déconnectez. Les informations recueillies incluent votre nom, votre adresse e-mail, numéro de téléphone, et/ou carte de crédit." },
        { title: "2. Utilisation des informations", content: "Toute les informations que nous recueillons auprès de vous peuvent être utilisées pour : personnaliser votre expérience, améliorer notre site, améliorer le service client et vos besoins de prise en charge, vous contacter par e-mail, et administrer un concours, une promotion, ou une enquête." },
        { title: "3. Confidentialité du commerce en ligne", content: "Nous sommes les seuls propriétaires des informations recueillies sur ce site. Vos informations personnelles ne seront pas vendues, échangées, transférées, ou données à une autre société pour n’importe quelle raison, sans votre consentement." },
        { title: "4. Protection des informations", content: "Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les informations sensibles transmises en ligne." },
        { title: "5. Consentement", content: "En utilisant notre site, vous consentez à notre politique de confidentialité." }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Politique de Confidentialité"
                description="Dernière mise à jour : 1er Juillet 2024"
            />
            <Card>
                <CardContent className="pt-6 space-y-6">
                     {sections.map(section => (
                        <div key={section.title}>
                            <h2 className="font-headline text-xl font-bold mb-2">{section.title}</h2>
                            <p className="text-muted-foreground">{section.content}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
