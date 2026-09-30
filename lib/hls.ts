/**
 * HLS transcoding + segment storage helpers.
 * The actual transcode runs server-side on upload; segments are stored in Supabase Storage.
 * This module provides helpers for path construction and metadata.
 */

export interface VideoMeta {
  slug:           string;
  title:          string;
  creator:        string;   // wallet address
  durationSeconds: number;
  pricePerSecUsdc: string;  // e.g. "0.0001" (USDC per second, 6 dec decimal string)
  freePreviewSeconds: number;
  hlsMasterUrl:   string;   // public URL to master.m3u8
  thumbnailUrl?:  string;
  createdAt:      string;
}

/** Public URL for a video's HLS master playlist */
export function hlsMasterUrl(slug: string, baseUrl: string): string {
  return `${baseUrl}/videos/${slug}/master.m3u8`;
}

/** Segment URL for gated delivery */
export function segmentUrl(slug: string, segment: string, baseUrl: string): string {
  return `${baseUrl}/videos/${slug}/${segment}`;
}

/** Free preview: is this segment index within the free window? */
export function isSegmentFree(
  segmentIndex: number,
  targetDuration: number,   // seconds per segment (typically 6)
  freePreviewSeconds: number
): boolean {
  const elapsed = segmentIndex * targetDuration;
  return elapsed < freePreviewSeconds;
}

/** Calculate total cost for full video at a given rate */
export function totalCost(durationSeconds: number, pricePerSecUsdc: string): string {
  const total = parseFloat(pricePerSecUsdc) * durationSeconds;
  return total.toFixed(6);
}

/** Validate that a price-per-second value is reasonable (not negative, not absurd) */
export function validateRate(rateStr: string): { ok: boolean; reason?: string } {
  const r = parseFloat(rateStr);
  if (isNaN(r) || r < 0)      return { ok: false, reason: "Rate must be a non-negative number" };
  if (r > 1.0)                return { ok: false, reason: "Rate cannot exceed $1.00/second" };
  // 0 is allowed — free video
  return { ok: true };
}
