
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

const SearchEntitiesSchema = z.object({
    keywords: z.string().optional().describe("Le mot-clé principal, le sujet, ou le nom recherché."),
    location: z.string().optional().describe("La ville, le pays ou le lieu mentionné dans la recherche."),
    type: z.enum(['profil', 'contenu', '']).optional().describe("Le type d'entité recherchée (profil ou contenu)."),
    role: z.enum(['escorte', 'partenaire', '']).optional().describe("Le rôle spécifique de la personne recherchée."),
    category: z.string().optional().describe("La catégorie spécifique de service ou produit (ex: 'massage', 'dîner', 'vidéo')."),
});

const rechercherProfilsEtContenuTool = ai.defineTool(
  {
    name: 'rechercherProfilsEtContenu',
    description: "Recherche des profils d'utilisateurs (escortes, partenaires) et des contenus (services, produits) dans la base de données. Cet outil est la seule source de données.",
    inputSchema: SearchEntitiesSchema,
    outputSchema: RechercheMultilingueOutputSchema,
  },
  async (input) => {
    // Les filtres (types, priceMin, etc.) sont passés dans le contexte du flow,
    // on peut les récupérer et les merger ici si besoin.
    // Pour ce prototype, on passe l'input de l'IA directement au service de recherche.
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
        const { query, types, priceMin, priceMax, location, langueCible, langueSource } = input;
        
        // Si la recherche est vide, on retourne un tableau vide pour éviter une exécution inutile.
        if (!query && !location && !priceMin && !priceMax) {
             return [];
        }

        const llmResponse = await ai.generate({
            prompt: `Tu es un assistant de recherche multilingue expert pour la plateforme GoMoodX.
            1. Analyse la requête de l'utilisateur : "${query || ''}". Extrais-en les entités clés (mots-clés, lieu, catégorie de service, type de profil recherché comme 'escorte' ou 'partenaire').
            2. Utilise TOUJOURS l'outil 'rechercherProfilsEtContenu' avec ces entités pour trouver les résultats pertinents dans la base de données. L'outil prendra en compte les filtres supplémentaires fournis par l'utilisateur (location, priceMin, priceMax, types).
            3. Si la langue cible ('${langueCible}') est différente de la langue source ('${langueSource}'), traduis le titre et la description de chaque résultat dans la langue cible. Conserve l'URL, l'URL de l'image, le prix, et le type d'origine. Ne traduis pas si les langues sont identiques.
            
            IMPORTANT: N'invente jamais de résultats. Utilise uniquement les données fournies par l'outil. Si l'outil ne renvoie aucun résultat, renvoie un tableau vide.`,
            model: 'googleai/gemini-1.5-flash',
            tools: [rechercherProfilsEtContenuTool],
            context: { // On passe les filtres de l'UI directement au contexte du flow.
              types,
              priceMin,
              priceMax,
              location,
            }
        });
        
        const toolCalls = llmResponse.toolCalls();

        if (toolCalls && toolCalls.length > 0 && toolCalls[0].tool.name === 'rechercherProfilsEtContenu') {
          // L'IA a correctement décidé d'utiliser l'outil.
          // Le résultat de l'outil est automatiquement géré par Genkit et sera dans la prochaine partie de la réponse.
          // On attend la réponse textuelle finale qui devrait contenir les résultats traduits si besoin.
          const finalOutput = await llmResponse.output();
          
          if(finalOutput && Array.isArray(finalOutput)) {
              return finalOutput as RechercheMultilingueOutput;
          }
          // Si la sortie n'est pas un tableau (ex: l'IA a juste répondu en texte), 
          // on utilise les résultats bruts de l'outil.
          const toolResults = await toolCalls[0].result;
          return toolResults as RechercheMultilingueOutput;
        }

        // Fallback si l'IA n'a pas utilisé l'outil (par exemple, si la requête est vide)
        // ou si un autre comportement inattendu se produit.
        return await searchFirestore({ types, priceMin, priceMax, location, keywords: query });
    }
  );

export async function rechercheMultilingue(
  input: RechercheMultilingueInput
): Promise<RechercheMultilingueOutput> {
  return rechercheMultilingueFlow(input);
}
