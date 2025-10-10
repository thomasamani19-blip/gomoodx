
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
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Query } from 'firebase-admin/firestore';
import type { User, Annonce, Product } from '@/lib/types';


// Initialize Firebase Admin SDK if not already done
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({
        credential: applicationDefault(),
    });
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);


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


const rechercherProfilsEtContenu = ai.defineTool(
  {
    name: 'rechercherProfilsEtContenu',
    description: "Recherche des profils d'escortes et de partenaires, ainsi que des annonces et des produits, en fonction d'un terme de recherche dans une langue spécifique et avec des filtres.",
    inputSchema: z.object({
      query: z.string().describe("Le terme de recherche."),
      langue: LanguesSupporteesSchema.describe("La langue de la recherche."),
      filtres: z.record(z.string(), z.boolean()).optional().describe("Filtres de recherche booléens."),
    }),
    outputSchema: z.array(ResultatRechercheSchema).describe("Un tableau de résultats de recherche."),
  },
  async input => {
    console.log(`Recherche pour: ${input.query} en langue: ${input.langue} avec filtres: ${JSON.stringify(input.filtres)}`);
    const searchTerm = input.query.toLowerCase();
    const results: z.infer<typeof RechercheMultilingueOutputSchema> = [];

    // NOTE: Firestore's native search capabilities are limited. For a production app,
    // a dedicated search service like Algolia or Elasticsearch would be necessary for full-text search.
    // Here, we simulate a simple search using array contains and string matching.

    // 1. Search Users (Creators and Partners)
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(doc => {
      const user = doc.data() as User;
      const userContent = [user.displayName, user.bio, user.location, user.city, user.country, user.role].join(' ').toLowerCase();
      if (userContent.includes(searchTerm) && (user.role === 'escorte' || user.role === 'partenaire')) {
        results.push({
          type: 'profil',
          titre: user.displayName,
          description: user.bio || `Profil de ${user.displayName}.`,
          url: `/profil/${doc.id}`,
        });
      }
    });

    // 2. Search Services (Annonces)
    const servicesSnapshot = await db.collection('services').get();
    servicesSnapshot.forEach(doc => {
      const annonce = doc.data() as Annonce;
      const annonceContent = [annonce.title, annonce.description, annonce.category, annonce.location].join(' ').toLowerCase();
      if (annonceContent.includes(searchTerm)) {
        results.push({
          type: 'contenu',
          titre: annonce.title,
          description: annonce.description,
          url: `/annonces/${doc.id}`,
        });
      }
    });
    
    // 3. Search Products
    const productsSnapshot = await db.collection('products').get();
    productsSnapshot.forEach(doc => {
      const product = doc.data() as Product;
      const productContent = [product.title, product.description].join(' ').toLowerCase();
      if (productContent.includes(searchTerm)) {
         results.push({
          type: 'contenu',
          titre: product.title,
          description: product.description,
          url: `/boutique/${doc.id}`,
        });
      }
    });
    
    // De-duplicate results based on URL
    const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
    
    return uniqueResults.slice(0, 20); // Limit to 20 results
  }
);


const rechercheMultilingueFlow = ai.defineFlow(
    {
      name: 'rechercheMultilingueFlow',
      inputSchema: RechercheMultilingueInputSchema,
      outputSchema: RechercheMultilingueOutputSchema,
    },
    async (input) => {
        const llmResponse = await ai.generate({
            prompt: `Tu es un assistant de recherche multilingue. Utilise l'outil 'rechercherProfilsEtContenu' pour trouver les résultats pertinents en fonction de la requête de l'utilisateur. Ensuite, traduis le titre et la description de chaque résultat dans la langue cible spécifiée. Conserve l'URL et le type d'origine.
            
            Requête: "${input.query}"
            Filtres: ${JSON.stringify(input.filtres || {})}
            Langue source: ${input.langueSource}
            Langue cible: ${input.langueCible}
            
            IMPORTANT: N'invente jamais de résultats. Utilise uniquement les données fournies par l'outil. Si l'outil ne renvoie aucun résultat, renvoie un tableau vide.`,
            model: 'googleai/gemini-1.5-flash',
            tools: [rechercherProfilsEtContenu],
            output: {
                schema: RechercheMultilingueOutputSchema
            }
        });
        
        const output = llmResponse.output;
        if (!output) {
          console.log("L'IA n'a pas pu formater directement la sortie. Traitement manuel...");
          const toolRequests = llmResponse.toolRequests;
          if (toolRequests.length > 0) {
            const toolOutput = (await toolRequests[0].tool.fn(toolRequests[0].input as any)).output;
            if (Array.isArray(toolOutput)) {
              return toolOutput; // Return raw results if translation fails
            }
          }
          return [];
        }

        return output;
    }
  );

export async function rechercheMultilingue(
  input: RechercheMultilingueInput
): Promise<RechercheMultilingueOutput> {
  return rechercheMultilingueFlow(input);
}
