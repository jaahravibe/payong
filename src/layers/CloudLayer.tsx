import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { IR_BASE, InfraredCloudTileLayer } from "./infrared-cloud-layer";

const REFRESH_MS = 10 * 60 * 1000;
const RECHECK_MS = 60 * 1000;

const URL_TEMPLATE = `${IR_BASE}/{z}/{x}/{y}.png`;

interface RealtimeCloudLayerProps {
  opacity?: number;
}

export function RealtimeCloudLayer({ opacity = 1 }: RealtimeCloudLayerProps) {
  const map = useMap();
  const [version, setVersion] = useState(() => Math.floor(Date.now() / REFRESH_MS));
  const layerRef = useRef<InfraredCloudTileLayer | null>(null);

  useEffect(() => {
    const layer = new InfraredCloudTileLayer({
      tileUrl: URL_TEMPLATE,
      opacity,
    });
    layer.setIsSourceVersion(version);
    layerRef.current = layer;
    map.addLayer(layer);
    return () => {
      layerRef.current = null;
      map.removeLayer(layer);
    };
  }, [map, opacity, version]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.floor(Date.now() / REFRESH_MS);
      if (next !== version) setVersion(next);
    }, RECHECK_MS);
    return () => clearInterval(timer);
  }, [version]);

  return null;
}