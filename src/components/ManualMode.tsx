import { useRef } from "react";
import { NEUTRAL_SIGNALS } from "../types";
import type { Signals } from "../types";
import { ArtCanvas } from "./ArtCanvas";
import type { Renderer } from "../engine/renderer";

interface Props {
  onCapture: (renderer: Renderer) => void;
  onSwitchToLive: () => void;
}

const SLIDERS: Array<{ key: keyof Signals; label: string }> = [
  { key: "smile", label: "Smile" },
  { key: "surprise", label: "Surprise" },
  { key: "frown", label: "Frown" },
  { key: "disgust", label: "Disgust" },
  { key: "tension", label: "Tension" },
  { key: "jawOpen", label: "Jaw open" },
];

/**
 * Camera-free fallback: the same mapping engine driven by sliders instead
 * of a face. Essential for jurors who can't or won't grant camera access.
 */
export function ManualMode({ onCapture, onSwitchToLive }: Props) {
  const signalsRef = useRef<Signals>({ ...NEUTRAL_SIGNALS });
  const rendererRef = useRef<Renderer | null>(null);

  const setSignal = (key: keyof Signals, value: number) => {
    const s = { ...signalsRef.current, [key]: value };
    s.activity = Math.max(
      s.smile,
      s.surprise,
      s.frown,
      s.disgust,
      s.tension,
      s.jawOpen
    );
    signalsRef.current = s;
  };

  return (
    <div className="stage">
      <ArtCanvas
        signalsRef={signalsRef}
        onRendererReady={(r) => (rendererRef.current = r)}
      />

      <div className="slider-panel">
        <div className="overlay-title">simulate expression</div>
        {SLIDERS.map(({ key, label }) => (
          <label key={key} className="slider-row">
            <span>{label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              defaultValue={0}
              onInput={(e) => setSignal(key, e.currentTarget.valueAsNumber)}
            />
          </label>
        ))}
      </div>

      <div className="toolbar">
        <button
          className="btn primary"
          onClick={() => rendererRef.current && onCapture(rendererRef.current)}
        >
          Capture painting
        </button>
        <button className="btn" onClick={() => rendererRef.current?.resetPainting()}>
          New canvas
        </button>
        <button className="btn subtle" onClick={onSwitchToLive}>
          Try camera mode
        </button>
      </div>
    </div>
  );
}
