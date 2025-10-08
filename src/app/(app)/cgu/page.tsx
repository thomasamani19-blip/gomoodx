
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CguPage() {
    const sections = [
        { title: "Article 1 : Objet", content: "Les présentes Conditions Générales d'Utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition du site et des services par GoMoodX et de définir les conditions d’accès et d’utilisation des services par « l'Utilisateur »." },
        { title: "Article 2 : Mentions légales", content: "L'édition du site GoMoodX est assurée par la Société XYZ au capital de 1000 euros, immatriculée au RCS de Paris sous le numéro 123 456 789. E-mail : contact@gomoodx.com." },
        { title: "Article 3 : Accès au site", content: "Le site GoMoodX est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge. L'Utilisateur non membre n'a pas accès aux services réservés. Pour cela, il doit s’inscrire en remplissant le formulaire. En acceptant de s’inscrire aux services réservés, l’Utilisateur membre s’engage à fournir des informations sincères et exactes." },
        { title: "Article 4 : Collecte des données", content: "Le site assure à l'Utilisateur une collecte et un traitement d'informations personnelles dans le respect de la vie privée conformément à la loi n°78-17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés. Pour plus d'informations, consultez notre Politique de Confidentialité." },
        { title: "Article 5 : Propriété intellectuelle", content: "Les marques, logos, signes ainsi que tous les contenus du site (textes, images, son…) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur. L'Utilisateur doit solliciter l'autorisation préalable du site pour toute reproduction, publication, copie des différents contenus." },
        { title: "Article 6 : Responsabilité", content: "Les sources des informations diffusées sur le site GoMoodX sont réputées fiables mais le site ne garantit pas qu’il soit exempt de défauts, d’erreurs ou d’omissions. Le site GoMoodX ne peut être tenu pour responsable de l’utilisation et de l’interprétation de l’information contenue dans ce site. Le site ne peut être tenu pour responsable d’éventuels virus qui pourraient infecter l’ordinateur ou tout matériel informatique de l’Internaute, suite à une utilisation, à l’accès, ou au téléchargement provenant de ce site." },
        { title: "Article 7 : Liens hypertextes", content: "Des liens hypertextes peuvent être présents sur le site. L’Utilisateur est informé qu’en cliquant sur ces liens, il sortira du site GoMoodX. Ce dernier n’a pas de contrôle sur les pages web sur lesquelles aboutissent ces liens et ne saurait, en aucun cas, être responsable de leur contenu." },
        { title: "Article 8 : Droit applicable et juridiction compétente", content: "La législation française s'applique au présent contrat. En cas d'absence de résolution amiable d'un litige né entre les parties, les tribunaux français seront seuls compétents pour en connaître." }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Conditions Générales d'Utilisation"
                description="Dernière mise à jour : 1er Juillet 2024"
            />
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <p className="text-muted-foreground">Bienvenue sur GoMoodX. En accédant à notre site, vous acceptez les présentes conditions d'utilisation. Veuillez les lire attentivement.</p>
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
