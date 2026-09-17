import { useState } from "react";
import { X } from "lucide-react";
import type { CityWeather } from "../types/weather";
import { WeatherPopup } from "./WeatherPopup";

interface ForecastPanelProps {
  selected: { data: CityWeather; key: number } | null;
  onDismiss: () => void;
}

export function ForecastPanel({ selected, onDismiss }: ForecastPanelProps) {
  const [expanded, setExpanded] = useState(false);
  if (!selected) return null;

  return (
    <div className="forecast-panel" key={selected.key}>
      <button
        type="button"
        className="forecast-panel__close"
        onClick={onDismiss}
        aria-label="Dismiss forecast"
        title="Dismiss"
      >
        <X size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <WeatherPopup
        data={selected.data}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((v) => !v)}
      />
    </div>
  );
}