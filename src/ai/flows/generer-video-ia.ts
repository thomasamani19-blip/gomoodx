'use server';
/**
 * @fileOverview Flow Genkit pour générer des vidéos à l'aide de l'IA (Veo).
 *
 * - genererVideoIA - Une fonction qui gère le processus de génération de vidéo.
 * - GenererVideoIAInput - Le type d'entrée pour la fonction.
 * - GenererVideoIAOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { googleAI } from '@genkit-ai/google-genai';
import { media as genkitMedia } from 'genkit/ai';
import type { MediaPart } from 'genkit';


export const GenererVideoIAInputSchema = z.object({
  prompt: z.string().describe('Une description détaillée de la vidéo à générer.'),
  dureeSecondes: z.number().optional().default(5).describe('Durée de la vidéo en secondes (entre 5 et 8).'),
  format: z.enum(['16:9', '9:16']).optional().default('16:9').describe('Format de la vidéo.'),
  base64Media: z.array(z.string()).optional().describe("Une liste de médias (images ou vidéo) encodés en Base64 data URI à utiliser comme référence."),
});
export type GenererVideoIAInput = z.infer<typeof GenererVideoIAInputSchema>;

export const GenererVideoIAOutputSchema = z.object({
  videoUrl: z.string().describe("L'URL de la vidéo générée, encodée en Base64 data URI."),
});
export type GenererVideoIAOutput = z.infer<typeof GenererVideoIAOutputSchema>;

// Fonction pour convertir un flux de données en Base64
async function streamToBase64(stream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    });
}

const genererVideoIAFlow = ai.defineFlow(
  {
    name: 'genererVideoIAFlow',
    inputSchema: GenererVideoIAInputSchema,
    outputSchema: GenererVideoIAOutputSchema,
    // Augmenter le timeout pour la génération de vidéo
    config: {
        timeout: 120, 
    }
  },
  async (input) => {

    const promptParts: (string | {text: string} | MediaPart)[] = [
        { text: input.prompt }
    ];
    
    if (input.base64Media && input.base64Media.length > 0) {
      input.base64Media.forEach(mediaBase64 => {
        // Le `genkitMedia` helper déduit le contentType de l'URL data, pas besoin de le parser manuellement
        promptParts.push(genkitMedia({ url: mediaBase64 }));
      });
    }

    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: promptParts as any,
        config: {
          durationSeconds: Math.max(5, Math.min(input.dureeSecondes || 5, 8)), // S'assurer que la durée est dans les limites
          aspectRatio: input.format,
          personGeneration: 'allow_adult',
        },
    });

    if (!operation) {
        throw new Error('Le modèle n\'a pas retourné d\'opération de longue durée.');
    }

    // Boucle de vérification de l'état de l'opération
    while (!operation.done) {
        // Attendre 5 secondes avant de vérifier à nouveau
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Échec de la génération de la vidéo : ${operation.error.message}`);
    }
    
    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    
    if (!videoPart || !videoPart.media?.url) {
        throw new Error('Aucune vidéo n\'a été trouvée dans le résultat de l\'opération.');
    }
    
    // Récupérer le contenu de la vidéo depuis l'URL signée
    const fetch = (await import('node-fetch')).default;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("La clé d'API GEMINI_API_KEY est manquante.");
    }
    
    const videoResponse = await fetch(`${videoPart.media.url}&key=${apiKey}`);

    if (!videoResponse.ok || !videoResponse.body) {
        throw new Error(`Échec du téléchargement de la vidéo: ${videoResponse.statusText}`);
    }

    // Le contentType n'est pas toujours présent dans la réponse, on force video/mp4
    const videoBase64 = await streamToBase64(videoResponse.body);
    const videoDataUrl = `data:video/mp4;base64,${videoBase64}`;

    return { videoUrl: videoDataUrl };
  }
);


export async function genererVideoIA(
  input: GenererVideoIAInput
): Promise<GenererVideoIAOutput> {
  return genererVideoIAFlow(input);
}
