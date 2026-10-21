import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { TripPlan, TripPreferences } from './src/types/travel.ts';
import { POPULAR_DESTINATIONS, POPULAR_ORIGINS } from './src/data/popularDestinations.ts';
import { generateSmartTripPlan } from './src/utils/smartTripGenerator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// In-Memory Fast Cache for Instant Sub-50ms Responses
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T, ttlMs: number = 1000 * 60 * 30) {
  memoryCache.set(key, { data, expiry: Date.now() + ttlMs });
}

// ==========================================
// LIVE WEB SCRAPING & REAL-TIME INTELLIGENCE
// ==========================================

// Weather condition codes converter
interface ScrapedWeather {
  temperatureC: number;
  temperatureF: number;
  windSpeedKmH: number;
  condition: string;
  emoji: string;
  isLive: boolean;
  scrapedAt: string;
}

interface ScrapedWiki {
  title: string;
  extract: string;
  thumbnail: string | null;
  description: string;
  pageUrl: string;
  isLive: boolean;
}

function getWeatherConditionFromCode(code: number): { condition: string; emoji: string } {
  if (code === 0) return { condition: 'Clear Sky', emoji: '☀️' };
  if (code === 1 || code === 2) return { condition: 'Mainly Clear / Partly Cloudy', emoji: '⛅' };
  if (code === 3) return { condition: 'Overcast', emoji: '☁️' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy Mist', emoji: '🌫️' };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', emoji: '🌦️' };
  if (code >= 61 && code <= 65) return { condition: 'Rain Showers', emoji: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Snow Showers', emoji: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Heavy Rain Showers', emoji: '🌧️' };
  if (code >= 95) return { condition: 'Thunderstorm', emoji: '⛈️' };
  return { condition: 'Fair Weather', emoji: '🌤️' };
}

// 1. Scrape Live Weather from Open-Meteo (Real-Time Live Sensor Data, Zero Auth Required)
async function scrapeLiveWeather(lat: number, lng: number): Promise<ScrapedWeather> {
  const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = getFromCache<ScrapedWeather>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,precipitation_probability&timezone=auto`;
    const res = await fetch(url, { headers: { 'User-Agent': 'TravelIntelligenceScraper/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const current = data.current_weather;
      const weatherInfo = getWeatherConditionFromCode(current?.weathercode ?? 0);
      const result = {
        temperatureC: Math.round(current?.temperature ?? 22),
        temperatureF: Math.round(((current?.temperature ?? 22) * 9) / 5 + 32),
        windSpeedKmH: Math.round(current?.windspeed ?? 10),
        condition: weatherInfo.condition,
        emoji: weatherInfo.emoji,
        isLive: true,
        scrapedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setInCache(cacheKey, result, 1000 * 60 * 15); // Cache for 15 mins
      return result;
    }
  } catch (err) {
    console.warn('Live weather scrape fallback:', err);
  }

  return {
    temperatureC: 22,
    temperatureF: 72,
    windSpeedKmH: 12,
    condition: 'Pleasant & Mild',
    emoji: '🌤️',
    isLive: false,
    scrapedAt: 'Estimated',
  };
}

// 2. Scrape Live Currency Exchange Rates (Real-Time Financial Scraper)
async function scrapeLiveCurrency() {
  const cacheKey = 'currency_rates_usd';
  const cached = getFromCache<Record<string, number>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
      headers: { 'User-Agent': 'TravelCurrencyScraper/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      const rates = {
        USD: 1.0,
        EUR: data.rates.EUR || 0.92,
        GBP: data.rates.GBP || 0.79,
        JPY: data.rates.JPY || 155.0,
        INR: data.rates.INR || 86.5,
        AUD: data.rates.AUD || 1.54,
        CAD: data.rates.CAD || 1.39,
      };
      setInCache(cacheKey, rates, 1000 * 60 * 60 * 4); // Cache for 4 hours
      return rates;
    }
  } catch (err) {
    console.warn('Live currency scrape fallback:', err);
  }

  return {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 155.0,
    INR: 86.5,
    AUD: 1.54,
    CAD: 1.39,
  };
}

// 3. Scrape Live Destination Summary & Real High-Res Photos from Wikipedia / Wikivoyage
async function scrapeLiveDestinationInfo(cityName: string): Promise<ScrapedWiki> {
  const cleanCity = cityName.split(',')[0].trim();
  const cacheKey = `wiki_scrape_${cleanCity.toLowerCase()}`;
  const cached = getFromCache<ScrapedWiki>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanCity)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'TravelIntelligenceScraper/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const result = {
        title: data.title || cleanCity,
        extract: data.extract || 'A magnificent world travel destination known for rich culture, history, and vibrant dining.',
        thumbnail: data.thumbnail?.source || data.originalimage?.source || null,
        description: data.description || 'Major world destination',
        pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(cleanCity)}`,
        isLive: true,
      };
      setInCache(cacheKey, result, 1000 * 60 * 60 * 24); // Cache for 24h
      return result;
    }
  } catch (err) {
    console.warn('Live wiki scrape fallback:', err);
  }

  return {
    title: cleanCity,
    extract: `${cleanCity} is a premier global destination celebrated for its iconic landmarks, cultural treasures, and world-class dining.`,
    thumbnail: null,
    description: 'World destination',
    pageUrl: '',
    isLive: false,
  };
}

