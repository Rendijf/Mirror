import type { VisualParams } from "../types";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  saturation: number;
  lightness: number;
  size: number;
  /** 0 = circle, 1 = sharp shard; fixed at spawn time. */
  angular: number;
  rotation: number;
  spin: number;
}

/**
 * Particle system driven entirely by VisualParams. A cheap sin/cos flow
 * field provides organic motion; `turbulence` scales its influence.
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private spawnDebt = 0;
  maxParticles = 900;

  update(dt: number, p: VisualParams, w: number, h: number): void {
    this.spawn(dt, p, w, h);

    const t = performance.now() / 1000;
    for (const pt of this.particles) {
      // Flow field: two overlapping sine waves, scaled by turbulence.
      const fx =
        Math.sin(pt.y * 0.008 + t * 0.7) + Math.sin(pt.x * 0.005 - t * 0.4);
      const fy =
        Math.cos(pt.x * 0.008 + t * 0.6) + Math.sin(pt.y * 0.006 + t * 0.5);
      pt.vx += fx * p.turbulence * 60 * dt;
      pt.vy += fy * p.turbulence * 60 * dt;

      // Rising on joy, sinking on frowns.
      pt.vy -= p.upwardBias * 55 * dt;

      pt.vx *= 0.985;
      pt.vy *= 0.985;
      pt.x += pt.vx * p.speed * dt * 60;
      pt.y += pt.vy * p.speed * dt * 60;
      pt.rotation += pt.spin * dt;
      pt.life -= dt;
    }

    this.particles = this.particles.filter(
      (pt) => pt.life > 0 && pt.x > -50 && pt.x < w + 50 && pt.y > -50 && pt.y < h + 50
    );
  }

  private spawn(dt: number, p: VisualParams, w: number, h: number): void {
    this.spawnDebt += p.spawnRate * dt;
    const count = Math.floor(this.spawnDebt);
    this.spawnDebt -= count;

    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      // Bursts erupt from the center; calm states emit across a wide ring.
      const radius = p.burst > 0.15 ? 20 : 60 + Math.random() * Math.min(w, h) * 0.3;
      const speed = 0.4 + Math.random() * 1.2 + p.burst * 9;

      this.particles.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2 + Math.random() * 3,
        maxLife: 5,
        hue: p.hue + (Math.random() - 0.5) * 30,
        saturation: p.saturation,
        lightness: p.lightness + p.burst * 20,
        size: p.size * (0.5 + Math.random()),
        angular: p.angularity,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 4,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, globalAlpha = 1): void {
    for (const pt of this.particles) {
      const fade = Math.min(1, pt.life / 1.2);
      ctx.globalAlpha = fade * globalAlpha;
      ctx.fillStyle = `hsl(${pt.hue}, ${pt.saturation}%, ${pt.lightness}%)`;

      if (pt.angular > 0.35) {
        // Sharp triangular shard for tense expressions.
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation);
        const s = pt.size * 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, s);
        ctx.lineTo(-s * 0.7, s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  get count(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
    this.spawnDebt = 0;
  }
}
