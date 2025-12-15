import ai from "../index.ts";
import {z} from "genkit";
import {searchDestinationsTool} from "../tools/index.ts";

const inputSchema = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(10).optional(),
});
const schema = z.array(
  z.object({
    name: z.string(),
    travel_relevance: z.string(),
    summary: z.string(),
    url: z.string().optional(),
    country: z.string().optional(),
  })
)
const outputSchema = z.object({
  query: z.string(),
  destinations: schema,
});
export const searchDestinationsFlow = ai.defineFlow(
  {name: "searchDestinationsFlow", inputSchema, outputSchema,},
  async ({query, limit = 5}) => {
    // 1. Call our tool
    const raw = await searchDestinationsTool({query, limit});
    const system = 'You are a travel intelligence assistant'
    // 2. Ask the LLM to clean, filter & summarize
    const prompt = `
            Given these raw search results (from Wikipedia), filter out anything that is **not a travel destination**, 
            rank the remaining items by travel relevance,
            and produce a clean summary for each.            
            Raw results:
            ${JSON.stringify(raw.results, null, 2)}
          `;
    const response = await ai.generate({system,prompt, output: {schema}});
    console.log("#".repeat(50), "\nRaw LLM response:\n", response.text, "\n", "#".repeat(50));
    const parsed = JSON.parse(response.text);

    return {
      query,
      destinations: parsed,
    };
  }
);
