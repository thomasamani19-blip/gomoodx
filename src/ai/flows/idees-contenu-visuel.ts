'use server';

/**
 * @fileOverview Flow pour générer des idées de contenu visuel pour les escortes.
 *
 * - ideesContenuVisuel - Une fonction qui génère des suggestions d'IA pour des idées de contenu visuel (images, vidéos).
 * - IdeesContenuVisuelInput - Le type d'entrée pour la fonction ideesContenuVisuel.
 * - IdeesContenuVisuelOutput - Le type de retour pour la fonction ideesContenuVisuel.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

export const IdeesContenuVisuelInputSchema = z.object({
  theme: z.string().describe("Le thème général du contenu recherché (par exemple, 'voyage', 'mode', 'fitness', 'sexy')."),
  tendances: z.string().describe("Les tendances actuelles sur les réseaux sociaux et plateformes de contenu.").optional(),
  typeDeContenu: z.enum(["image", "video", "les deux"]).describe("Le type de contenu visuel souhaité (image, vidéo, ou les deux).").optional(),
  style: z.string().describe("Le style souhaité pour le contenu (par exemple, 'artistique', 'humoristique', 'provocateur', 'éducatif').").optional(),
  objectifs: z.string().describe("Les objectifs du contenu (par exemple, 'attirer de nouveaux abonnés', 'fidéliser les abonnés existants', 'promouvoir un produit', 'améliorer l'engagement').").optional(),
  publicCible: z.string().describe("Décrivez le public cible de cette escorte").optional(),
});
export type IdeesContenuVisuelInput = z.infer<typeof IdeesContenuVisuelInputSchema>;

export const IdeesContenuVisuelOutputSchema = z.object({
  idees: z.array(z.string()).describe("Une liste d'idées de contenu visuel (images et vidéos) originales et tendances, adaptées au thème, aux tendances, au style et aux objectifs spécifiés."),
});
export type IdeesContenuVisuelOutput = z.infer<typeof IdeesContenuVisuelOutputSchema>;


const ideesContenuVisuelFlow = ai.defineFlow(
  {
    name: 'ideesContenuVisuelFlow',
    inputSchema: IdeesContenuVisuelInputSchema,
    outputSchema: IdeesContenuVisuelOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
        prompt: `Tu es un expert en création de contenu visuel tendance pour les escortes. Ton rôle est de proposer des idées originales et engageantes qui correspondent à leur style et à leurs objectifs.

        Génère une liste d'idées de contenu visuel (images et vidéos) originales et tendances, en tenant compte des informations suivantes :
      
        - Thème: ${input.theme}
        - Tendances actuelles: ${input.tendances}
        - Type de contenu: ${input.typeDeContenu}
        - Style: ${input.style}
        - Objectifs: ${input.objectifs}
        - Public cible: ${input.publicCible}
      
        Assure-toi que les idées proposées sont adaptées au public cible de l'escorte et qu'elles sont réalisables avec des moyens simples et efficaces.  Les idées doivent être en français.`,
        model: 'googleai/gemini-1.5-flash',
        output: {
          schema: IdeesContenuVisuelOutputSchema,
        }
      });
      return llmResponse.output ?? { idees: [] };
  }
);

export async function ideesContenuVisuel(
    input: IdeesContenuVisuelInput
  ): Promise<IdeesContenuVisuelOutput> {
    return ideesContenuVisuelFlow(input);
  }
  