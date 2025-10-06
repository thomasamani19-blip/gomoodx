
'use server';

/**
 * @fileOverview Un flow Genkit pour générer des scénarios pour des contenus vidéo.
 *
 * - genererScenarioVideo - Une fonction qui gère le processus de génération de scénario.
 * - GenererScenarioVideoInput - Le type d'entrée pour la fonction.
 * - GenererScenarioVideoOutput - Le type de retour pour la fonction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

export const GenererScenarioVideoInputSchema = z.object({
  sujet: z.string().describe("Le sujet principal ou le concept de la vidéo."),
  ton: z.string().describe("Le ton de la vidéo (ex: sensuel, humoristique, éducatif, romantique).").optional().default('sensuel'),
  duree: z.string().describe("La durée approximative de la vidéo (ex: 2 minutes, 10 minutes).").optional().default('5 minutes'),
});
export type GenererScenarioVideoInput = z.infer<typeof GenererScenarioVideoInputSchema>;

export const GenererScenarioVideoOutputSchema = z.object({
  titre: z.string().describe("Un titre accrocheur pour la vidéo."),
  synopsis: z.string().describe("Un court résumé de l'histoire ou du concept."),
  scenario: z.string().describe("Le scénario complet, structuré avec des scènes, des actions et des suggestions de dialogues, formaté en Markdown."),
});
export type GenererScenarioVideoOutput = z.infer<typeof GenererScenarioVideoOutputSchema>;


const genererScenarioVideoFlow = ai.defineFlow(
  {
    name: 'genererScenarioVideoFlow',
    inputSchema: GenererScenarioVideoInputSchema,
    outputSchema: GenererScenarioVideoOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      prompt: `Tu es un scénariste professionnel spécialisé dans la création de contenu court et engageant pour les créateurs de la plateforme GoMoodX.
      
      Ta mission est de générer un scénario détaillé pour une vidéo basée sur les informations suivantes :

      - Sujet : "${input.sujet}"
      - Ton : "${input.ton}"
      - Durée approximative : "${input.duree}"

      Le scénario doit être structuré et facile à suivre. Inclus les éléments suivants :
      1.  Un titre accrocheur.
      2.  Un synopsis court (2-3 phrases).
      3.  Un découpage en scènes (ex: SCÈNE 1 - INT. APPARTEMENT - JOUR).
      4.  Pour chaque scène, décris les actions clés, l'ambiance et les angles de caméra suggérés.
      5.  Inclus des suggestions de dialogues ou de narration (si applicable).
      6.  Le tout doit être formaté en Markdown pour une lecture facile.
      7.  Le contenu doit être en français.`,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: GenererScenarioVideoOutputSchema,
      }
    });

    return llmResponse.output ?? { titre: "", synopsis: "", scenario: "" };
  }
);

export async function genererScenarioVideo(
  input: GenererScenarioVideoInput
): Promise<GenererScenarioVideoOutput> {
  return genererScenarioVideoFlow(input);
}
