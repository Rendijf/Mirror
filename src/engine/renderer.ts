import { ParticleSystem } from "./particles";
import type { VisualParams } from "../types";

/**
 * Owns the display canvas plus an offscreen trail buffer.
 *
 * The trail buffer is the "session painting": particles are stamped into it
 * at low opacity every frame and it is never cleared, so the finished image
 * encodes the entire session of expressions — not a single moment.
 */
export class Renderer {
  private particles = new ParticleSystem();
  private trail: HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  private trailPainted = false;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  // Adaptive quality: shrink the particle cap when the frame rate drops.
  private fpsSamples: number[] = [];
  private lastFpsCheck = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;

    this.trail = document.createElement("canvas");
    const trailCtx = this.trail.getContext("2d");
    if (!trailCtx) throw new Error("Canvas 2D not supported");
    this.trailCtx = trailCtx;
    this.resize();
  }

  resize(): void {
    const { clientWidth, clientHeight } = this.canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    if (this.canvas.width !== clientWidth || this.canvas.height !== clientHeight) {
      this.canvas.width = clientWidth;
      this.canvas.height = clientHeight;
    }
    // Compare against the trail's own size — the canvas may already be
    // sized correctly (e.g. a second Renderer on the same element).
    if (this.trail.width !== clientWidth || this.trail.height !== clientHeight) {
      const old = this.trail;
      this.trail = document.createElement("canvas");
      this.trail.width = clientWidth;
      this.trail.height = clientHeight;
      const ctx = this.trail.getContext("2d");
      if (!ctx) return;
      this.trailCtx = ctx;
      // Preserve the painting across resizes; a never-painted buffer has
      // nothing worth stretching, so skip the copy then.
      if (this.trailPainted) {
        this.trailCtx.drawImage(old, 0, 0, clientWidth, clientHeight);
      }
    }
  }

  tick(dt: number, params: VisualParams): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w === 0 || h === 0) return;

    this.adaptQuality(dt);
    this.particles.update(dt, params, w, h);

    // Stamp faint marks into the never-cleared session painting.
    if (this.particles.count > 0) this.trailPainted = true;
    this.particles.draw(this.trailCtx, 0.055);

    // Display = dark ground + accumulated painting + live particles on top.
    this.ctx.fillStyle = "#0b0b12";
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.drawImage(this.trail, 0, 0);
    this.particles.draw(this.ctx, 0.9);
  }

  private adaptQuality(dt: number): void {
    this.fpsSamples.push(1 / Math.max(dt, 1e-4));
    const now = performance.now();
    if (now - this.lastFpsCheck < 2000) return;
    this.lastFpsCheck = now;
    const fps =
      this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
    this.fpsSamples = [];
    if (fps < 30) {
      this.particles.maxParticles = Math.max(200, this.particles.maxParticles - 150);
    } else if (fps > 50 && this.particles.maxParticles < 900) {
      this.particles.maxParticles += 100;
    }
  }

  /** Full-resolution PNG of the session painting composite. */
  capture(): string {
    return this.canvas.toDataURL("image/png");
  }

  /** Downscaled JPEG for localStorage-friendly gallery thumbnails. */
  captureThumb(maxSize = 640): string {
    const scale = Math.min(1, maxSize / Math.max(this.canvas.width, this.canvas.height));
    const c = document.createElement("canvas");
    c.width = Math.round(this.canvas.width * scale);
    c.height = Math.round(this.canvas.height * scale);
    const ctx = c.getContext("2d");
    if (!ctx) return this.capture();
    ctx.drawImage(this.canvas, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  }

  resetPainting(): void {
    this.trailCtx.clearRect(0, 0, this.trail.width, this.trail.height);
    this.particles.clear();
    this.trailPainted = false;
  }

  get particleCount(): number {
    return this.particles.count;
  }
}
