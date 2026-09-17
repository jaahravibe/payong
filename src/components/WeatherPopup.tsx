import { ChevronDown, ChevronUp } from "lucide-react";
import type { CityWeather } from "../types/weather";
import { formatDateLabel, formatFullDate, formatTemp, windDirection } from "../utils/format";
import { describeCode } from "../utils/wmo-codes";
import { weatherIcon } from "../utils/weather-icons";
import { createElement } from "react";

function CurrentCodeIcon({
  code,
  isDay,
}: {
  code: number;
  isDay: number;
}) {
  const icon = weatherIcon(code, isDay);
  return createElement(icon, {
    size: 14,
    strokeWidth: 1.75,
    "aria-hidden": true,
  });
}

function DayCodeIcon({ code }: { code: number }) {
  const icon = weatherIcon(code, 1);
  return createElement(icon, {
    size: 12,
    strokeWidth: 1.75,
    "aria-hidden": true,
  });
}

const DEFAULT_DAYS = 3;

interface WeatherPopupProps {
  data: CityWeather;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export function WeatherPopup({
  data,
  expanded,
  onToggleExpanded,
}: WeatherPopupProps) {
  const { city, current, daily } = data;
  const shown = daily.time.slice(0, expanded ? daily.time.length : DEFAULT_DAYS);

  return (
    <div className="popup">
      <div className="popup__header">
        <div>
          <div className="popup__city">{city.name}</div>
          <div className="popup__province">
            {city.province} · {city.region}
          </div>
        </div>
        <span className="popup__code">
          <CurrentCodeIcon code={current.weather_code} isDay={current.is_day} />
        </span>
      </div>

      <div className="popup__body">
        <div className="popup__temp">
          {formatTemp(current.temperature_2m)}
          <span className="popup__feels">
            feels {formatTemp(current.apparent_temperature)}
          </span>
        </div>
        <div className="popup__condition">
          {describeCode(current.weather_code)}
        </div>

        <div className="popup__stats">
          <div className="popup__stat">
            <span className="popup__stat-label">Humidity</span>
            <span className="popup__stat-value">
              {current.relative_humidity_2m}%
            </span>
          </div>
          <div className="popup__stat">
            <span className="popup__stat-label">Wind</span>
            <span className="popup__stat-value">
              {Math.round(current.wind_speed_10m)} km/h{" "}
              {windDirection(current.wind_direction_10m)}
            </span>
          </div>
          <div className="popup__stat">
            <span className="popup__stat-label">Rain</span>
            <span className="popup__stat-value">
              {current.precipitation.toFixed(1)} mm
            </span>
          </div>
        </div>

        <div className="popup__forecast">
          {shown.map((day, i) => {
            const hi = daily.temperature_2m_max[i];
            const lo = daily.temperature_2m_min[i];
            return (
              <div className="popup__day" key={day}>
                <span className="popup__day-name">
                  {formatDateLabel(day)}
                </span>
                <span className="popup__day-code">
                  <DayCodeIcon code={daily.weather_code[i]} />
                </span>
                <span className="popup__day-range">
                  {formatTemp(lo)}–{formatTemp(hi)}
                </span>
                <span className="popup__day-rain">
                  {daily.precipitation_probability_max[i] ?? 0}%
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="popup__expand"
          onClick={onToggleExpanded}
        >
          {expanded ? (
            <>
              <ChevronUp size={12} strokeWidth={1.75} aria-hidden="true" />
              Show fewer days
            </>
          ) : (
            <>
              <ChevronDown size={12} strokeWidth={1.75} aria-hidden="true" />
              Show more days
            </>
          )}
        </button>
      </div>
      <div className="popup__footnote">
        {formatFullDate(daily.time[0])}
      </div>
    </div>
  );
}