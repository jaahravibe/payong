import L from "leaflet";

export const IR_BASE = "https://realearth.ssec.wisc.edu/tiles/globalir";
export const IR_ATTRIBUTION =
  'Infrared clouds &copy; <a href="https://realearth.ssec.wisc.edu/" target="_blank" rel="noopener">SSEC RealEarth, UW&ndash;Madison</a>';

const IR_ALPHA_FLOOR = 105;
const IR_ALPHA_GAMMA = 1.15;

// RealEarth actually serves real IR pixels roughly up to z7 — deeper levels
// return flat placeholder tiles (~2 distinct greys) that would smear the map.
// Cap native tiles there; anything deeper is upscaled by Leaflet.
const IR_MAX_NATIVE_ZOOM = 7;

// A tile whose pixels are all within this delta of the first sample is a
// flat placeholder: render it fully transparent instead of a grey/white box.
const IR_FLAT_DELTA = 2;

// IR brightness -> white cloud with a soft, translucent mask. Values above the
// floor fade in through a gamma curve so the cloud mass reads naturally.

const BLANK_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGIAAQAABQABDQottAAAAABJRU5ErkJggg==";

// Every processed tile is memoized per source version so a pan or refresh
// starts from the processed frame, and a failed fetch never leaves a hole.
const TILE_CACHE = new Map<string, Promise<string | null>>();
const TILE_CACHE_MAX = 256;

const FETCH_RETRIES = 3;
const RETRY_DELAY_MS = [600, 1600];

function pruneTileCache(): void {
  while (TILE_CACHE.size > TILE_CACHE_MAX) {
    const key = TILE_CACHE.keys().next().value;
    if (key === undefined) break;
    TILE_CACHE.delete(key);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface InfraredCloudTileLayerOptions extends L.TileLayerOptions {
  tileUrl: string;
}

export class InfraredCloudTileLayer extends L.TileLayer {
  version: number;

  constructor(options: InfraredCloudTileLayerOptions) {
    const { tileUrl, ...rest } = options;
    super(tileUrl, {
      ...rest,
      opacity: rest.opacity ?? 1,
      maxNativeZoom: IR_MAX_NATIVE_ZOOM,
      tileSize: 256,
      minZoom: 0,
      maxZoom: 19,
    });
    this.version = 0;
  }

  setIsSourceVersion(version: number): void {
    this.version = version;
  }

  override getTileUrl(coords: L.Coords): string {
    const base = super.getTileUrl(coords);
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}v=${this.version}`;
  }

  override createTile(coords: L.Coords, done: L.DoneCallback): HTMLImageElement {
    const tile = document.createElement("img");
    tile.alt = "";
    tile.setAttribute("role", "presentation");

    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      done(error, tile);
    };

    tile.addEventListener("load", () => finish(undefined));
    tile.addEventListener("error", () => finish(new Error("realtime cloud tile failed")));

    let url: string;
    try {
      url = this.getTileUrl(coords);
    } catch {
      tile.src = BLANK_PNG;
      return tile;
    }

    const cacheKey = `${this.version}/${coords.z}/${coords.x}/${coords.y}`;
    let pending = TILE_CACHE.get(cacheKey);
    if (!pending) {
      pending = this._fetchInfrared(url).then((src) => {
        if (src === null) TILE_CACHE.delete(cacheKey);
        return src;
      });
      TILE_CACHE.set(cacheKey, pending);
      pruneTileCache();
    }

    pending.then(
      (src) => {
        tile.src = src ?? BLANK_PNG;
      },
      () => {
        tile.src = BLANK_PNG;
      },
    );

    return tile;
  }

  private async _fetchInfrared(url: string): Promise<string | null> {
    let lastError: unknown;
    for (let attempt = 0; attempt < FETCH_RETRIES; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAY_MS[attempt - 1]);
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }
        const src = await this._processTile(await response.blob());
        if (src === null) {
          // Not fatal: flat placeholder or a processing hiccup. Stop retrying
          // so a bad tile resolves to transparent instead of hammering.
          return null;
        }
        return src;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError instanceof Error) throw lastError;
    return null;
  }

  // Turn a raw IR tile (brightness = cloud height) into a white cloud mask.
  // Returns null for flat placeholder tiles or when the browser refuses to
  // process the canvas (tainted canvas, per-device size limits, decoding
  // quirks) — in every case the tile degrades to transparent, never a box.
  private async _processTile(blob: Blob): Promise<string | null> {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(blob);
    } catch {
      return null;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      bitmap = null as unknown as ImageBitmap;

      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;

      // Flat placeholders (past the native ceiling) and empty serves must
      // come back transparent; otherwise the whole map turns grey.
      let first = data[0];
      let flat = true;
      for (let i = 0; i < data.length; i += 16) {
        if (Math.abs(data[i] - first) > IR_FLAT_DELTA) {
          flat = false;
          break;
        }
      }
      if (flat) return null;

      const range = 255 - IR_ALPHA_FLOOR;
      for (let i = 0; i < data.length; i += 4) {
        const t = (data[i] - IR_ALPHA_FLOOR) / range;
        if (t <= 0) {
          data[i + 3] = 0;
        } else {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = Math.round(Math.pow(Math.min(t, 1), IR_ALPHA_GAMMA) * 255);
        }
      }
      ctx.putImageData(image, 0, 0);

      // A half-pixel alpha blur bleeds just past the tile edge and smears
      // the per-tile threshold noise, so neighbouring tiles blend into one
      // continuous cloud mass instead of showing faint grid lines.
      if (ctx.filter) {
        const blurred = document.createElement("canvas");
        blurred.width = canvas.width;
        blurred.height = canvas.height;
        const bctx = blurred.getContext("2d");
        if (bctx && typeof bctx.filter === "string") {
          bctx.filter = "blur(0.8px)";
          bctx.drawImage(canvas, 0, 0);
          return bctx.canvas.toDataURL("image/png");
        }
      }
      return ctx.canvas.toDataURL("image/png");
    } catch {
      if (bitmap) bitmap.close();
      return null;
    }
  }
}