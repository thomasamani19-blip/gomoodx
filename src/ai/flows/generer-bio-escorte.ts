'use server';

/**
 * @fileOverview Un agent IA de génération de bio pour les escortes.
 *
 * - genererBioEscorte - Une fonction qui gère le processus de génération de bio.
 * - GenererBioEscorteInput - Le type d'entrée pour la fonction genererBioEscorte.
 * - GenererBioEscorteOutput - Le type de retour pour la fonction genererBioEscorte.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenererBioEscorteInputSchema = z.object({
  typeDeService: z.string().describe("Le type de service offert par l'escorte (e.g., rencontres, massages, etc.)."),
  personnalite: z.string().describe("La personnalité de l'escorte (e.g., charmante, aventureuse, douce)."),
  gouts: z.string().describe("Les goûts et préférences de l'escorte (e.g., voyages, gastronomie, art)."),
  attentesClients: z.string().describe("Ce que l'escorte attend de ses clients (e.g., respect, discrétion, bonne humeur)."),
});
export type GenererBioEscorteInput = z.infer<typeof GenererBioEscorteInputSchema>;

export const GenererBioEscorteOutputSchema = z.object({
  bio: z.string().describe("Une bio attrayante et unique pour l'escorte."),
});
export type GenererBioEscorteOutput = z.infer<typeof GenererBioEscorteOutputSchema>;


const genererBioEscorteFlow = ai.defineFlow(
  {
    name: 'genererBioEscorteFlow',
    inputSchema: GenererBioEscorteInputSchema,
    outputSchema: GenererBioEscorteOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      prompt: `Tu es un expert en rédaction de bios pour les escortes. Ton objectif est de créer une bio qui soit à la fois attrayante, unique et qui reflète la personnalité et les services offerts par l'escorte.

Utilise les informations suivantes pour rédiger la bio:

Type de service: ${input.typeDeService}
Personnalité: ${input.personnalite}
Goûts: ${input.gouts}
Attentes des clients: ${input.attentesClients}
`,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: GenererBioEscorteOutputSchema,
      }
    });

    return llmResponse.output ?? { bio: "" };
  }
);

export async function genererBioEscorte(
  input: GenererBioEscorteInput
): Promise<GenererBioEscorteOutput> {
  return genererBioEscorteFlow(input);
}
