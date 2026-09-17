import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { WeatherMap } from "./components/Map";
import { UiLayer } from "./components/UiLayer";
import { MAJOR_CITY_NAMES, PHILIPPINE_CITIES } from "./data/cities";
import type { City } from "./types/city";
import type { CityWeather } from "./types/weather";
import { useWeatherData } from "./hooks/useWeatherData";
import { useRainViewer } from "./layers/rainviewer";
import {
  getCurrentPosition,
  locationErrorMessage,
  nearestCity,
} from "./utils/locate";

function cityKey(city: City): string {
  return `${city.name}·${city.province}`;
}

export default function App() {
  const [neededCities, setNeededCities] = useState<City[]>(() =>
    PHILIPPINE_CITIES.filter((c) => MAJOR_CITY_NAMES.includes(c.name)),
  );
  const { weatherMap, loading, error, lastUpdated, refresh } =
    useWeatherData(neededCities);
  const { tileUrl: rainTileUrl, error: rainError } = useRainViewer(false);
  const [showRain, setShowRain] = useState(true);
  const [showClouds, setShowClouds] = useState(true);
  const fitRef = useRef<(() => void) | null>(null);
  const focusRef = useRef<((lat: number, lng: number) => void) | null>(null);

  const [selected, setSelected] = useState<{
    data: CityWeather;
    key: number;
  } | null>(null);
  const [pendingLocateCity, setPendingLocateCity] = useState<City | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const locateTimerRef = useRef<number | null>(null);

  const isLoading = loading && !weatherMap;

  // If the located city still needs a fetch, select it as soon as it arrives.
  useEffect(() => {
    if (!pendingLocateCity || !weatherMap) return;
    const entry = weatherMap.get(cityKey(pendingLocateCity));
    if (entry) {
      setSelected({ data: entry, key: Date.now() });
      setPendingLocateCity(null);
      setLocating(false);
    }
  }, [pendingLocateCity, weatherMap]);

  useEffect(
    () => () => {
      if (locateTimerRef.current) window.clearTimeout(locateTimerRef.current);
    },
    [],
  );

  const handleSelect = (data: CityWeather) =>
    setSelected({ data, key: Date.now() });

  const handleLocate = async () => {
    if (locating) return;
    setLocating(true);
    setLocateError(null);
    try {
      const { lat, lng } = await getCurrentPosition();
      const city = nearestCity(lat, lng);
      // Make sure the nearest city is requested so its forecast exists.
      setNeededCities((prev) =>
        prev.some((c) => c.name === city.name && c.province === city.province)
          ? prev
          : [...prev, city],
      );
      const entry = weatherMap.get(cityKey(city));
      if (entry) {
        setSelected({ data: entry, key: Date.now() });
        setLocating(false);
      } else {
        setPendingLocateCity(city);
      }
      focusRef.current?.(lat, lng);
    } catch (e) {
      setLocateError(locationErrorMessage(e));
      setLocating(false);
      locateTimerRef.current = window.setTimeout(
        () => setLocateError(null),
        6000,
      );
    }
  };

  return (
    <div className="app">
      <WeatherMap
        weatherMap={weatherMap}
        showRain={showRain}
        rainTileUrl={rainTileUrl}
        showClouds={showClouds}
        onNeedCities={setNeededCities}
        onSelect={handleSelect}
        fitRef={fitRef}
        focusRef={focusRef}
      />

      <UiLayer
        showRain={showRain}
        onToggleRain={() => setShowRain((v) => !v)}
        showClouds={showClouds}
        onToggleClouds={() => setShowClouds((v) => !v)}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        isLoading={isLoading}
        locationCount={neededCities.length}
        error={error}
        rainError={rainError}
        locateError={locateError}
        locating={locating}
        onLocate={handleLocate}
        selected={selected}
        onDismissSelection={() => setSelected(null)}
      />
    </div>
  );
}