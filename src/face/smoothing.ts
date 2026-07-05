import type { BlendshapeMap } from "../types";

/**
 * Exponential moving average over the full blendshape vector.
 * Prevents per-frame jitter from flickering through the artwork.
 */
export class BlendshapeSmoother {
  private state: BlendshapeMap = {};
  private alpha: number;

  constructor(alpha = 0.25) {
    this.alpha = alpha;
  }

  update(raw: BlendshapeMap): BlendshapeMap {
    for (const key of Object.keys(raw)) {
      const prev = this.state[key] ?? raw[key];
      this.state[key] = prev + this.alpha * (raw[key] - prev);
    }
    return { ...this.state };
  }

  reset(): void {
    this.state = {};
  }
}
