import { useEffect, useState } from "react";
import type { RainViewerResponse } from "../types/weather";

const COLORS = 6;
const OPTIONS = 0;
const SIZE = 256;

export function useRainViewer(nowcast: boolean) {
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (!res.ok) throw new Error(`RainViewer error ${res.status}`);
        const data = (await res.json()) as RainViewerResponse;
        const source = nowcast ? data.radar.nowcast : data.radar.past;
        if (!source || source.length === 0) return;
        const frames = source[source.length - 1];
        const tilePath = frames.path; // e.g. "/v2/radar/8807360ba6b9"
        if (!tilePath) return;
        if (cancelled) return;
        setTileUrl(
          `${data.host}${tilePath}/${SIZE}/{z}/{x}/{y}/${COLORS}/${OPTIONS}.png`,
        );
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nowcast]);

  return { tileUrl, error };
}