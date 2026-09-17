import type { City } from "../types/city";
import type { CityWeather, OpenMeteoResponse } from "../types/weather";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const CHUNK_SIZE = 50;
const CACHE_KEY = "payong.weather.cache.v2";
const MIN_REQUEST_GAP_MS = 8 * 1000;
const MAX_RETRIES = 3;

interface CacheEntry {
  savedAt: number;
  weathers: CityWeather[];
}

class RateLimitedError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Weather API error ${status}`);
    this.status = status;
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!Array.isArray(entry.weathers) || entry.weathers.length === 0) return null;
    return entry;
  } catch {
    return null;
  }
}

export function writeCache(weathers: CityWeather[]): void {
  try {
    const entry: CacheEntry = { savedAt: Date.now(), weathers };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // storage unavailable — ignore
  }
}

function buildUrl(cities: City[]): string {
  const params = new URLSearchParams({
    latitude: cities.map((c) => c.lat.toFixed(4)).join(","),
    longitude: cities.map((c) => c.lon.toFixed(4)).join(","),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
    timezone: "Asia/Manila",
    forecast_days: "10",
  });
  return `${FORECAST_URL}?${params}`;
}

async function fetchChunk(cities: City[]): Promise<CityWeather[]> {
  const url = buildUrl(cities);
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok && res.status !== 429 && res.status < 500) {
        throw new Error(`Weather API error ${res.status}`);
      }
      if (!res.ok) throw new RateLimitedError(res.status);
      const data = (await res.json()) as OpenMeteoResponse[];
      return cities
        .map((city, i) => {
          const entry = data[i];
          if (!entry || !entry.current || !entry.daily) return null;
          return { city, current: entry.current, daily: entry.daily };
        })
        .filter((w): w is CityWeather => w !== null);
    } catch (err) {
      const retryable =
        attempt < MAX_RETRIES && (err instanceof RateLimitedError || err instanceof TypeError);
      if (!retryable) throw err;
      await delay(1000 * 2 ** attempt);
    }
  }
  throw new Error("Weather API error");
}

let lastFetchedAt = 0;
let pending: Promise<CityWeather[]> | null = null;

export function getCachedWeather(): CityWeather[] | null {
  const cached = readCache();
  return cached ? cached.weathers : null;
}

export async function fetchWeatherForCities(cities: City[]): Promise<CityWeather[]> {
  // Serialise network round-trips (plus a small gap) to stay under rate limits.
  while (pending) await pending.catch(() => {});
  const gap = MIN_REQUEST_GAP_MS - (Date.now() - lastFetchedAt);
  if (gap > 0) await delay(gap);

  const groups = chunk(cities, CHUNK_SIZE);
  const run = (async () => {
    const out: CityWeather[] = [];
    for (const group of groups) {
      out.push(...(await fetchChunk(group)));
    }
    return out;
  })();

  pending = run;
  lastFetchedAt = Date.now();
  try {
    return await run;
  } finally {
    pending = null;
  }
}