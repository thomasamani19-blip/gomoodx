
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
  query: z.string().describe("Le terme de recherche dans la langue de l'utilisateur."),
  langueSource: LanguesSupporteesSchema.describe("La langue dans laquelle la recherche est effectuée."),
  langueCible: LanguesSupporteesSchema.describe("La langue dans laquelle les résultats doivent être traduits."),
  filtres: z.record(z.string(), z.boolean()).optional().describe("Un objet de filtres de recherche booléens (ex: { categorie_massage: true, genre_femme: true })."),
});
export type RechercheMultilingueInput = z.infer<typeof RechercheMultilingueInputSchema>;

const ResultatRechercheSchema = z.object({
  type: z.enum(['profil', 'contenu']).describe("Le type de résultat de recherche."),
  titre: z.string().describe("Le titre du résultat (e.g., nom du profil ou titre du contenu)."),
  description: z.string().describe("Une brève description du résultat."),
  url: z.string().url().describe("L'URL du résultat."),
});
export const RechercheMultilingueOutputSchema = z.array(ResultatRechercheSchema).describe("Un tableau de résultats de recherche traduits dans la langue cible.");
export type RechercheMultilingueOutput = z.infer<typeof RechercheMultilingueOutputSchema>;


const rechercherProfilsEtContenuTool = ai.defineTool(
  {
    name: 'rechercherProfilsEtContenu',
    description: "Recherche des profils d'escortes et de partenaires, ainsi que des annonces et des produits, en fonction d'un terme de recherche. Cet outil est la seule source de données.",
    inputSchema: z.object({
      query: z.string().describe("Le terme de recherche."),
    }),
    outputSchema: RechercheMultilingueOutputSchema,
  },
  async ({ query }) => {
    console.log(`Recherche pour: ${query}`);
    return await searchFirestore(query);
  }
);


const rechercheMultilingueFlow = ai.defineFlow(
    {
      name: 'rechercheMultilingueFlow',
      inputSchema: RechercheMultilingueInputSchema,
      outputSchema: RechercheMultilingueOutputSchema,
    },
    async (input) => {
        // Si la langue source et cible sont les mêmes, pas besoin de traduction par l'IA.
        if (input.langueSource === input.langueCible) {
            return await searchFirestore(input.query);
        }

        const llmResponse = await ai.generate({
            prompt: `Tu es un assistant de recherche multilingue. Utilise l'outil 'rechercherProfilsEtContenu' pour trouver les résultats pertinents en fonction de la requête de l'utilisateur. Ensuite, traduis le titre et la description de chaque résultat dans la langue cible spécifiée. Conserve l'URL et le type d'origine.
            
            Requête: "${input.query}"
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

        // Fallback en cas d'échec de la traduction ou du formatage par l'IA
        console.warn("L'IA n'a pas pu formater la sortie. Tentative de récupération des données brutes.");
        const toolRequests = llmResponse.toolRequests;
        if (toolRequests && toolRequests.length > 0) {
          const toolResponse = await toolRequests[0].tool.fn(toolRequests[0].input as any);
          if (toolResponse.output && Array.isArray(toolResponse.output)) {
            return toolResponse.output;
          }
        }
        
        // Si tout échoue, renvoyer un tableau vide.
        return [];
    }
  );

export async function rechercheMultilingue(
  input: RechercheMultilingueInput
): Promise<RechercheMultilingueOutput> {
  return rechercheMultilingueFlow(input);
}
