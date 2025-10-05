'use server';

/**
 * @fileOverview Ce fichier contient un flow Genkit pour suggérer des publications engageantes pour les réseaux sociaux.
 *
 * - suggerePublicationReseauxSociaux - Une fonction qui gère le processus de suggestion de publication.
 * - SuggestionPublicationReseauxSociauxInput - Le type d'entrée pour la fonction suggerePublicationReseauxSociaux.
 * - SuggestionPublicationReseauxSociauxOutput - Le type de retour pour la fonction suggerePublicationReseauxSociaux.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

export const SuggestionPublicationReseauxSociauxInputSchema = z.object({
  theme: z.string().describe("Le thème de la publication, par exemple 'conseils de beauté', 'astuces de voyage', 'citations inspirantes'."),
  reseauSocial: z.string().describe("Le réseau social cible, par exemple 'Instagram', 'Twitter', 'Facebook'."),
  style: z.string().describe("Le style de la publication, par exemple 'humoristique', 'informatif', 'provocateur'."),
  nombreSuggestions: z.number().describe("Le nombre de suggestions de publications à générer.").default(3),
});
export type SuggestionPublicationReseauxSociauxInput = z.infer<typeof SuggestionPublicationReseauxSociauxInputSchema>;

export const SuggestionPublicationReseauxSociauxOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("Une liste de suggestions de publications pour les réseaux sociaux."),
});
export type SuggestionPublicationReseauxSociauxOutput = z.infer<typeof SuggestionPublicationReseauxSociauxOutputSchema>;


const suggerePublicationReseauxSociauxFlow = ai.defineFlow(
  {
    name: 'suggerePublicationReseauxSociauxFlow',
    inputSchema: SuggestionPublicationReseauxSociauxInputSchema,
    outputSchema: SuggestionPublicationReseauxSociauxOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
        prompt: `Tu es un expert en marketing digital et réseaux sociaux. Tu dois suggérer des publications engageantes pour une escorte. Le thème de la publication est ${input.theme}, le réseau social cible est ${input.reseauSocial}, et le style de la publication est ${input.style}. Génère ${input.nombreSuggestions} suggestions de publications. Rédige les suggestions en français.`,
        model: 'googleai/gemini-1.5-flash',
        output: {
          schema: SuggestionPublicationReseauxSociauxOutputSchema,
        }
      });
      return llmResponse.output ?? { suggestions: [] };
  }
);

export async function suggerePublicationReseauxSociaux(
    input: SuggestionPublicationReseauxSociauxInput
  ): Promise<SuggestionPublicationReseauxSociauxOutput> {
    return suggerePublicationReseauxSociauxFlow(input);
  }
  