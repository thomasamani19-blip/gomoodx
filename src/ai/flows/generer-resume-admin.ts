'use server';

/**
 * @fileOverview Un flow Genkit pour générer un résumé quotidien de l'activité de la plateforme pour les administrateurs.
 *
 * - genererResumeAdmin - Une fonction qui génère le résumé.
 * - GenererResumeAdminInput - Le type d'entrée pour la fonction.
 * - GenererResumeAdminOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { format } from 'date-fns';

const DonneesPlateformeSchema = z.object({
  date: z.string().describe("La date du jour."),
  nouveauxUtilisateurs: z.number().describe("Le nombre de nouveaux utilisateurs inscrits."),
  nouvellesDemandesPartenaire: z.number().describe("Le nombre de nouvelles demandes de partenariat."),
  revenusJour: z.number().describe("Les revenus totaux générés ce jour-là."),
  contenuPopulaire: z.string().describe("Le titre du contenu le plus populaire du jour."),
});

export const GenererResumeAdminInputSchema = z.object({}).optional(); // Pas d'input nécessaire
export type GenererResumeAdminInput = z.infer<typeof GenererResumeAdminInputSchema>;

export const GenererResumeAdminOutputSchema = z.object({
  resume: z.string().describe("Un résumé textuel de l'activité de la plateforme pour la journée."),
});
export type GenererResumeAdminOutput = z.infer<typeof GenererResumeAdminOutputSchema>;

// Outil qui simule la récupération des données de la plateforme
const getDonneesPlateforme = ai.defineTool(
    {
        name: 'getDonneesPlateforme',
        description: "Récupère les statistiques clés de la plateforme pour la journée en cours.",
        inputSchema: z.object({}),
        outputSchema: DonneesPlateformeSchema,
    },
    async () => {
        // Dans une vraie application, vous interrogeriez votre base de données (Firestore) ici.
        // Pour le prototypage, nous simulons les données.
        return {
            date: format(new Date(), 'd MMMM yyyy'),
            nouveauxUtilisateurs: Math.floor(Math.random() * 50) + 10, // 10-59
            nouvellesDemandesPartenaire: Math.floor(Math.random() * 5), // 0-4
            revenusJour: Math.floor(Math.random() * 1500) + 200, // 200-1699
            contenuPopulaire: "Dîner Privé aux Chandelles", // Placeholder
        };
    }
);

const genererResumeAdminFlow = ai.defineFlow(
  {
    name: 'genererResumeAdminFlow',
    inputSchema: GenererResumeAdminInputSchema,
    outputSchema: GenererResumeAdminOutputSchema,
  },
  async () => {
    const llmResponse = await ai.generate({
        prompt: `Tu es un analyste de données pour GoMoodX. Analyse les données du jour fournies par l'outil et rédige un résumé concis et pertinent pour l'administrateur. Mets en évidence les points importants (positifs ou négatifs). Sois bref, va droit au but. Le résumé doit être en français.`,
        model: 'googleai/gemini-1.5-flash',
        tools: [getDonneesPlateforme],
        output: {
            schema: z.object({
                resume: z.string()
            }),
        }
    });

    return llmResponse.output ?? { resume: "Impossible de générer le résumé." };
  }
);

export async function genererResumeAdmin(
  input?: GenererResumeAdminInput
): Promise<GenererResumeAdminOutput> {
  return genererResumeAdminFlow(input);
}
