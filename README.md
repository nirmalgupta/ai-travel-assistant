# AI Travel Assistant

An AI-powered travel assistant built with Firebase Genkit that helps users plan trips, search destinations, create itineraries, and get travel recommendations.

## Features

- **Search Destinations**: Find travel destinations based on preferences
- **Destination Overview**: Get detailed information about destinations
- **Itinerary Planning**: Create personalized travel itineraries
- **Weather Information**: Fetch current weather data for destinations
- **Attractions & Reviews**: Access attraction details and user reviews
- **Recommendation Engine**: Get AI-powered travel recommendations

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ollama (if using local models) or API keys for Google AI/OpenAI

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nirmalgupta/ai-travel-assistant.git
cd ai-travel-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Add your API keys here
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Configuration

The project supports multiple AI providers. You can switch between them in `index.ts`:

- **Ollama** (local): Currently active
- **Google AI** (Gemini): Commented out
- **OpenAI** (GPT-4): Commented out

## Usage

Start the development server:
```bash
npm run dev
```

This will start the Genkit development UI where you can test your flows and tools.

## Project Structure

```
ai-travel-assistant/
├── flows/              # Genkit flows for different travel features
│   ├── destinationOverviewFlow.ts
│   ├── itineraryFlow.ts
│   ├── searchDestinationsFlow.ts
│   ├── testFlow.ts
│   └── travelAgentFlow.ts
├── tools/              # Genkit tools for external integrations
│   ├── fetchAttractions.ts
│   ├── fetchReviews.ts
│   ├── fetchWeather.ts
│   ├── recommendationEngine.ts
│   └── searchDestinations.ts
├── index.ts            # Main Genkit configuration
├── genkit.config.ts    # Genkit configuration
└── package.json
```

## Technologies

- [Firebase Genkit](https://firebase.google.com/docs/genkit) - AI framework
- TypeScript
- Ollama / Google AI / OpenAI
- Axios for HTTP requests

## License

ISC

