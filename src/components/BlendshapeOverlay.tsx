import { useEffect, useState } from "react";
import type { BlendshapeMap } from "../types";

interface Props {
  blendshapesRef: React.RefObject<BlendshapeMap>;
}

const POLL_MS = 120;
const TOP_N = 8;

/**
 * Live readout of the strongest blendshape coefficients — makes the raw
 * data pipeline visible without affecting render performance.
 */
export function BlendshapeOverlay({ blendshapesRef }: Props) {
  const [top, setTop] = useState<Array<[string, number]>>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const entries = Object.entries(blendshapesRef.current)
        .filter(([name]) => name !== "_neutral")
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_N);
      setTop(entries);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [blendshapesRef]);

  if (top.length === 0) return null;

  return (
    <div className="overlay">
      <div className="overlay-title">face signal</div>
      {top.map(([name, value]) => (
        <div key={name} className="overlay-row">
          <span className="overlay-label">{name}</span>
          <span className="overlay-bar">
            <span
              className="overlay-fill"
              style={{ width: `${Math.round(value * 100)}%` }}
            />
          </span>
          <span className="overlay-value">{value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
