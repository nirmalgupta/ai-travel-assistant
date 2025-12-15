// flows/destinationOverviewFlow.ts
import ai from "../index.ts";
import {z} from "genkit";

import {searchDestinationsTool, fetchAttractionsTool, fetchWeatherTool} from "../tools/index.ts";

export const destinationOverviewFlow = ai.defineFlow(
  {
    name: "destinationOverviewFlow",
    inputSchema: z.object({
      query: z.string().min(2),
      limit: z.number().int().min(1).max(10).optional(),
    }),
    outputSchema: z.object({
      destination: z.string(),
      summary: z.string(),
      attractions: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          category: z.string().optional(),
        })
      ),
      weather: z.object({
        current: z.object({
          temperature: z.number(),
          windspeed: z.number(),
          weathercode: z.number(),
        }),
        forecastSummary: z.string(),
      }),
    }),
  },

  async ({query, limit = 5}) => {
    // --------------------------------------------
    // 1. Step 1: Search destinations
    // --------------------------------------------
    const search = await searchDestinationsTool({query, limit});
    const top = search.results[0]; // best match

    if (!top?.name) {
      throw new Error(`No travel destination found for query "${query}"`);
    }

    const destination = top.name;

    // --------------------------------------------
    // 2. Step 2: Attractions
    // --------------------------------------------
    const attractionsResult = await fetchAttractionsTool({destination, limit: 10,});

    // --------------------------------------------
    // 3. Step 3: Weather
    // --------------------------------------------
    const weather = await fetchWeatherTool({destination});

    // --------------------------------------------
    // 4. Step 4: LLM summarization (Unified Travel Overview)
    // --------------------------------------------
    const system = "You are an expert travel assistant.";
    const prompt = `
Create a concise travel overview for the destination.

Destination: ${destination}

Attractions:
${JSON.stringify(attractionsResult.attractions, null, 2)}

Weather:
${JSON.stringify(weather.current, null, 2)}

Forecast (raw):
${JSON.stringify(weather.forecast.slice(0, 5), null, 2)}

Your job:
- Write a 3–5 sentence travel summary.
- Summarize the weekly weather into a human-readable forecast (“generally mild…”, “rain expected…”, etc.).
- Do NOT speak in markdown.
Return JSON only.
`;

    const summaryResponse = await ai.generate({
      system,
      prompt,
      output: {
        schema: z.object({
          summary: z.string(),
          forecastSummary: z.string(),
        }),
      },
    });

    const {summary, forecastSummary} = summaryResponse.output;

    // --------------------------------------------
    // Final structured output
    // --------------------------------------------
    return {
      destination,
      summary,
      attractions: attractionsResult.attractions,
      weather: {
        current: weather.current,
        forecastSummary,
      },
    };
  }
);
