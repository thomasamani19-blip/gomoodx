
'use server';

/**
 * @fileOverview Un flow Genkit pour générer des articles de blog complets.
 *
 * - genererArticleBlog - Une fonction qui gère le processus de génération d'article.
 * - GenererArticleBlogInput - Le type d'entrée pour la fonction.
 * - GenererArticleBlogOutput - Le type de retour pour la fonction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenererArticleBlogInputSchema = z.object({
  sujet: z.string().describe("Le sujet principal de l'article de blog."),
  motsCles: z.string().describe("Quelques mots-clés à inclure, séparés par des virgules.").optional(),
  ton: z.string().describe("Le ton de l'article (ex: informatif, humoristique, séducteur, professionnel).").optional().default('informatif'),
});
export type GenererArticleBlogInput = z.infer<typeof GenererArticleBlogInputSchema>;

export const GenererArticleBlogOutputSchema = z.object({
  titre: z.string().describe("Un titre accrocheur pour l'article."),
  contenu: z.string().describe("Le contenu complet de l'article, formaté en Markdown."),
});
export type GenererArticleBlogOutput = z.infer<typeof GenererArticleBlogOutputSchema>;


const genererArticleBlogFlow = ai.defineFlow(
  {
    name: 'genererArticleBlogFlow',
    inputSchema: GenererArticleBlogInputSchema,
    outputSchema: GenererArticleBlogOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      prompt: `Tu es un rédacteur de blog expert pour une plateforme de contenu pour adultes appelée GoMoodX. Ton objectif est de rédiger un article de blog engageant, bien structuré et optimisé pour le référencement.

      Rédige un article de blog complet sur le sujet suivant : "${input.sujet}".

      Instructions :
      1.  Crée un titre accrocheur.
      2.  Rédige une introduction captivante qui présente le sujet.
      3.  Développe le corps de l'article en plusieurs paragraphes clairs et informatifs. Utilise des sous-titres si nécessaire (format Markdown: ## Sous-titre).
      4.  Intègre naturellement les mots-clés suivants si fournis : ${input.motsCles}.
      5.  Adopte un ton ${input.ton}.
      6.  Termine par une conclusion qui résume les points clés et ouvre la discussion.
      7.  Le contenu doit être en français.
      `,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: GenererArticleBlogOutputSchema,
      }
    });

    return llmResponse.output ?? { titre: "", contenu: "" };
  }
);

export async function genererArticleBlog(
  input: GenererArticleBlogInput
): Promise<GenererArticleBlogOutput> {
  return genererArticleBlogFlow(input);
}
