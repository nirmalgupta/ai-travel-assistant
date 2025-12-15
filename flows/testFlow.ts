import ai from "../index.ts";
import {z} from "genkit";
// import {googleAI} from "@genkit-ai/googleai";

export const testFlow = ai.defineFlow(
  {
    name: "testFlow",
    inputSchema: z.object({query: z.string()}),
    outputSchema: z.string().describe('The answer to the travel-related question'),
  },
  async ({query}) => {
    const {text} = await ai.generate({prompt: `You are a travel assistant. Answer concisely: ${query}`,});
    return text
  }
);
