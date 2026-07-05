# Mirror

**Not a photo of your face — a painting of your last two minutes.**

Mirror is a portrait that can only exist through technology. It reads ~50
continuous facial micro-signals (blendshapes) from your webcam in real time
and turns them into generative art that remembers your entire session.

## Concept

Most "emotion art" projects classify faces into a handful of labels
(happy / sad / angry / …) and switch between presets. Mirror deliberately
does not:

- **Continuous blendshapes instead of emotion labels.** MediaPipe's Face
  Landmarker outputs 52 blendshape coefficients per frame ("brow raised:
  0.73", "left mouth corner: 0.41", …). Every visual parameter — hue,
  saturation, particle count, motion direction, turbulence, shape
  angularity — is interpolated continuously from this high-dimensional
  facial fingerprint. There are no thresholds and no discrete states, so
  mixed and subtle expressions produce their own unique imagery.
- **A session memory instead of a snapshot.** Live particles stamp faint
  marks into a trail buffer that is never cleared. The finished image
  encodes the whole session of expressions, not a single moment.

## How expressions map to art

| Facial signal (blendshape cluster) | Visual effect |
|---|---|
| Mouth corners up (smile) | Warm amber palette, rising, expanding particles |
| Brows + eyes wide (surprise) | Radial burst from the center, brightness spike |
| Brows down + mouth corners down (frown) | Cold muted blues, slow sinking motion |
| Squinted eyes + wrinkled nose | Murky greens, swirling turbulent flow |
| Pressed lips / tense jaw | Sharp angular shards instead of round particles |
| Neutral / low activity | Calm pastel drift through violet and rose |

All signals blend simultaneously — a skeptical half-smile paints something
neither a smile nor a frown would.

## Privacy by design

All face analysis runs **entirely in your browser** (client-side ML via
WebAssembly/GPU). No video, image, or face data ever leaves your device.
Captured paintings are stored in `localStorage` only.

## No camera? No problem

The intro screen offers a **manual mode** with sliders that feed the same
mapping engine, so the artwork can be explored without granting camera
access.

## Running locally

```bash
npm install
npm run dev     # development server
npm run build   # production build in dist/
```

Requires Node.js 20+.

## Tech stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) on [Vite](https://vite.dev)
- [MediaPipe Tasks Vision — Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (Google) for real-time blendshape estimation
- Canvas 2D API for the particle renderer and trail buffer (no rendering framework)

## Credits

- **@mediapipe/tasks-vision** — © Google, Apache-2.0. Face Landmarker model
  (`face_landmarker.task`) and WASM runtime are loaded from Google's CDN.
- **React**, **react-dom** — © Meta, MIT.
- **Vite** — © VoidZero and contributors, MIT.

## Architecture

```
Camera (getUserMedia)
  → MediaPipe Face Landmarker (52 blendshapes, per video frame)
    → Smoothing layer (exponential moving average — no flicker)
      → Signal derivation (blendshape clusters → 6 continuous signals)
        → Mapping engine (signals → color / motion / shape / chaos)
          → Particle renderer (Canvas 2D)
          → Trail buffer (never cleared → "painting of the session")
            → Capture (PNG/JPEG snapshot → local gallery)
```
