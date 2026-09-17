export interface WmoInfo {
  label: string;
  description: string;
  category: "clear" | "cloudy" | "rain" | "storm";
}

const WMO_CODES: Record<number, WmoInfo> = {
  0: { label: "Clear", description: "Clear sky", category: "clear" },
  1: { label: "Mostly clear", description: "Mainly clear", category: "clear" },
  2: { label: "Partly cloudy", description: "Partly cloudy", category: "cloudy" },
  3: { label: "Overcast", description: "Overcast", category: "cloudy" },
  45: { label: "Fog", description: "Foggy", category: "cloudy" },
  48: { label: "Rime fog", description: "Depositing rime fog", category: "cloudy" },
  51: { label: "Drizzle", description: "Light drizzle", category: "rain" },
  53: { label: "Drizzle", description: "Moderate drizzle", category: "rain" },
  55: { label: "Drizzle", description: "Dense drizzle", category: "rain" },
  56: { label: "Freezing drizzle", description: "Light freezing drizzle", category: "rain" },
  57: { label: "Freezing drizzle", description: "Dense freezing drizzle", category: "rain" },
  61: { label: "Rain", description: "Slight rain", category: "rain" },
  63: { label: "Rain", description: "Moderate rain", category: "rain" },
  65: { label: "Heavy rain", description: "Heavy rain", category: "rain" },
  66: { label: "Freezing rain", description: "Light freezing rain", category: "rain" },
  67: { label: "Freezing rain", description: "Heavy freezing rain", category: "rain" },
  71: { label: "Snow", description: "Slight snowfall", category: "rain" },
  73: { label: "Snow", description: "Moderate snowfall", category: "rain" },
  75: { label: "Snow", description: "Heavy snowfall", category: "rain" },
  77: { label: "Snow grains", description: "Snow grains", category: "rain" },
  80: { label: "Rain showers", description: "Slight rain showers", category: "rain" },
  81: { label: "Rain showers", description: "Moderate rain showers", category: "rain" },
  82: { label: "Rain showers", description: "Violent rain showers", category: "storm" },
  85: { label: "Snow showers", description: "Slight snow showers", category: "rain" },
  86: { label: "Snow showers", description: "Heavy snow showers", category: "rain" },
  95: { label: "Thunderstorm", description: "Thunderstorm", category: "storm" },
  96: { label: "Thunderstorm", description: "Thunderstorm with slight hail", category: "storm" },
  99: { label: "Thunderstorm", description: "Thunderstorm with heavy hail", category: "storm" },
};

export function getWmoInfo(code: number): WmoInfo {
  return (
    WMO_CODES[code] ?? {
      label: "Unknown",
      description: "Unknown conditions",
      category: "cloudy",
    }
  );
}

export function describeCode(code: number): string {
  return getWmoInfo(code).description;
}