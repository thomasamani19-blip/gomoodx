'use server';

/**
 * @fileOverview Un flow Genkit pour générer des images à l'aide de l'IA.
 *
 * - genererImageIA - Une fonction qui gère le processus de génération d'image.
 * - GenererImageIAInput - Le type d'entrée pour la fonction genererImageIA.
 * - GenererImageIAOutput - Le type de retour pour la fonction genererImageIA.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit/zod';

export const GenererImageIAInputSchema = z.object({
  prompt: z.string().describe('Une description détaillée de l’image à générer.'),
  style: z.string().describe("Le style de l'image (ex: photoréaliste, artistique, fantastique).").optional(),
});
export type GenererImageIAInput = z.infer<typeof GenererImageIAInputSchema>;

export const GenererImageIAOutputSchema = z.object({
  imageUrl: z.string().describe("L'URL de l'image générée, encodée en Base64 data URI."),
});
export type GenererImageIAOutput = z.infer<typeof GenererImageIAOutputSchema>;


const genererImageIAFlow = ai.defineFlow(
  {
    name: 'genererImageIAFlow',
    inputSchema: GenererImageIAInputSchema,
    outputSchema: GenererImageIAOutputSchema,
  },
  async (input) => {
    const fullPrompt = `${input.prompt}, style: ${input.style || 'photorealistic'}`;

    const { media } = await ai.generate({
      model: googleAI.model('imagen-2'),
      prompt: fullPrompt,
    });

    const imageUrl = media.url;
    if (!imageUrl) {
      throw new Error("La génération d'image a échoué.");
    }

    return { imageUrl };
  }
);

export async function genererImageIA(
    input: GenererImageIAInput
  ): Promise<GenererImageIAOutput> {
    return genererImageIAFlow(input);
  }
  