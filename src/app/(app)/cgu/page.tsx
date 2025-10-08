
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CguPage() {
    const sections = [
        { title: "1. Objet", content: "Les présentes conditions générales d'utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition du site et des services par GoMoodX et de définir les conditions d’accès et d’utilisation des services par « l'Utilisateur »." },
        { title: "2. Accès au site", content: "Le site GoMoodX est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge." },
        { title: "3. Propriété intellectuelle", content: "Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son…) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur." },
        { title: "4. Responsabilité", content: "Les sources des informations diffusées sur le site GoMoodX sont réputées fiables mais le site ne garantit pas qu’il soit exempt de défauts, d’erreurs ou d’omissions. Le site ne peut être tenu pour responsable d’éventuels virus qui pourraient infecter l’ordinateur ou tout matériel informatique de l’Internaute, suite à une utilisation, à l’accès, ou au téléchargement provenant de ce site." },
        { title: "5. Droit applicable et juridiction compétente", content: "La législation française s'applique au présent contrat. En cas d'absence de résolution amiable d'un litige né entre les parties, les tribunaux français seront seuls compétents pour en connaître." }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Conditions Générales d'Utilisation"
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
