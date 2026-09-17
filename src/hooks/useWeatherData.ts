import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWeatherForCities, getCachedWeather, writeCache } from "../api/weather";
import type { City } from "../types/city";
import type { CityWeather } from "../types/weather";

function cityKey(city: CityWeather["city"]): string {
  return `${city.name}·${city.province}`;
}

function toMap(weathers: CityWeather[]): Map<string, CityWeather> {
  const map = new Map<string, CityWeather>();
  for (const w of weathers) map.set(cityKey(w.city), w);
  return map;
}

function friendlyError(e: unknown): string {
  const message = e instanceof Error ? e.message : "Failed to load weather data";
  if (message.includes("429")) {
    return "Open-Meteo rate limit reached. Showing saved data — retrying shortly.";
  }
  return message;
}

export function useWeatherData(requestedCities: City[]) {
  const [weatherMap, setWeatherMap] = useState<Map<string, CityWeather>>(() => {
    const cached = getCachedWeather();
    return cached ? toMap(cached) : new Map();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchedRef = useRef<Set<string>>(new Set());
  const loadedCitiesRef = useRef<City[]>([]);

  useEffect(() => {
    loadedCitiesRef.current = Array.from(weatherMap.values()).map((w) => w.city);
  }, [weatherMap]);

  // Seed fetchedRef from the cache so cached cities are never re-fetched.
  useEffect(() => {
    const cached = getCachedWeather();
    if (cached && cached.length > 0) {
      for (const w of cached) fetchedRef.current.add(cityKey(w.city));
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  // Fetch only the requested cities we don't have yet, merging results in.
  useEffect(() => {
    const missing = requestedCities.filter((c) => {
      const key = cityKey(c);
      if (fetchedRef.current.has(key)) return false;
      if (weatherMap.has(key)) {
        fetchedRef.current.add(key);
        return false;
      }
      return true;
    });
    if (missing.length === 0) return;

    let cancelled = false;
    fetchWeatherForCities(missing)
      .then((results) => {
        if (cancelled || results.length === 0) return;
        for (const w of results) fetchedRef.current.add(cityKey(w.city));
        setWeatherMap((prev) => {
          const next = new Map(prev);
          for (const w of results) next.set(cityKey(w.city), w);
          writeCache(Array.from(next.values()));
          return next;
        });
        setLastUpdated(new Date());
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(friendlyError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestedCities, weatherMap]);

  const refresh = useCallback(async () => {
    const cities = loadedCitiesRef.current;
    if (cities.length === 0) return;
    try {
      const results = await fetchWeatherForCities(cities);
      if (results.length === 0) return;
      setWeatherMap((prev) => {
        const next = new Map(prev);
        for (const w of results) next.set(cityKey(w.city), w);
        writeCache(Array.from(next.values()));
        return next;
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      refresh();
    }, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return { weatherMap, loading, error, lastUpdated, refresh };
}