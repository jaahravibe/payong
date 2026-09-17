import L from "leaflet";
import { useMemo } from "react";
import { Marker } from "react-leaflet";
import type { CityWeather } from "../types/weather";
import { formatTemp } from "../utils/format";
import { weatherIconHtml } from "../utils/weather-icons";

function buildWeatherIcon(data: CityWeather): L.DivIcon {
  const { current } = data;

    const html = `
    <div class="weather-marker">
      <div class="weather-marker__main">
        <span class="weather-marker__icon">${weatherIconHtml(current.weather_code, current.is_day)}</span>
        <span class="weather-marker__temp">${formatTemp(current.temperature_2m)}</span>
      </div>
      <span class="weather-marker__city">${data.city.name}</span>
    </div>`;

  return L.divIcon({
    className: "weather-marker-icon",
    html,
    iconSize: [46, 40],
    iconAnchor: [23, 20],
    popupAnchor: [0, -14],
  });
}

interface SpreadMarkerProps {
  data: CityWeather;
  anchor: L.LatLng;
  onSelect: (data: CityWeather) => void;
}

export function SpreadMarker({ data, anchor, onSelect }: SpreadMarkerProps) {
  const icon = useMemo(() => buildWeatherIcon(data), [data]);

  return (
    <Marker
      position={anchor}
      icon={icon}
      zIndexOffset={1000}
      eventHandlers={{ click: () => onSelect(data) }}
    />
  );
}