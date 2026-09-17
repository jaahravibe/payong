import { Loader2 } from "lucide-react";
import type { CityWeather } from "../types/weather";
import { BannerStack } from "./BannerStack";
import { ForecastPanel } from "./ForecastPanel";
import { Header } from "./Header";
import { LocateFab } from "./LocateFab";
import { StatusBar } from "./StatusBar";

interface UiLayerProps {
  showRain: boolean;
  onToggleRain: () => void;
  showClouds: boolean;
  onToggleClouds: () => void;
  loading: boolean;
  lastUpdated?: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  locationCount: number;
  error: string | null;
  rainError: string | null;
  locateError: string | null;
  locating: boolean;
  onLocate: () => void;
  selected: { data: CityWeather; key: number } | null;
  onDismissSelection: () => void;
}

export function UiLayer({
  showRain,
  onToggleRain,
  showClouds,
  onToggleClouds,
  loading,
  lastUpdated,
  onRefresh,
  isLoading,
  locationCount,
  error,
  rainError,
  locateError,
  locating,
  onLocate,
  selected,
  onDismissSelection,
}: UiLayerProps) {
  return (
    <div className="ui">
      <Header
        showRain={showRain}
        onToggleRain={onToggleRain}
        showClouds={showClouds}
        onToggleClouds={onToggleClouds}
        loading={loading}
      />
      <StatusBar lastUpdated={lastUpdated} onRefresh={onRefresh} />
      <ForecastPanel selected={selected} onDismiss={onDismissSelection} />
      <LocateFab locating={locating} onLocate={onLocate} />

      {isLoading && (
        <div className="overlay">
          <Loader2
            size={26}
            strokeWidth={1.5}
            className="overlay__spinner"
            aria-hidden="true"
          />
          <p className="overlay__text">
            Fetching weather for {locationCount} locations…
          </p>
        </div>
      )}

      <BannerStack
        error={error}
        rainError={rainError}
        locateError={locateError}
        showRain={showRain}
        onRetry={onRefresh}
      />
    </div>
  );
}