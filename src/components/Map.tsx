import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import type { MutableRefObject } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Maximize, Minus, Plus } from "lucide-react";
import { MAJOR_CITY_NAMES, PHILIPPINE_CITIES } from "../data/cities";
import type { City } from "../types/city";
import type { CityWeather } from "../types/weather";
import { SpreadMarker } from "./SpreadMarker";
import { RealtimeCloudLayer } from "../layers/CloudLayer";

const PH_BOUNDS: [[number, number], [number, number]] = [
  [4.5, 116.5],
  [21.3, 127.8],
];

const MAX_BOUNDS: [[number, number], [number, number]] = [
  [3, 114],
  [23, 132],
];

// Markers sit exactly on their cities. When several land within one cell the
// later ones are hidden to avoid overlap; zooming in reveals them again. The
// cell size is zoom-adaptive in the tiering logic below.

const SATELLITE_BASEMAP = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
} as const;

interface MapProps {
  weatherMap: Map<string, CityWeather> | null;
  showRain: boolean;
  rainTileUrl: string | null;
  showClouds: boolean;
  onNeedCities: (cities: City[]) => void;
  onSelect: (data: CityWeather) => void;
  fitRef?: MutableRefObject<(() => void) | null>;
  focusRef?: MutableRefObject<((lat: number, lng: number) => void) | null>;
}

