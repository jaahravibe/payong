# Payong — Philippine Weather Map

A map-first weather app for the Philippines. Full-screen Leaflet map with
temperature markers for 107 major cities and provincial capitals, a tap-driven
forecast panel (current + 3-day, expandable to 10-day), a keyless RainViewer
rainfall radar overlay, and a custom satellite-IR cloud overlay.

Built with React + Vite + TypeScript. All weather data comes from free APIs
with **no keys or registration**:

| Data | Provider | URL |
| --- | --- | --- |
| Current weather + forecast | [Open-Meteo](https://open-meteo.com) | `api.open-meteo.com` (CC BY 4.0) |
| Rainfall radar tiles | [RainViewer](https://www.rainviewer.com) | `api.rainviewer.com` / `tilecache.rainviewer.com` |
| IR cloud tiles | [SSEC RealEarth](https://re.ssec.wisc.edu) | `realearth.ssec.wisc.edu` |
| Basemap (satellite) | [Esri](https://www.esri.com) | `server.arcgisonline.com` |

## Features

- Temperature markers across 107 PH cities/provinces, zoom-aware so markers never overlap.
- Forecast panel: current conditions, cloud cover, wind, humidity + a 3-day extended forecast (expand to 10 days).
- Rain radar toggle with an in-header intensity legend.
- Cloud overlay toggle (brightness-mapped IR tiles, softly blurred to eliminate tile seams).
- Geolocation "home" button (FAB): network-fix first, GPS fallback, flies to your nearest city and shows its forecast.
- Keyless APIs, no registration, works offline-ish once loaded, no analytics.

## Development

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run build   # outputs to dist/
npm run lint
```

## Deploy to GitHub Pages

Deployment is handled by a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the app and deploys `dist/` on every push to `main`.

1. Enable GitHub Pages in **Settings → Pages**, with **Source** set to
   **GitHub Actions**.
2. Push to `main` (or run the workflow manually via the **Actions** tab).
3. App is live at `https://<user>.github.io/payong/`, with each deploy
   recorded under the repo's **Deployments** section.

The project uses relative asset paths (`base: "./"`), so it works under any subpath.

## Project layout

```
src/
  api/weather.ts          # Open-Meteo batched fetch (chunked) + TTL cache
  components/             # Map, Header, UiLayer, SpreadMarker, ForecastPanel,
                          # WeatherPopup, LocateFab, StatusBar, BannerStack
  data/cities.ts          # 107 PH cities: name, province, region, lat/lon
  hooks/useWeatherData.ts
  layers/                 # infrared-cloud-layer (canvas IR → alpha), CloudLayer,
                          # rainviewer (radar tile URL hook)
  types/                  # City, weather, RainViewer typings
  utils/                  # format, locate (two-stage geolocation), weather-icons,
                          # wmo-codes
```

## Attribution

Data © [Open-Meteo](https://open-meteo.com) (CC BY 4.0), [RainViewer](https://www.rainviewer.com),
SSEC RealEarth, Tiles © Esri, Maxar, Earthstar Geographics.

Disclaimer: Not affiliated with or a substitute for official [PAGASA](https://www.pagasa.dost.gov.ph)
warnings during severe weather.