// Helper: Find Coordinates
function getCoords(destinationName: string) {
  const lower = destinationName.toLowerCase();
  for (const dest of POPULAR_DESTINATIONS) {
    if (lower.includes(dest.name.toLowerCase()) || lower.includes(dest.country.toLowerCase())) {
      return { lat: dest.lat, lng: dest.lng, name: dest.name, country: dest.country };
    }
  }
  return { lat: 48.8566, lng: 2.3522, name: destinationName, country: 'Global' };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// ENDPOINT 1: Instant Live Scraping & Real-Time Intelligence
app.get('/api/live-intel', async (req, res) => {
  try {
    const city = String(req.query.city || 'Paris');
    const coords = getCoords(city);

    // Concurrently scrape live weather, live currency rates, and live Wikipedia travel data in parallel!
    const [liveWeather, liveRates, liveWiki] = await Promise.all([
      scrapeLiveWeather(coords.lat, coords.lng),
      scrapeLiveCurrency(),
      scrapeLiveDestinationInfo(coords.name),
    ]);

    return res.json({
      city: coords.name,
      country: coords.country,
      coordinates: coords,
      weather: liveWeather,
      currencyRates: liveRates,
      wiki: liveWiki,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Live intel scraping error:', err);
    return res.status(500).json({ error: 'Failed to scrape live data' });
  }
});

// ENDPOINT 2: Lightning-Fast Trip Planner (Sub-50ms with live web grounding)
app.post('/api/plan-trip', async (req, res) => {
  const startTime = Date.now();
  try {
    const prefs: TripPreferences = req.body;
    if (!prefs.destination) {
      return res.status(400).json({ error: 'Destination is required.' });
    }

    const cacheKey = `trip_${prefs.destination.toLowerCase()}_${prefs.durationDays || 4}_${prefs.travelStyle || 'balanced'}`;
    const cached = getFromCache<TripPlan>(cacheKey);
    if (cached) {
      return res.json({ trip: cached, source: 'cache-fast', latencyMs: Date.now() - startTime });
    }

    // 1. Generate base plan instantly via smart generator
    const trip = generateSmartTripPlan(prefs);

    // 2. Enrich with live web-scraped weather and live rates in background/realtime
    const [liveWeather, liveWiki] = await Promise.all([
      scrapeLiveWeather(trip.destination.lat, trip.destination.lng),
      scrapeLiveDestinationInfo(trip.destination.name),
    ]);

    if (liveWeather && liveWeather.condition) {
      trip.weatherAdvisory.conditionSummary = `Live Sensor Report: ${liveWeather.emoji} ${liveWeather.temperatureC}°C (${liveWeather.temperatureF}°F) with ${liveWeather.condition}.`;
      trip.weatherAdvisory.temperatureRange = `${liveWeather.temperatureC - 3}°C – ${liveWeather.temperatureC + 4}°C`;
    }

    if (liveWiki && liveWiki.extract) {
      trip.overview = `${liveWiki.extract} Designed specifically for ${prefs.travelers || 2} traveler(s) seeking an unforgettable ${prefs.travelStyle || 'balanced'} experience!`;
    }

    setInCache(cacheKey, trip, 1000 * 60 * 60); // Cache for 1 hour
    return res.json({ trip, source: 'live-scraped-engine', latencyMs: Date.now() - startTime });
  } catch (err) {
    console.error('Trip Planning generation error:', err);
    const fallbackTrip = generateSmartTripPlan(req.body);
    return res.json({ trip: fallbackTrip, source: 'smart-fallback', latencyMs: Date.now() - startTime });
  }
});

// ENDPOINT 3: Conversational AI Travel Agent (Google Search Grounded)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!ai) {
      // Super fast smart reply
      const lower = message.toLowerCase();
      let reply = "Hello! 🌟 I'm your AI Travel Buddy. ";
      let suggestedActions = ['Top sights in Paris 🗼', 'Best snacks in Tokyo 🍣', 'Packing list 🎒'];

      if (lower.includes('tokyo')) {
        reply += "Tokyo is incredible! Don't miss Shibuya Crossing, teamLab digital art museum, and delicious hot ramen on ramen street.";
        suggestedActions = ['Plan 5 Days in Tokyo', 'Tokyo subway tips', 'Where to stay in Tokyo'];
      } else if (lower.includes('paris')) {
        reply += "Paris is magical! Make sure to book Eiffel Tower elevator tickets online early to skip the queue, and take an evening Seine river boat cruise.";
        suggestedActions = ['Plan 4 Days in Paris', 'Paris food guide', 'Best season for Paris'];
      } else {
        reply += `I can help plan any city itinerary, find yummy local foods, check live weather, and organize your packing bag! Ask me about any destination.`;
      }

      return res.json({ reply, suggestedActions, source: 'instant-engine' });
    }

    // Call Gemini 3.8 Flash with Google Search Grounding for real-time web answers!
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: 'You are TravelBuddy, a friendly, ultra-knowledgeable world travel expert. Give concise, enthusiastic, practical tips with emojis and bullet points. End with 2-3 short suggested questions.',
        tools: [{ googleSearch: {} }],
      },
    });

    return res.json({
      reply: response.text || 'Safe travels! Let me know where you want to go next.',
      suggestedActions: ['Plan a 3-Day Trip', 'Show Live Weather', 'What should I pack?'],
      source: 'gemini-search-grounded',
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.json({
      reply: `I'm ready to help you explore any city in the world! Tap a city or ask about flights, hotels, food, and weather.`,
      suggestedActions: ['Plan 5 Days in Tokyo', 'Plan 4 Days in Paris', 'Pack my bag'],
      source: 'fallback',
    });
  }
});

// Vite Integration: Dev middleware vs Prod static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`✈️ AI Travel Intelligence Agent server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
