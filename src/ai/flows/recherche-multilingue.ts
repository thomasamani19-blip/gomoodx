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
    // This is a mock implementation. In a real scenario, you'd use a translation API.
    const {text} = await ai.generate({
      prompt: `Translate the following text from ${input.langueSource} to ${input.langueCible}: "${input.texte}"`,
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
    console.log(`Recherche pour: ${input.query} en langue: ${input.langue}`);
    const resultatsSimules: z.infer<typeof RechercheMultilingueOutputSchema> = [
      {
        type: 'profil',
        titre: 'Profil de Luxe - Paris',
        description: 'Découvrez des expériences exclusives à Paris.',
        url: '/creators/1',
      },
      {
        type: 'contenu',
        titre: 'Vidéo exclusive: "Nuit à Paris"',
        description: 'Une vidéo artistique explorant la beauté de la nuit parisienne.',
        url: '/shop/1',
      },
      {
        type: 'profil',
        titre: 'Companion for Events - NYC',
        description: 'High-class companion for your events in New York City.',
        url: '/creators/2',
      },
    ];

    return resultatsSimules.filter(r => r.titre.toLowerCase().includes(input.query.toLowerCase()) || r.description.toLowerCase().includes(input.query.toLowerCase()));
  }
);

const rechercheMultilingueFlow = ai.defineFlow(
  {
    name: 'rechercheMultilingueFlow',
    inputSchema: RechercheMultilingueInputSchema,
    outputSchema: RechercheMultilingueOutputSchema,
    tools: [rechercherProfilsEtContenu, traduireTexte],
  },
  async (input) => {
    // 1. Rechercher le contenu dans la langue source
    const searchResults = await rechercherProfilsEtContenu({ query: input.query, langue: input.langueSource });

    if (input.langueSource === input.langueCible) {
      return searchResults;
    }

    // 2. Traduire les résultats si la langue cible est différente
    const translatedResults: z.infer<typeof RechercheMultilingueOutputSchema> = [];

    for (const result of searchResults) {
        const [translatedTitle, translatedDescription] = await Promise.all([
            traduireTexte({ texte: result.titre, langueSource: input.langueSource, langueCible: input.langueCible }),
            traduireTexte({ texte: result.description, langueSource: input.langueSource, langueCible: input.langueCible })
        ]);

        translatedResults.push({
            ...result,
            titre: translatedTitle,
            description: translatedDescription,
        });
    }

    return translatedResults;
  }
);
