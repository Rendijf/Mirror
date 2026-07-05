import { useEffect, useRef } from "react";
import { Renderer } from "../engine/renderer";
import { mapToVisuals } from "../engine/mapping";
import type { Signals } from "../types";

interface Props {
  /** Ref holding the latest signals; read every animation frame. */
  signalsRef: React.RefObject<Signals>;
  onRendererReady: (renderer: Renderer) => void;
}

/**
 * The artwork surface. Runs its own rAF loop, pulling the newest signals
 * from a ref so face tracking and rendering stay decoupled.
 */
export function ArtCanvas({ signalsRef, onRendererReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new Renderer(canvas);
    onRendererReady(renderer);

    let raf = 0;
    let last = performance.now();
    let prevSurprise = 0;
    const start = last;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      renderer.resize();

      const signals = signalsRef.current;
      const surpriseVelocity = Math.max(
        0,
        (signals.surprise - prevSurprise) / Math.max(dt, 1e-4)
      );
      prevSurprise = signals.surprise;

      const params = mapToVisuals(signals, surpriseVelocity, (now - start) / 1000);
      renderer.tick(dt, params);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => renderer.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="art-canvas" />;
}
