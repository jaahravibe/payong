export function formatTemp(temp: number): string {
  return `${Math.round(temp)}°`;
}

export function formatDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-PH", { weekday: "short" });
}

export function formatFullDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function windDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}