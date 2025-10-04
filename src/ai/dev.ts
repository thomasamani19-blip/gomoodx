'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/idees-contenu-visuel.ts';
import '@/ai/flows/recherche-multilingue.ts';
import '@/ai/flows/suggere-publication-reseaux-sociaux.ts';
import '@/ai/flows/generer-bio-escorte.ts';
import '@/ai/flows/generer-image-ia.ts';
import '@/ai/flows/generer-audio-tts.ts';
import '@/ai/flows/generer-video-ia.ts';
