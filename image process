// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Image query processing AI agent.
 *
 * - processImageQuery - A function that handles the image query processing.
 * - ProcessImageQueryInput - The input type for the processImageQuery function.
 * - ProcessImageQueryOutput - The return type for the processImageQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessImageQueryInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  query: z.string().describe('The query related to the image.'),
});
export type ProcessImageQueryInput = z.infer<typeof ProcessImageQueryInputSchema>;

const ProcessImageQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the query based on the image.'),
});
export type ProcessImageQueryOutput = z.infer<typeof ProcessImageQueryOutputSchema>;

export async function processImageQuery(input: ProcessImageQueryInput): Promise<ProcessImageQueryOutput> {
  return processImageQueryFlow(input);
}

const processImageQueryPrompt = ai.definePrompt({
  name: 'processImageQueryPrompt',
  input: {schema: ProcessImageQueryInputSchema},
  output: {schema: ProcessImageQueryOutputSchema},
  prompt: `You are an AI assistant specialized in processing image queries.

  Based on the image and the query, provide a contextually relevant answer.

  Image: {{media url=imageDataUri}}
  Query: {{{query}}}
  Answer: `,
});

const processImageQueryFlow = ai.defineFlow(
  {
    name: 'processImageQueryFlow',
    inputSchema: ProcessImageQueryInputSchema,
    outputSchema: ProcessImageQueryOutputSchema,
  },
  async input => {
    const {output} = await processImageQueryPrompt(input);
    return output!;
  }
);
