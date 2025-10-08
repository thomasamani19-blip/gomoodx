
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
    const sections = [
        { title: "Article 1 : Collecte des données personnelles", content: "Dans le cadre de l'utilisation du site GoMoodX, nous collectons des informations lorsque vous vous inscrivez, vous connectez, effectuez un achat, et/ou lorsque vous vous déconnectez. Les informations recueillies incluent votre nom, votre adresse e-mail, numéro de téléphone, date de naissance, et les données de transaction." },
        { title: "Article 2 : Utilisation des informations", content: "Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour : personnaliser votre expérience et répondre à vos besoins individuels, fournir un contenu publicitaire personnalisé, améliorer notre site, améliorer le service client et vos besoins de prise en charge, vous contacter par e-mail, et administrer un concours, une promotion, ou une enquête." },
        { title: "Article 3 : Confidentialité et non-divulgation", content: "Nous sommes les seuls propriétaires des informations recueillies sur ce site. Vos informations personnelles ne seront pas vendues, échangées, transférées, ou données à une autre société pour n’importe quelle raison, sans votre consentement, en dehors de ce qui est nécessaire pour répondre à une demande et/ou une transaction, comme par exemple pour expédier une commande." },
        { title: "Article 4 : Protection des informations", content: "Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les informations sensibles transmises en ligne. Nous protégeons également vos informations hors ligne. Seuls les employés qui ont besoin d'effectuer un travail spécifique (par exemple, la facturation ou le service à la clientèle) ont accès aux informations personnelles identifiables." },
        { title: "Article 5 : Cookies", content: "Nos cookies améliorent l’accès à notre site et identifient les visiteurs réguliers. En outre, nos cookies améliorent l’expérience d’utilisateur grâce au suivi et au ciblage de ses intérêts. Cependant, cette utilisation des cookies n’est en aucune façon liée à des informations personnelles identifiables sur notre site." },
        { title: "Article 6 : Droits de l'utilisateur", content: "Conformément à la réglementation en vigueur, l'Utilisateur dispose d'un droit d'accès, de rectification, de suppression et d'opposition de ses données personnelles. L'Utilisateur exerce ce droit via son espace personnel ou par le formulaire de contact." },
        { title: "Article 7 : Consentement", content: "En utilisant notre site, vous consentez à notre politique de confidentialité." }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Politique de Confidentialité"
                description="Dernière mise à jour : 1er Juillet 2024"
            />
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <p className="text-muted-foreground">GoMoodX s'engage à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.</p>
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
