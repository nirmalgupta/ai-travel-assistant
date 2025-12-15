// tools/recommendationEngine.ts
import ai from "../index.ts";
import {z} from "genkit";
import {setTimeout} from "node:timers/promises";
import {fetchAttractionsTool, fetchWeatherTool, fetchReviewsTool} from "./index.ts";

const PreferencesSchema = z.object({
  climate: z.enum(["warm", "cold", "mild"]).optional(),
  budget: z.enum(["low", "medium", "high"]).optional(),
  likesHistory: z.boolean().optional(),
  likesNature: z.boolean().optional(),
  likesFood: z.boolean().optional(),
  likesNightlife: z.boolean().optional(),
  tripLength: z.number().optional()
});

const RecommendationSchema = z.object({
  destination: z.string(),
  score: z.number(), // 0–10
  reason: z.string()
});

export const recommendationEngineTool = ai.defineTool(
  {
    name: "recommendDestinations",
    description: "Given a list of candidate destinations and user preferences, score and rank the destinations to provide personalized travel recommendations.",
    inputSchema: z.object({
      candidates: z.array(z.string()).min(1),
      preferences: PreferencesSchema
    }),
    outputSchema: z.object({
      recommendations: z.array(RecommendationSchema)
    })
  },

  async ({candidates, preferences}) => {
    const detailedData = [];

    // --------------------------------------------
    // 1. Gather data for each candidate destination
    // --------------------------------------------
    for (const dest of candidates) {
      const attractions = await fetchAttractionsTool({destination: dest})
      const weather = await fetchWeatherTool({destination: dest})
      const reviews = await fetchReviewsTool({destination: dest})

      detailedData.push({destination: dest, attractions: attractions.attractions, weather, reviews});
    }

    // --------------------------------------------
    // 2. LLM: Score + rank recommendations
    // --------------------------------------------
    const prompt = `
You are a travel recommendation engine.

User preferences:
${JSON.stringify(preferences, null, 2)}

Destination data:
${JSON.stringify(detailedData, null, 2)}

Task:
For each destination:
- Give a score from 0.0 to 10.0
- Provide a one-sentence reason why it does or does not match the user's preferences
- Base scoring on weather, attractions, reviews, and preference matching

Return JSON only.
    `;

    const llm = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          recommendations: z.array(RecommendationSchema)
        })
      }
    });

    return llm.output;
  }
);
