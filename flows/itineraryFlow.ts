// flows/itineraryFlow.ts
import ai from "../index.ts";
import {z} from "genkit";

import {fetchAttractionsTool, fetchWeatherTool} from "../tools/index.ts";

const PreferencesSchema = z.object({
  likesHistory: z.boolean().optional(),
  likesNature: z.boolean().optional(),
  likesFood: z.boolean().optional(),
  likesNightlife: z.boolean().optional(),
  budget: z.enum(["low", "medium", "high"]).optional()
});

const DayPlanSchema = z.object({
  day: z.number(),
  title: z.string(),
  plan: z.array(z.string()),
  weatherNotes: z.string()
});

export const itineraryFlow = ai.defineFlow(
  {
    name: "itineraryFlow",
    inputSchema: z.object({
      destination: z.string().min(2),
      days: z.number().int().min(1).max(7),
      preferences: PreferencesSchema.optional()
    }),
    outputSchema: z.object({
      destination: z.string(),
      days: z.number(),
      itinerary: z.array(DayPlanSchema)
    }),
  },

  async ({destination, days, preferences}) => {
    // ------------------------------------------------------
    // 1. Fetch attractions
    // ------------------------------------------------------
    const attractions = await fetchAttractionsTool({destination, limit: 25});

    // ------------------------------------------------------
    // 2. Fetch weather
    // ------------------------------------------------------
    const weather = await fetchWeatherTool({destination});

    // Prepare weather context (first N days)
    const weatherSlice = weather.forecast.slice(0, days);

    // ------------------------------------------------------
    // 3. LLM itinerary planning
    // ------------------------------------------------------
    const prompt = `
You are an expert travel planner.

Destination: ${destination}
Trip Length: ${days} day(s)
User Preferences: ${JSON.stringify(preferences, null, 2)}

Attractions:
${JSON.stringify(attractions.attractions, null, 2)}

Weather forecast for trip dates:
${JSON.stringify(weatherSlice, null, 2)}

Create a structured ${days}-day itinerary:
- Each day has a title
- 3–6 activities ordered logically
- Activities should reflect user preferences
- Weather should influence outdoor vs indoor choices
- Suggest food-related stops if user likes food
- Avoid markdown
Return JSON only.
    `;

    const response = await ai.generate({
      prompt,
      output: {
        schema: z.array(DayPlanSchema)
      }
    });

    return {
      destination,
      days,
      itinerary: response.output
    };
  }
);
