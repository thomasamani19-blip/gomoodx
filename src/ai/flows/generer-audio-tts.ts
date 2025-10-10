
'use server';

/**
 * @fileOverview Flow Genkit pour générer de l'audio à partir de texte (Text-to-Speech).
 *
 * - genererAudioTTS - Une fonction qui gère le processus de génération audio.
 * - GenererAudioTTSInput - Le type d'entrée pour la fonction.
 * - GenererAudioTTSOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

export const GenererAudioTTSInputSchema = z.object({
  texte: z.string().describe('Le texte à convertir en audio.'),
  voix: z.string().describe('La voix à utiliser pour la génération.').optional().default('Algenib'),
});
export type GenererAudioTTSInput = z.infer<typeof GenererAudioTTSInputSchema>;

export const GenererAudioTTSOutputSchema = z.object({
  audioUrl: z.string().describe("L'URL de l'audio généré, encodé en Base64 data URI."),
});
export type GenererAudioTTSOutput = z.infer<typeof GenererAudioTTSOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const genererAudioTTSFlow = ai.defineFlow(
  {
    name: 'genererAudioTTSFlow',
    inputSchema: GenererAudioTTSInputSchema,
    outputSchema: GenererAudioTTSOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: input.texte,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voix },
          },
        },
      }
    });
    
    if (!media) {
      throw new Error("La génération audio a échoué.");
    }
    const audioUrl = media.url;

    // Le modèle TTS renvoie des données PCM brutes, nous devons les convertir en WAV pour le navigateur.
    const audioBuffer = Buffer.from(
      audioUrl.substring(audioUrl.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    
    return {
      audioUrl: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


export async function genererAudioTTS(
  input: GenererAudioTTSInput
): Promise<GenererAudioTTSOutput> {
  return genererAudioTTSFlow(input);
}
