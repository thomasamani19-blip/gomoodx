
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generer-bio-escorte';
import '@/ai/flows/idees-contenu-visuel';
import '@/ai/flows/recherche-multilingue';
import '@/ai/flows/suggere-publication-reseaux-sociaux';
import '@/ai/flows/generer-image-ia';
import '@/ai/flows/generer-audio-tts';
import '@/ai/flows/generer-video-ia';
import '@/ai/flows/generer-article-blog';
import '@/ai/flows/generer-scenario-video';
import '@/ai/flows/generer-resume-admin';
import '@/ai/flows/moderer-contenu';

