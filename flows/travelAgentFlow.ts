import ai from "../index.ts";
import {z} from "genkit";

import {
  searchDestinationsTool,
  fetchAttractionsTool,
  fetchWeatherTool,
  recommendationEngineTool
} from "../tools/index.ts";
import {itineraryFlow} from "./itineraryFlow.ts";

// -----------------------------
// Agent planning schema
// -----------------------------
const PlanSchema = z.object({
  action: z.enum([
    "search",
    "attractions",
    "weather",
    "overview",
    "recommend",
    "itinerary",
    "chat"
  ]),
  destination: z.string().optional(),
  days: z.number().optional(),
  preferences: z.any().optional(),
  candidates: z.array(z.string()).optional()
});

// -----------------------------
// Final output
// -----------------------------
const AgentResponseSchema = z.object({
  message: z.string(),
  data: z.any().optional()
});

// -----------------------------
// The Flow
// -----------------------------
export const travelAgentFlow = ai.defineFlow(
  {
    name: "travelAgentFlow",
    inputSchema: z.object({
      message: z.string(),
      conversation: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })).optional()
    }),
    outputSchema: AgentResponseSchema
  },

  async ({message, conversation = []}) => {

    // -----------------------------
    // 1. Agent: Decide what to do
    // -----------------------------
    const system = `
You are an AI travel agent with access to the following tools:

searchDestinations(destination)
fetchAttractions(destination)
fetchWeather(destination)
recommendDestinations(candidates[], preferences)
itineraryFlow(destination, days, preferences)

Your job is to:
- Analyze the user's message
- Decide the best action
- Produce a tool call plan in strict JSON

ACTION RULES:
- User asks “what to do in X” → action: "attractions"
- User asks itinerary → action: "itinerary"
- User asks for weather → action: "weather"
- User asks for recommendations → action: "recommend"
- If unclear → action: "search"
- If general chat → action: "chat"

Return JSON only.
    `;

    const planResponse = await ai.generate({
      system,
      prompt: `

User message:
"${message}"

Return the tool plan as JSON.
      `,
      output: {schema: PlanSchema}
    });

    const plan = planResponse.output;

    // -----------------------------
    // 2. Execute the planned action
    // -----------------------------
    let result;

    switch (plan?.action) {
      case "search":
        result = await searchDestinationsTool({query: plan.destination || message});
        break;

      case "attractions":
        result = await fetchAttractionsTool({destination: plan.destination || message});
        break;

      case "weather":
        result = await fetchWeatherTool({destination: plan.destination || message});
        break;

      case "recommend":
        result = await recommendationEngineTool({
          candidates: plan.candidates || [],
          preferences: plan.preferences || {}
        });
        break;

      case "itinerary":
        result = await itineraryFlow({
          destination: plan.destination || message,
          days: plan.days || 3,
          preferences: plan.preferences || {}
        });
        break;

      case "chat":
      default:
        return {
          message: "Sure — how can I help with your travel plans?",
        };
    }

    // -----------------------------
    // 3. Summarize result naturally
    // -----------------------------
    const summarizer = await ai.generate({
      prompt: `
User asked: "${message}"

Here are the tool results:
${JSON.stringify(result, null, 2)}

Write a helpful, concise reply.
Avoid markdown.
      `
    });

    return {
      message: summarizer.text,
      data: result
    };
  }
);
