'use server';

/**
 * @fileOverview Implémente la recherche multilingue de profils et de contenu, traduisant automatiquement les résultats.
 *
 * - rechercheMultilingue - Fonction principale pour effectuer la recherche et la traduction.
 * - RechercheMultilingueInput - Type d'entrée pour la fonction rechercheMultilingue.
 * - RechercheMultilingueOutput - Type de sortie pour la fonction rechercheMultilingue.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LanguesSupportees = z.enum(['fr', 'en', 'es', 'it', 'ar']);

const RechercheMultilingueInputSchema = z.object({
  query: z.string().describe("Le terme de recherche dans la langue de l'utilisateur."),
  langueSource: LanguesSupportees.describe("La langue dans laquelle la recherche est effectuée."),
  langueCible: LanguesSupportees.describe("La langue dans laquelle les résultats doivent être traduits."),
});
export type RechercheMultilingueInput = z.infer<typeof RechercheMultilingueInputSchema>;

const ResultatRechercheSchema = z.object({
  type: z.enum(['profil', 'contenu']).describe("Le type de résultat de recherche."),
  titre: z.string().describe("Le titre du résultat (e.g., nom du profil ou titre du contenu)."),
  description: z.string().describe("Une brève description du résultat."),
  url: z.string().url().describe("L'URL du résultat."),
});

const RechercheMultilingueOutputSchema = z.array(ResultatRechercheSchema).describe("Un tableau de résultats de recherche traduits dans la langue cible.");
export type RechercheMultilingueOutput = z.infer<typeof RechercheMultilingueOutputSchema>;

export async function rechercheMultilingue(input: RechercheMultilingueInput): Promise<RechercheMultilingueOutput> {
  return rechercheMultilingueFlow(input);
}

const traduireTexte = ai.defineTool(
  {
    name: 'traduireTexte',
    description: "Traduit un texte d'une langue source à une langue cible.",
    inputSchema: z.object({
      texte: z.string().describe("Le texte à traduire."),
      langueSource: LanguesSupportees.describe("La langue du texte source."),
      langueCible: LanguesSupportees.describe("La langue cible de la traduction."),
    }),
    outputSchema: z.string().describe("Le texte traduit."),
  },
  async input => {
    const {text} = await ai.generate({
      prompt: `Translate the following text from {{langueSource}} to {{langueCible}}: {{texte}}`,
    });
    return text!;
  }
);

const rechercherProfilsEtContenu = ai.defineTool(
  {
    name: 'rechercherProfilsEtContenu',
    description: "Recherche des profils d'escortes et du contenu basé sur un terme de recherche dans une langue spécifique.",
    inputSchema: z.object({
      query: z.string().describe("Le terme de recherche."),
      langue: LanguesSupportees.describe("La langue de la recherche."),
    }),
    outputSchema: z.array(ResultatRechercheSchema).describe("Un tableau de résultats de recherche."),
  },
  async input => {
    // TODO: Implémenter la logique de recherche ici (simulée pour le prototype)
    // Remplacez ceci par une recherche réelle dans votre base de données
    const resultatsSimules: ResultatRechercheSchema[] = [
      {
        type: 'profil',
        titre: 'Escorte de luxe - Paris',
        description: 'Services exclusifs à Paris et en Île-de-France.',
        url: 'https://example.com/profil1',
      },
      {
        type: 'contenu',
        titre: 'Nouvelle vidéo érotique',
        description: 'Découvrez ma dernière vidéo, disponible en exclusivité.',
        url: 'https://example.com/contenu1',
      },
    ];

    return resultatsSimules;
  }
);

const rechercheMultilinguePrompt = ai.definePrompt({
  name: 'rechercheMultilinguePrompt',
  tools: [traduireTexte, rechercherProfilsEtContenu],
  input: {schema: RechercheMultilingueInputSchema},
  output: {schema: RechercheMultilingueOutputSchema},
  prompt: `Vous êtes un assistant de recherche multilingue. L'utilisateur a effectué une recherche dans la langue {{langueSource}} avec le terme "{{query}}".

    1. Utilisez l'outil rechercherProfilsEtContenu pour trouver des profils et du contenu pertinents dans la langue source.
    2. Pour chaque résultat de recherche, utilisez l'outil traduireTexte pour traduire le titre et la description dans la langue cible {{langueCible}}.
    3. Retournez un tableau JSON contenant les résultats traduits.
  `,
});

const rechercheMultilingueFlow = ai.defineFlow(
  {
    name: 'rechercheMultilingueFlow',
    inputSchema: RechercheMultilingueInputSchema,
    outputSchema: RechercheMultilingueOutputSchema,
  },
  async input => {
    const {output} = await rechercheMultilinguePrompt(input);
    return output!;
  }
);

