/** Raw MediaPipe blendshape scores, keyed by category name (0..1 each). */
export type BlendshapeMap = Record<string, number>;

/**
 * Higher-level expression signals derived from blendshape clusters.
 * All values are continuous in 0..1 — never discrete emotion labels.
 */
export interface Signals {
  smile: number;
  surprise: number;
  frown: number;
  disgust: number;
  tension: number;
  jawOpen: number;
  /** Overall facial activity — how far the face is from neutral. */
  activity: number;
}

export const NEUTRAL_SIGNALS: Signals = {
  smile: 0,
  surprise: 0,
  frown: 0,
  disgust: 0,
  tension: 0,
  jawOpen: 0,
  activity: 0,
};

/** Parameters consumed by the particle renderer, interpolated every frame. */
export interface VisualParams {
  hue: number;
  saturation: number;
  lightness: number;
  /** Particles spawned per second. */
  spawnRate: number;
  /** -1 (sinking) .. 1 (rising). */
  upwardBias: number;
  /** Momentary radial burst strength 0..1 (surprise spikes). */
  burst: number;
  /** Flow-field chaos 0..1. */
  turbulence: number;
  /** 0 = soft round particles, 1 = sharp angular shards. */
  angularity: number;
  /** Base particle speed multiplier. */
  speed: number;
  /** Base particle size in px. */
  size: number;
}

export interface GalleryItem {
  id: string;
  createdAt: number;
  /** Downscaled JPEG data URL for the gallery grid. */
  thumb: string;
}
