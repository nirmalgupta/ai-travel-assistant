// tools/fetchWeather.ts
import ai from "../index.ts";
import {z} from "genkit";
import axios from "axios";

// Output schema
export const WeatherSchema = z.object({
  destination: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    temperature: z.number(),
    windspeed: z.number(),
    weathercode: z.number(),
  }),
  forecast: z.array(
    z.object({
      date: z.string(),          // YYYY-MM-DD
      maxTemp: z.number(),
      minTemp: z.number(),
      weathercode: z.number(),
    })
  ),
});

export const fetchWeatherTool = ai.defineTool(
  {
    name: "fetchWeather",
    inputSchema: z.object({destination: z.string().min(2),}),
    outputSchema: WeatherSchema,
    description: "Fetch current weather and 7-day forecast for a given destination",
  },
  async ({destination}) => {
    // ---------------------------------------
    // 1. Geocode destination → lat/lon
    // ---------------------------------------
    const geo = await axios.get(
      "https://geocoding-api.open-meteo.com/v1/search",
      {params: {name: destination, count: 1},}
    );

    const result = geo.data?.results?.[0];

    if (!result) {
      throw new Error(`No coordinates found for ${destination}`);
    }

    const {latitude, longitude} = result;

    // ---------------------------------------
    // 2. Fetch weather data
    // ---------------------------------------
    const weather = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude,
        longitude,
        current_weather: true,
        daily: ["temperature_2m_max", "temperature_2m_min", "weathercode"],
        timezone: "auto",
      },
    });

    const w = weather.data;

    const current = {
      temperature: w.current_weather.temperature,
      windspeed: w.current_weather.windspeed,
      weathercode: w.current_weather.weathercode,
    };

    const forecast = w.daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: w.daily.temperature_2m_max[i],
      minTemp: w.daily.temperature_2m_min[i],
      weathercode: w.daily.weathercode[i],
    }));

    return {
      destination,
      latitude,
      longitude,
      current,
      forecast,
    };
  }
);
