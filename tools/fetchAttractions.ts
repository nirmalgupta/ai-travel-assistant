// tools/fetchAttractions.ts
import ai from "../index.ts";
import {z} from "genkit";
import axios from "axios";

// Schema for structured attractions
export const Attractions = z.array(z.object({
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  // e.g., "see", "do", "eat"
}));

// Tool definition
const inputSchema = z.object({
  destination: z.string().min(2),
  limit: z.number().int().min(3).max(40).optional(),
});
const outputSchema = z.object({ destination: z.string(), attractions: Attractions,});
export const fetchAttractionsTool = ai.defineTool(
  {
    description: "fetch attractions for a location",
    name: "fetchAttractions",
    inputSchema,
    outputSchema
  },
  async ({destination, limit = 10}) => {
    const url = "https://en.wikivoyage.org/w/api.php";
    // Required User-Agent header — without this, API returns 403
    const headers = {"User-Agent": "ai-travel-assistant/1.0 (https://example.com)",};
    const response = await axios.get(url, {
      headers,
      params: {
        action: "query",
        prop: "extracts",
        format: "json",
        titles: destination,
        explaintext: 1,
        redirects: 1,
      },
    });

    const pages = response.data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as any;

    if (!page?.extract) {
      return {destination, attractions: []};
    }

    const rawText = page.extract;

    // Ask LLM to convert raw extract text into structured attractions list
    const system = `You are a travel domain expert.Given Wikivoyage text, extract a list of attractions.For each attraction: name, description, category (see/do/eat/stay).Return only JSON, no markdown.`;
    const prompt = `Destination: ${destination} Raw Wikivoyage Text: ${rawText} Convert into JSON array of attractions (max ${limit}).`;
    const structured = await ai.generate({system, prompt, output: {schema: Attractions},});

    return {
      destination,
      attractions: structured.output?.slice(0, limit),
    };
  }
);
