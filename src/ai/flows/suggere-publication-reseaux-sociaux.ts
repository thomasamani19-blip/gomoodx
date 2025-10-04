// TODO: Implement the Genkit flow for the SuggerePublicationReseauxSociaux story.
'use server';

/**
 * @fileOverview Ce fichier contient un flow Genkit pour suggérer des publications engageantes pour les réseaux sociaux.
 *
 * - suggerePublicationReseauxSociaux - Une fonction qui gère le processus de suggestion de publication.
 * - SuggestionPublicationReseauxSociauxInput - Le type d'entrée pour la fonction suggerePublicationReseauxSociaux.
 * - SuggestionPublicationReseauxSociauxOutput - Le type de retour pour la fonction suggerePublicationReseauxSociaux.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestionPublicationReseauxSociauxInputSchema = z.object({
  theme: z.string().describe("Le thème de la publication, par exemple 'conseils de beauté', 'astuces de voyage', 'citations inspirantes'."),
  reseauSocial: z.string().describe("Le réseau social cible, par exemple 'Instagram', 'Twitter', 'Facebook'."),
  style: z.string().describe("Le style de la publication, par exemple 'humoristique', 'informatif', 'provocateur'."),
  nombreSuggestions: z.number().describe("Le nombre de suggestions de publications à générer.").default(3),
});
export type SuggestionPublicationReseauxSociauxInput = z.infer<typeof SuggestionPublicationReseauxSociauxInputSchema>;

const SuggestionPublicationReseauxSociauxOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("Une liste de suggestions de publications pour les réseaux sociaux."),
});
export type SuggestionPublicationReseauxSociauxOutput = z.infer<typeof SuggestionPublicationReseauxSociauxOutputSchema>;

export async function suggerePublicationReseauxSociaux(input: SuggestionPublicationReseauxSociauxInput): Promise<SuggestionPublicationReseauxSociauxOutput> {
  return suggerePublicationReseauxSociauxFlow(input);
}

const suggestionPublicationPrompt = ai.definePrompt({
  name: 'suggestionPublicationPrompt',
  input: {schema: SuggestionPublicationReseauxSociauxInputSchema},
  output: {schema: SuggestionPublicationReseauxSociauxOutputSchema},
  prompt: `Tu es un expert en marketing digital et réseaux sociaux. Tu dois suggérer des publications engageantes pour une escorte. Le thème de la publication est {{{theme}}}, le réseau social cible est {{{reseauSocial}}}, et le style de la publication est {{{style}}}. Génère {{{nombreSuggestions}}} suggestions de publications. Rédige les suggestions en français.

Voici les suggestions:
`,
});

const suggerePublicationReseauxSociauxFlow = ai.defineFlow(
  {
    name: 'suggerePublicationReseauxSociauxFlow',
    inputSchema: SuggestionPublicationReseauxSociauxInputSchema,
    outputSchema: SuggestionPublicationReseauxSociauxOutputSchema,
  },
  async input => {
    const {output} = await suggestionPublicationPrompt(input);
    return output!;
  }
);
