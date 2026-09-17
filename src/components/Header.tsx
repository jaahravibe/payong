import { useEffect, useRef, useState } from "react";
import { Cloud, CloudRain, Radar, Umbrella } from "lucide-react";

type RainLegendItem = {
  color: string;
  opacity?: number;
  label: string;
  mmh: string;
  dbz: string;
  desc: string;
};

const RAIN_LEGEND: RainLegendItem[] = [
  {
    color: "#cec087",
    opacity: 0.6,
    label: "Trace",
    mmh: "< 1 mm/h",
    dbz: "< 15 dBZ",
    desc: "Very light precipitation, barely wet",
  },
  {
    color: "#005588",
    label: "Light",
    mmh: "1–5 mm/h",
    dbz: "15–25 dBZ",
    desc: "Light rain, umbrellas help",
  },
  {
    color: "#00a3e0",
    label: "Moderate",
    mmh: "5–10 mm/h",
    dbz: "25–35 dBZ",
    desc: "Steady rain, puddles form quickly",
  },
  {
    color: "#ffee00",
    label: "Heavy",
    mmh: "10–25 mm/h",
    dbz: "35–45 dBZ",
    desc: "Heavy rain, poor visibility",
  },
  {
    color: "#ffaa00",
    label: "Very heavy",
    mmh: "25–50 mm/h",
    dbz: "45–55 dBZ",
    desc: "Downpour, flash-flood risk",
  },
  {
    color: "#ff4400",
    label: "Extreme",
    mmh: "> 50 mm/h",
    dbz: "55+ dBZ",
    desc: "Violent rain, severe flooding",
  },
];

interface HeaderProps {
  showRain: boolean;
  onToggleRain: () => void;
  showClouds: boolean;
  onToggleClouds: () => void;
  loading: boolean;
}

export function Header({
  showRain,
  onToggleRain,
  showClouds,
  onToggleClouds,
  loading,
}: HeaderProps) {
  const [legendOpen, setLegendOpen] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!legendOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setLegendOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [legendOpen]);

  return (
    <div className="controls">
      <h1 className="controls__brand">
        <Umbrella size={13} strokeWidth={1.75} aria-hidden="true" />
        Payong Weather
      </h1>
      <div className="controls__buttons">
        <button
          type="button"
          className={`controls__button ${showClouds ? "controls__button--active" : ""}`}
          onClick={onToggleClouds}
          aria-label="Clouds"
          title="Clouds"
        >
          <Cloud size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="controls__label">Clouds</span>
        </button>
        <button
          type="button"
          className={`controls__button ${showRain ? "controls__button--active" : ""}`}
          onClick={onToggleRain}
          disabled={loading}
          aria-label="Rain radar"
          title="Rain radar"
        >
          <CloudRain size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="controls__label">Rain</span>
        </button>
        <div className="controls__legend" ref={legendRef}>
          <button
            type="button"
            className={`controls__button ${legendOpen ? "controls__button--active" : ""}`}
            onClick={() => setLegendOpen((v) => !v)}
            aria-expanded={legendOpen}
            aria-label="Rain intensity legend"
            title="Rain intensity"
          >
            <Radar size={15} strokeWidth={1.75} aria-hidden="true" />
            <span className="controls__label">Legend</span>
          </button>
          {legendOpen && (
            <div className="legend">
              <ul className="legend__list">
                {RAIN_LEGEND.map((item) => (
                  <li key={item.label} className="legend__row">
                    <span
                      className="legend__chip"
                      style={{ background: item.color, opacity: item.opacity ?? 1 }}
                    />
                    <span className="legend__row-main">
                      <span className="legend__row-name">
                        {item.label}
                        <span className="legend__row-unit">{item.mmh}</span>
                        <span className="legend__row-unit">{item.dbz}</span>
                      </span>
                      <span className="legend__row-desc">{item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}