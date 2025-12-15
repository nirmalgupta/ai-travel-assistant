import 'dotenv/config'
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/googleai";
import {ollama} from 'genkitx-ollama';
import { openAI } from '@genkit-ai/compat-oai/openai';


// const ai = genkit({
//   plugins: [googleAI()],
//   model: googleAI.model("gemini-2.0-flash", {temperature: 0.8}),
// });
//
//
const ai = genkit({
  plugins: [ollama({serverAddress: 'http://localhost:11434'}),],
  model: ollama.model("gemma3", {temperature: 0.2,}),
})

// export const ai = genkit({
//   plugins: [openAI()],
//   model: openAI.model('gpt-4o')
// });

export default ai
