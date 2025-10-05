/**
 * @fileoverview Genkit AI wrapper.
 * This file initializes and configures the Genkit instance for the application.
 */
'use server';

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { genkit };

// Import flows to register them with Genkit
// import '@/app/api/ai/flows/generateBio';
// import '@/app/api/ai/flows/generateImage';
// import '@/app/api/ai/flows/generateTTS';
