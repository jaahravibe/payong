import type { City } from "../types/city";
import { PHILIPPINE_CITIES } from "../data/cities";

type Position = { lat: number; lng: number };

function requestPosition(positionOptions: PositionOptions): Promise<Position> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      positionOptions,
    );
  });
}

// Fast network fix first — high accuracy forces a GPS lock and frequently
// times out. Only fall back to a fresh, patient GPS fix if that fails.
export async function getCurrentPosition(): Promise<Position> {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocation is not supported by this browser.");
  }
  try {
    return await requestPosition({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 120000,
    });
  } catch {
    return requestPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  }
}

export function locationErrorMessage(e: unknown): string {
  if (e instanceof GeolocationPositionError) {
    switch (e.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        return "Location denied. Enable permission to find your forecast.";
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        return "Your location could not be determined.";
      case GeolocationPositionError.TIMEOUT:
        return "Timed out waiting for your location.";
    }
  }
  return e instanceof Error && e.message
    ? e.message
    : "Could not get your location.";
}

export function nearestCity(
  lat: number,
  lng: number,
  cities: City[] = PHILIPPINE_CITIES,
): City {
  let best = cities[0];
  let bestD = Infinity;
  for (const c of cities) {
    const d = haversine(lat, lng, c.lat, c.lon);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}