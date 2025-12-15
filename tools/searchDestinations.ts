// tools/searchDestinations.ts
import ai from "../index.ts";
import {z} from "genkit";
import axios from "axios";

const DestinationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  country: z.string().optional(),
  url: z.string().url().optional(),
});

const inputSchema = z.object({
  query: z.string().min(2, "Query must be at least 2 characters long"),
  limit: z.number().int().min(1).max(10).optional(),
  language: z
    .string()
    .regex(/^[a-z-]+$/i)
    .optional(), // e.g. "en", "fr", "de"
});
let outputSchema = z.object({query: z.string(), results: z.array(DestinationSchema),});
const headers = {"User-Agent": "ai-travel-assistant/1.0 (https://example.com)", "Accept": "application/json",};

export const searchDestinationsTool = ai.defineTool(
  {name: "searchDestinations", inputSchema, outputSchema, description: "Search for travel destinations using Wikipedia."},
  async ({query, limit = 5, language = "en"}) => {
    try {
      // 1) Search for pages matching the destination query
      const searchUrl = `https://${language}.wikipedia.org/w/rest.php/v1/search/title`;
      const searchResponse = await axios.get(searchUrl, {params: {q: query, limit,}, headers});
      const pages: any[] = searchResponse.data?.pages ?? [];
      // 2) For each result, fetch a summary (description + URL)
      const results = await Promise.all(
        pages.map(async (page) => {
          const title: string = page.title;

          let description: string | undefined;
          let url: string | undefined;
          let country: string | undefined;

          try {
            const summaryUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              title
            )}`;
            const summaryResponse = await axios.get(summaryUrl);
            const summary = summaryResponse.data;

            description = summary.extract;
            url =
              summary.content_urls?.desktop?.page ??
              summary.content_urls?.mobile?.page;

            // Very naive heuristic: try to infer a "country-like" token from description
            const text = (description ?? "").toLowerCase();
            const match = text.match(
              /\b(in|of)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/
            );
            if (match) {
              // Capitalize first letter just in case
              const raw = match[2] || '';
              country = raw.charAt(0).toUpperCase() + raw.slice(1);
            }
          } catch {
            // If summary fails, we still return at least the title
          }

          return {
            name: title,
            description,
            country,
            url,
          };
        })
      );

      return {query, results};
    } catch (err: any) {
      // Surface a cleaner error to the LLM / Dev UI
      throw new Error(
        `Failed to search destinations for "${query}": ${
          err?.message ?? String(err)
        }`
      );
    }
  }
);
