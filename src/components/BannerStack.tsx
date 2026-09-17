interface BannerStackProps {
  error: string | null;
  rainError: string | null;
  locateError: string | null;
  showRain: boolean;
  onRetry: () => void;
}

export function BannerStack({
  error,
  rainError,
  locateError,
  showRain,
  onRetry,
}: BannerStackProps) {
  return (
    <div className="banners">
      {error && (
        <div className="banner banner--error">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
      {showRain && rainError && !error && (
        <div className="banner">
          <span>Radar unavailable: {rainError}</span>
        </div>
      )}
      {locateError && !error && (
        <div className="banner">
          <span>{locateError}</span>
        </div>
      )}
    </div>
  );
}