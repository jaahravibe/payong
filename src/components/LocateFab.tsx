import { Loader2, Umbrella } from "lucide-react";

interface LocateFabProps {
  locating: boolean;
  onLocate: () => void;
}

export function LocateFab({ locating, onLocate }: LocateFabProps) {
  return (
    <button
      type="button"
      className="locate-fab"
      onClick={onLocate}
      disabled={locating}
      aria-label="Forecast for my location"
      title="Forecast for my location"
    >
      {locating ? (
        <Loader2
          size={20}
          strokeWidth={1.75}
          className="locate-fab__spinner"
          aria-hidden="true"
        />
      ) : (
        <Umbrella size={20} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}