// src/ai/flows/process-voice-query.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing voice queries and generating spoken responses using AI.
 *
 * - processVoiceQuery - A function that takes voice data as input and returns a spoken response.
 * - ProcessVoiceQueryInput - The input type for the processVoiceQuery function.
 * - ProcessVoiceQueryOutput - The return type for the processVoiceQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessVoiceQueryInputSchema = z.object({
  voiceDataUri: z
    .string()
    .describe(
      'Voice data as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type ProcessVoiceQueryInput = z.infer<typeof ProcessVoiceQueryInputSchema>;

const ProcessVoiceQueryOutputSchema = z.object({
  spokenResponse: z.string().describe('The AI-generated spoken response in text format.'),
});
export type ProcessVoiceQueryOutput = z.infer<typeof ProcessVoiceQueryOutputSchema>;

export async function processVoiceQuery(input: ProcessVoiceQueryInput): Promise<ProcessVoiceQueryOutput> {
  return processVoiceQueryFlow(input);
}

const processVoiceQueryPrompt = ai.definePrompt({
  name: 'processVoiceQueryPrompt',
  input: {schema: ProcessVoiceQueryInputSchema},
  output: {schema: ProcessVoiceQueryOutputSchema},
  prompt: `You are a helpful AI assistant designed to provide clear and concise answers to student questions.  Please provide a spoken response to the following voice query:

Voice Query: {{media url=voiceDataUri}}`,
});

const processVoiceQueryFlow = ai.defineFlow(
  {
    name: 'processVoiceQueryFlow',
    inputSchema: ProcessVoiceQueryInputSchema,
    outputSchema: ProcessVoiceQueryOutputSchema,
  },
  async input => {
    const {output} = await processVoiceQueryPrompt(input);
    return output!;
  }
);
