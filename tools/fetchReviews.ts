// tools/fetchReviews.ts
import ai from "../index.ts";
import {z} from "genkit";
import axios from "axios";

// Schema for review output
export const ReviewsSchema = z.object({
  destination: z.string(),
  highlights: z.array(z.string()),
  criticisms: z.array(z.string()),
  rating: z.number(),  // pseudo-rating based on sentiment 1–5
});

export const fetchReviewsTool = ai.defineTool(
  {
    name: "fetchReviews",
    inputSchema: z.object({destination: z.string().min(2),}),
    outputSchema: ReviewsSchema,
    description: "Fetches travel reviews and sentiment data for a given destination",
  },
  async ({destination}) => {

    // --------------------------------------------
    // 1. Fetch Wikivoyage extract for sentiment data
    // --------------------------------------------
    const url = "https://en.wikivoyage.org/w/api.php";

    const response = await axios.get(url, {
      headers: {"User-Agent": "ai-travel-assistant/1.0"},
      params: {
        action: "query",
        prop: "extracts",
        explaintext: 1,
        titles: destination,
        redirects: 1,
        format: "json",
      },
    });

    const pages = response.data?.query?.pages ?? {};
    const page = Object.values(pages)[0] as any;

    const rawText = page?.extract ?? "";

    // --------------------------------------------
    // 2. LLM: Convert extract into structured reviews
    // --------------------------------------------
    const system = `You are an expert travel reviewer.
        Extract from provided travel text:
        1. 5-7 key positive highlights (what travelers love)
        2. 3-5 key criticisms or drawbacks
        3. A synthesized rating from 1.0 to 5.0 (based on sentiment)
        Return JSON only (no markdown or commentary).`;

    const prompt = `Destination: ${destination}
      Raw travel text:
      ${rawText}`;
    const llm = await ai.generate({system, prompt, output: {schema: ReviewsSchema,},});
    return llm.output;
  }
);
