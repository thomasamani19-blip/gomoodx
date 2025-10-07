
'use server';
/**
 * @fileOverview Un flow Genkit pour la modération de contenu.
 *
 * - modererContenu - Une fonction qui analyse un contenu et détermine s'il est conforme aux règles.
 * - ModererContenuInput - Le type d'entrée pour la fonction.
 * - ModererContenuOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import type { ModerationStatus } from '@/lib/types';


export const ModererContenuInputSchema = z.object({
  texte: z.string().describe('Le contenu textuel à analyser (description, titre, etc.).'),
  typeContenu: z.string().describe('Le type de contenu (ex: Annonce, Produit, Post).'),
});
export type ModererContenuInput = z.infer<typeof ModererContenuInputSchema>;

export const ModererContenuOutputSchema = z.object({
  status: z.enum(['approved', 'pending_review']).describe("Le statut de modération : 'approved' si conforme, 'pending_review' si suspect."),
  raison: z.string().optional().describe('La raison pour laquelle le contenu est jugé suspect.'),
});
export type ModererContenuOutput = z.infer<typeof ModererContenuOutputSchema>;

const modererContenuFlow = ai.defineFlow(
  {
    name: 'modererContenuFlow',
    inputSchema: ModererContenuInputSchema,
    outputSchema: ModererContenuOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `Tu es un modérateur de contenu IA pour la plateforme GoMoodX. Ton rôle est de t'assurer que le contenu publié par les utilisateurs respecte strictement les règles.
      
      Règles de la plateforme (INTERDICTIONS FORMELLES) :
      - Pas de contenu lié à la drogue.
      - Pas d'armes.
      - Pas de prostitution forcée ou de traite d'êtres humains.
      - Pas de contenu impliquant des mineurs.

      Analyse le texte suivant pour un contenu de type "${input.typeContenu}":
      ---
      ${input.texte}
      ---
      
      Réponds avec le statut 'pending_review' si le contenu enfreint ou semble enfreindre l'une de ces règles, et fournis une raison claire et concise. Sinon, réponds avec le statut 'approved'.`,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: ModererContenuOutputSchema,
      },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }
    });

    return llmResponse.output ?? { status: 'pending_review', raison: 'Analyse IA échouée' };
  }
);

export async function modererContenu(
  input: ModererContenuInput
): Promise<ModererContenuOutput> {
  return modererContenuFlow(input);
}

    