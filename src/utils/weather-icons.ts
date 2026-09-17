import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";

export function weatherIcon(code: number, isDay: number): LucideIcon {
  if (code === 0) return isDay ? Sun : Moon;
  if (code === 1 || code === 2) return isDay ? CloudSun : CloudMoon;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || code === 80 || code === 81) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return CloudSnow;
  if (code === 82 || code >= 95) return CloudLightning;
  return Cloud;
}

function iconKey(icon: LucideIcon): string {
  return (icon.displayName ?? icon.name) as string;
}

// Leaflet's DivIcon only accepts an HTML string, so each lucide icon is
// pre-rendered once into a detached node (flushSync — createRoot renders
// async) and cached. Keyed by the icon component's name so every WMO code
// that resolves to the same icon reuses the cache entry.
const htmlCache = new Map<string, string>();

const REPRESENTATIVE_CODES = [0, 1, 2, 3, 45, 48, 51, 61, 71, 82, 95];

function buildHtml(code: number, isDay: number): void {
  const icon = weatherIcon(code, isDay);
  const key = iconKey(icon);
  if (htmlCache.has(key)) return;
  const container = document.createElement("div");
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      createElement(icon, {
        size: 14,
        strokeWidth: 1.75,
        "aria-hidden": true,
      }),
    );
  });
  htmlCache.set(key, container.innerHTML);
  root.unmount();
}

export function weatherIconHtml(code: number, isDay: number): string {
  const icon = weatherIcon(code, isDay);
  return htmlCache.get(iconKey(icon)) ?? "";
}

if (typeof document !== "undefined") {
  for (const code of REPRESENTATIVE_CODES) {
    buildHtml(code, 0);
    buildHtml(code, 1);
  }
}