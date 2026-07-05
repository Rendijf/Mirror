import type { BlendshapeMap, Signals, VisualParams } from "../types";

const avg = (...values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const get = (bs: BlendshapeMap, key: string) => bs[key] ?? 0;

/**
 * Collapses the 52 raw blendshapes into a handful of continuous expression
 * signals. Deliberately NOT a classifier — every signal is a weighted blend
 * of raw coefficients, so mixed and subtle expressions survive.
 */
export function deriveSignals(bs: BlendshapeMap): Signals {
  const smile = avg(get(bs, "mouthSmileLeft"), get(bs, "mouthSmileRight"));

  const surprise = clamp01(
    0.5 * get(bs, "browInnerUp") +
      0.35 * avg(get(bs, "eyeWideLeft"), get(bs, "eyeWideRight")) +
      0.3 * get(bs, "jawOpen")
  );

  const frown = clamp01(
    0.6 * avg(get(bs, "browDownLeft"), get(bs, "browDownRight")) +
      0.4 * avg(get(bs, "mouthFrownLeft"), get(bs, "mouthFrownRight"))
  );

  const disgust = clamp01(
    0.55 * avg(get(bs, "noseSneerLeft"), get(bs, "noseSneerRight")) +
      0.45 * avg(get(bs, "eyeSquintLeft"), get(bs, "eyeSquintRight"))
  );

  const tension = clamp01(
    0.5 * avg(get(bs, "mouthPressLeft"), get(bs, "mouthPressRight")) +
      0.3 * get(bs, "jawForward") +
      0.3 * avg(get(bs, "mouthStretchLeft"), get(bs, "mouthStretchRight"))
  );

  const jawOpen = get(bs, "jawOpen");

  const activity = clamp01(
    Math.max(smile, surprise, frown, disgust, tension, jawOpen)
  );

  return { smile, surprise, frown, disgust, tension, jawOpen, activity };
}

/** Expression → target hue anchors (degrees), blended circularly by weight. */
const HUE_ANCHORS: Array<{ hue: number; weight: (s: Signals) => number }> = [
  { hue: 32, weight: (s) => s.smile }, // warm amber
  { hue: 52, weight: (s) => s.surprise }, // bright yellow
  { hue: 218, weight: (s) => s.frown }, // cold blue
  { hue: 105, weight: (s) => s.disgust }, // murky green
];

/** Neutral base drifts slowly through pastel violet/rose over time. */
function neutralHue(timeSec: number): number {
  return 275 + 40 * Math.sin(timeSec * 0.08);
}

/** Circular weighted mean of hues so 350° and 10° average to 0°, not 180°. */
function blendHues(entries: Array<{ hue: number; weight: number }>): number {
  let x = 0;
  let y = 0;
  for (const { hue, weight } of entries) {
    const rad = (hue * Math.PI) / 180;
    x += weight * Math.cos(rad);
    y += weight * Math.sin(rad);
  }
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * The core of the project: continuous interpolation from expression signals
 * to every visual parameter. No thresholds, no discrete states.
 */
export function mapToVisuals(
  s: Signals,
  surpriseVelocity: number,
  timeSec: number
): VisualParams {
  const neutralWeight = Math.max(0.08, 1 - s.activity * 1.6);
  const hue = blendHues([
    ...HUE_ANCHORS.map((a) => ({ hue: a.hue, weight: a.weight(s) })),
    { hue: neutralHue(timeSec), weight: neutralWeight },
  ]);

  // Frowning and disgust mute the palette; smiles and surprise saturate it.
  const saturation =
    55 + 35 * clamp01(s.smile + s.surprise) - 25 * clamp01(s.frown + s.disgust * 0.5);
  const lightness =
    58 + 20 * s.surprise + 8 * s.smile - 22 * s.frown - 10 * s.disgust;

  return {
    hue,
    saturation: Math.min(95, Math.max(18, saturation)),
    lightness: Math.min(85, Math.max(28, lightness)),
    spawnRate: 25 + 220 * clamp01(s.activity * 1.2),
    upwardBias: clamp01(s.smile + 0.6 * s.surprise) - clamp01(s.frown * 1.2),
    burst: clamp01(surpriseVelocity * 6),
    turbulence: clamp01(0.12 + 0.9 * s.disgust + 0.25 * s.tension),
    angularity: clamp01(s.tension * 1.4),
    speed: 0.35 + 1.6 * clamp01(s.activity + s.surprise),
    size: 2.2 + 3.5 * s.jawOpen + 2 * s.smile,
  };
}
