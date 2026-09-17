import { RefreshCw } from "lucide-react";

interface StatusBarProps {
  lastUpdated?: Date | null;
  onRefresh: () => void;
}

export function StatusBar({ lastUpdated, onRefresh }: StatusBarProps) {
  return (
    <div className="status">
      <div className="status__top">
        {lastUpdated && (
          <span className="status__updated">
            <span className="status__pulse" aria-hidden="true" />
            Updated{" "}
            {lastUpdated.toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
        <button
          type="button"
          className="status__refresh"
          onClick={onRefresh}
          aria-label="Refresh weather"
          title="Refresh weather"
        >
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
          <span className="status__refresh-text">Sync</span>
        </button>
      </div>
      <div className="status__bottom">
        <span className="status__copyright">
          Tiles © Esri, Maxar, Earthstar Geographics ·{" "}
          <a
            href="https://www.rainviewer.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Radar © RainViewer
          </a>
          {" · "}
          <a
            href="https://realearth.ssec.wisc.edu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clouds © SSEC RealEarth, UW–Madison
          </a>
        </span>
      </div>
    </div>
  );
}