function ZoomMarkers({
  weatherMap,
  onNeedCities,
  onSelect,
  fitRef,
  focusRef,
}: {
  weatherMap: Map<string, CityWeather> | null;
  onNeedCities: (cities: City[]) => void;
  onSelect: (data: CityWeather) => void;
  fitRef?: MutableRefObject<(() => void) | null>;
  focusRef?: MutableRefObject<((lat: number, lng: number) => void) | null>;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [baseZoom, setBaseZoom] = useState(Math.round(map.getZoom()));

  useEffect(() => {
    const fit = () => {
      map.fitBounds(PH_BOUNDS, { padding: [20, 20] });
      // Step one zoom level back so the whole PH shows with breathing room
      // instead of filling the screen edge-to-edge.
      const fitZoom = Math.max(1, Math.round(map.getZoom()) - 1);
      map.setMinZoom(fitZoom);
      setBaseZoom(fitZoom);
      setZoom(fitZoom);
    };
    const onZoom = () => setZoom(map.getZoom());

    if (fitRef) fitRef.current = fit;
    const focus = (lat: number, lng: number) => {
      map.setView([lat, lng], Math.max(baseZoom + 2, Math.round(map.getZoom())), {
        animate: true,
      });
    };
    if (focusRef) focusRef.current = focus;
    fit();
    map.on("zoom", onZoom);
    map.on("zoomend", onZoom);
    window.addEventListener("resize", fit);
    return () => {
      if (fitRef) fitRef.current = null;
      if (focusRef) focusRef.current = null;
      map.off("zoom", onZoom);
      map.off("zoomend", onZoom);
      window.removeEventListener("resize", fit);
    };
  }, [map, fitRef, focusRef, baseZoom]);

  // The list of cities to have data for at the current zoom tier. The hook
  // fetches only the newly requested ones as you zoom in, keeping the payload
  // small at the country view. Tiers are cumulative so majors never drop out.
  const neededCities = useMemo(() => {
    if (zoom <= baseZoom) return PHILIPPINE_CITIES.filter((c) => MAJOR_CITY_NAMES.includes(c.name));
    if (zoom <= baseZoom + 2)
      return PHILIPPINE_CITIES.filter((c) => c.capital || MAJOR_CITY_NAMES.includes(c.name));
    return PHILIPPINE_CITIES;
  }, [zoom, baseZoom]);

  useEffect(() => {
    onNeedCities(neededCities);
  }, [neededCities, onNeedCities]);

  const selection = useMemo(() => {
    if (!weatherMap) return null;

    const all = Array.from(weatherMap.values());
    let visible: CityWeather[];

    if (zoom <= baseZoom) {
      visible = all.filter((w) => MAJOR_CITY_NAMES.includes(w.city.name));
    } else if (zoom <= baseZoom + 2) {
      visible = all.filter(
        (w) => w.city.capital || MAJOR_CITY_NAMES.includes(w.city.name),
      );
    } else {
      visible = all;
    }

    // Big cities draw first so small towns never crowd them out, and give the
    // placement pass culled points priority.
    const rank = (w: CityWeather) =>
      (MAJOR_CITY_NAMES.includes(w.city.name) ? 10 : 0) +
      (w.city.capital ? 5 : 0);
    visible.sort((a, b) => rank(b) - rank(a));

    // Marker box is ~52px wide; keep that as the minimum centre spacing so
    // chips never overlap, shrinking slightly at higher zooms when markers
    // collide less because tiles have more room.
    const minDist = Math.max(40, 72 - Math.floor(zoom) * 3);

    const items: { data: CityWeather; anchor: L.LatLng }[] = [];
    const kept: { x: number; y: number }[] = [];

    for (const data of visible) {
      const p = map.project([data.city.lat, data.city.lon], zoom);
      const blocked = kept.some(
        (q) => Math.hypot(p.x - q.x, p.y - q.y) < minDist,
      );
      if (blocked) continue;
      kept.push(p);
      items.push({
        data,
        anchor: map.unproject([p.x, p.y], zoom),
      });
    }
    items.sort((a, b) => rank(b.data) - rank(a.data));

    return { visible, items };
  }, [weatherMap, zoom, baseZoom, map]);

  if (!weatherMap || !selection) return null;

  const select = (data: CityWeather) => {
    const anchor = new L.LatLng(data.city.lat, data.city.lon);
    map.setView(
      [anchor.lat, anchor.lng],
      Math.min(Math.max(zoom, baseZoom + 2), 19),
    );
    onSelect(data);
  };

  return (
    <>
      {selection.items.map(({ data, anchor }) => (
        <SpreadMarker
          key={`${data.city.name}-${data.city.province}`}
          data={data}
          anchor={anchor}
          onSelect={select}
        />
      ))}
    </>
  );
}

function ZoomControls({
  fitRef,
}: {
  fitRef?: MutableRefObject<(() => void) | null>;
}) {
  const map = useMap();

  const stop = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      className="zoom-controls"
      role="group"
      aria-label="Map controls"
      onPointerDown={stop}
    >
      <button
        type="button"
        className="zoom-controls__button"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="zoom-controls__button"
        onClick={() => fitRef?.current?.()}
        aria-label="Fit map to Philippines"
        title="Fit map to Philippines"
      >
        <Maximize size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="zoom-controls__button"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

export function WeatherMap({
  weatherMap,
  showRain,
  rainTileUrl,
  showClouds,
  onNeedCities,
  onSelect,
  fitRef,
  focusRef,
}: MapProps) {
  return (
    <MapContainer
      bounds={PH_BOUNDS}
      boundsOptions={{ padding: [20, 20] }}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={1}
      maxZoom={19}
      zoomControl={false}
      attributionControl={false}
      className="weather-map"
    >
      <ZoomControls fitRef={fitRef} />
      <TileLayer
        url={SATELLITE_BASEMAP.url}
        attribution={SATELLITE_BASEMAP.attribution}
        maxZoom={19}
      />
      {showClouds && <RealtimeCloudLayer />}
      {showRain && rainTileUrl && (
        <TileLayer
          url={rainTileUrl}
          attribution="&copy; <a href='https://www.rainviewer.com'>RainViewer</a>"
          opacity={0.65}
          // RainViewer returns a 200-OK error PNG ("Zoom Level Not Supported")
          // for tiles above native zoom 7, so clamp its requests and upscale.
          maxNativeZoom={7}
          maxZoom={19}
          // Above the default tile z-index (1) so radar renders over the
          // cloud layer, which is added later and would otherwise cover it.
          zIndex={2}
        />
      )}
      <ZoomMarkers
        weatherMap={weatherMap}
        onNeedCities={onNeedCities}
        onSelect={onSelect}
        fitRef={fitRef}
        focusRef={focusRef}
      />
    </MapContainer>
  );
}