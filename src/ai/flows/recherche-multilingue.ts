
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
import { searchFirestore } from '@/services/searchService';


const LanguesSupporteesSchema = z.enum(['fr', 'en', 'es', 'it', 'ar']);

export const RechercheMultilingueInputSchema = z.object({
  query: z.string().describe("Le terme de recherche dans la langue de l'utilisateur.").optional(),
  langueSource: LanguesSupporteesSchema.describe("La langue dans laquelle la recherche est effectuée."),
  langueCible: LanguesSupporteesSchema.describe("La langue dans laquelle les résultats doivent être traduits."),
  types: z.array(z.enum(['profil', 'contenu'])).describe("Les types de contenu à rechercher.").optional(),
  priceMin: z.number().describe("Le prix minimum.").optional(),
  priceMax: z.number().describe("Le prix maximum.").optional(),
  location: z.string().describe("La localisation à rechercher.").optional(),
});
export type RechercheMultilingueInput = z.infer<typeof RechercheMultilingueInputSchema>;

const ResultatRechercheSchema = z.object({
  type: z.enum(['profil', 'contenu']).describe("Le type de résultat de recherche."),
  titre: z.string().describe("Le titre du résultat (e.g., nom du profil ou titre du contenu)."),
  description: z.string().describe("Une brève description du résultat."),
  url: z.string().url().describe("L'URL du résultat."),
  imageUrl: z.string().url().optional().describe("L'URL de l'image principale du résultat."),
  price: z.number().optional().describe("Le prix du contenu ou service."),
});
export const RechercheMultilingueOutputSchema = z.array(ResultatRechercheSchema).describe("Un tableau de résultats de recherche traduits dans la langue cible.");
export type RechercheMultilingueOutput = z.infer<typeof RechercheMultilingueOutputSchema>;


const rechercherProfilsEtContenuTool = ai.defineTool(
  {
    name: 'rechercherProfilsEtContenu',
    description: "Recherche des profils d'escortes et de partenaires, ainsi que des annonces et des produits, en fonction de critères de recherche. Cet outil est la seule source de données.",
    inputSchema: z.object({
      query: z.string().optional(),
      types: z.array(z.enum(['profil', 'contenu'])).optional(),
      priceMin: z.number().optional(),
      priceMax: z.number().optional(),
      location: z.string().optional(),
    }),
    outputSchema: RechercheMultilingueOutputSchema,
  },
  async (input) => {
    console.log(`Recherche Firestore pour:`, input);
    return await searchFirestore(input);
  }
);


const rechercheMultilingueFlow = ai.defineFlow(
    {
      name: 'rechercheMultilingueFlow',
      inputSchema: RechercheMultilingueInputSchema,
      outputSchema: RechercheMultilingueOutputSchema,
    },
    async (input) => {
        const { query, types, priceMin, priceMax, location } = input;
        
        // Si la langue source et cible sont les mêmes, pas besoin de traduction par l'IA.
        // On effectue une recherche directe.
        if (input.langueSource === input.langueCible) {
            return await searchFirestore({ query, types, priceMin, priceMax, location });
        }

        // Si les langues sont différentes, on utilise le flow avec l'IA pour la traduction.
        const llmResponse = await ai.generate({
            prompt: `Tu es un assistant de recherche multilingue. Utilise l'outil 'rechercherProfilsEtContenu' pour trouver les résultats pertinents en fonction des critères de l'utilisateur. Ensuite, traduis le titre et la description de chaque résultat dans la langue cible spécifiée. Conserve l'URL, l'URL de l'image, le prix, et le type d'origine.
            
            Requête: "${query}"
            Filtres:
             - Types: ${types?.join(', ')}
             - Prix Min: ${priceMin}
             - Prix Max: ${priceMax}
             - Localisation: ${location}
            Langue source: ${input.langueSource}
            Langue cible: ${input.langueCible}
            
            IMPORTANT: N'invente jamais de résultats. Utilise uniquement les données fournies par l'outil. Si l'outil ne renvoie aucun résultat, renvoie un tableau vide.`,
            model: 'googleai/gemini-1.5-flash',
            tools: [rechercherProfilsEtContenuTool],
            output: {
                schema: RechercheMultilingueOutputSchema
            }
        });
        
        const output = llmResponse.output;
        if (output && Array.isArray(output)) {
          return output;
        }

        // Fallback en cas d'échec de la traduction ou du formatage par l'IA.
        console.warn("L'IA n'a pas pu formater la sortie. Tentative de récupération des données brutes de l'outil.");
        
        const toolRequests = llmResponse.toolRequests;
        if (toolRequests && toolRequests.length > 0 && toolRequests[0].tool.name === 'rechercherProfilsEtContenu') {
          const toolInput = toolRequests[0].input as typeof input;
          const fallbackResults = await searchFirestore(toolInput);
          return fallbackResults;
        }
        
        return [];
    }
  );

export async function rechercheMultilingue(
  input: RechercheMultilingueInput
): Promise<RechercheMultilingueOutput> {
  return rechercheMultilingueFlow(input);
}
