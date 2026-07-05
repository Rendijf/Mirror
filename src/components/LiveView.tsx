import { useEffect, useRef, useState } from "react";
import {
  loadFaceLandmarker,
  detectBlendshapes,
} from "../face/faceLandmarker";
import { BlendshapeSmoother } from "../face/smoothing";
import { deriveSignals } from "../engine/mapping";
import { NEUTRAL_SIGNALS } from "../types";
import type { BlendshapeMap, Signals } from "../types";
import { ArtCanvas } from "./ArtCanvas";
import { BlendshapeOverlay } from "./BlendshapeOverlay";
import type { Renderer } from "../engine/renderer";

interface Props {
  onCapture: (renderer: Renderer) => void;
  onSwitchToManual: () => void;
}

type Status =
  | { kind: "loading"; step: string }
  | { kind: "running" }
  | { kind: "error"; message: string };

function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError")
      return "Camera access was denied. You can allow it in your browser settings — or try manual mode below.";
    if (err.name === "NotFoundError")
      return "No camera was found on this device. Try manual mode below.";
    if (err.name === "NotReadableError")
      return "The camera is in use by another application.";
  }
  return "Could not start the camera. Try manual mode below.";
}

/**
 * Camera mode: webcam → MediaPipe blendshapes → smoothing → signals.
 * Video frames never leave the browser; only the artwork is displayed.
 */
export function LiveView({ onCapture, onSwitchToManual }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const signalsRef = useRef<Signals>({ ...NEUTRAL_SIGNALS });
  const blendshapesRef = useRef<BlendshapeMap>({});
  const rendererRef = useRef<Renderer | null>(null);
  const [status, setStatus] = useState<Status>({
    kind: "loading",
    step: "Loading face model…",
  });
  const [faceVisible, setFaceVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        const landmarker = await loadFaceLandmarker();
        if (cancelled) return;
        setStatus({ kind: "loading", step: "Requesting camera…" });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus({ kind: "running" });

        const smoother = new BlendshapeSmoother();
        let lastVideoTime = -1;
        let lastFaceSeen = performance.now();

        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (video.currentTime === lastVideoTime) return;
          lastVideoTime = video.currentTime;

          const raw = detectBlendshapes(landmarker, video, performance.now());
          if (raw) {
            lastFaceSeen = performance.now();
            setFaceVisible(true);
            const smoothed = smoother.update(raw);
            blendshapesRef.current = smoothed;
            signalsRef.current = deriveSignals(smoothed);
          } else if (performance.now() - lastFaceSeen > 1500) {
            setFaceVisible(false);
            // Ease back to the calm neutral state instead of freezing.
            const s = signalsRef.current;
            signalsRef.current = {
              smile: s.smile * 0.95,
              surprise: s.surprise * 0.95,
              frown: s.frown * 0.95,
              disgust: s.disgust * 0.95,
              tension: s.tension * 0.95,
              jawOpen: s.jawOpen * 0.95,
              activity: s.activity * 0.95,
            };
          }
        };
        raf = requestAnimationFrame(loop);
      } catch (err) {
        if (!cancelled) setStatus({ kind: "error", message: cameraErrorMessage(err) });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="stage">
      <video ref={videoRef} className="hidden-video" playsInline muted />
      <ArtCanvas
        signalsRef={signalsRef}
        onRendererReady={(r) => (rendererRef.current = r)}
      />

      {status.kind === "running" && (
        <BlendshapeOverlay blendshapesRef={blendshapesRef} />
      )}

      {status.kind === "loading" && (
        <div className="stage-message">
          <div className="spinner" />
          <p>{status.step}</p>
        </div>
      )}

      {status.kind === "error" && (
        <div className="stage-message">
          <p>{status.message}</p>
          <button className="btn" onClick={onSwitchToManual}>
            Use manual mode instead
          </button>
        </div>
      )}

      {status.kind === "running" && !faceVisible && (
        <div className="face-hint">No face in view — the painting is resting.</div>
      )}

      {status.kind === "running" && (
        <div className="toolbar">
          <button
            className="btn primary"
            onClick={() => rendererRef.current && onCapture(rendererRef.current)}
          >
            Capture painting
          </button>
          <button
            className="btn"
            onClick={() => rendererRef.current?.resetPainting()}
          >
            New canvas
          </button>
          <button className="btn subtle" onClick={onSwitchToManual}>
            Manual mode
          </button>
        </div>
      )}
    </div>
  );
}
