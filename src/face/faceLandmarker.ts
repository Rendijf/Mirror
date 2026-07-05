import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { BlendshapeMap } from "../types";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let instance: FaceLandmarker | null = null;

/** Loads the MediaPipe Face Landmarker once and caches it. */
export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (instance) return instance;
  const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
  instance = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
    runningMode: "VIDEO",
    numFaces: 1,
  });
  return instance;
}

/**
 * Runs detection on the current video frame and returns the 52 blendshape
 * coefficients, or null if no face is visible.
 */
export function detectBlendshapes(
  landmarker: FaceLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): BlendshapeMap | null {
  const result = landmarker.detectForVideo(video, timestampMs);
  const categories = result.faceBlendshapes?.[0]?.categories;
  if (!categories || categories.length === 0) return null;
  const map: BlendshapeMap = {};
  for (const c of categories) map[c.categoryName] = c.score;
  return map;
}
