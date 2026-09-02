// ============================================================
// Pipeline stage 2/3: person detection + pose landmarks.
// Thin, reusable wrapper around MediaPipe PoseLandmarker so the
// worker (or any future consumer) never touches task setup.
// ============================================================

import {
  PoseLandmarker,
  type FilesetResolver,
  type MPMask,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { Landmark, Observation } from "@/lib/ar/types";

export const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export const toLandmarks = (
  pts: { x: number; y: number; z?: number; visibility?: number }[]
): Landmark[] => pts.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0, visibility: p.visibility }));

/** Bounding box from visible landmarks, padded for hair/head-top. */
export const boxFromLandmarks = (pts: Landmark[]) => {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of pts) {
    if ((p.visibility ?? 1) < 0.25) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (maxX <= minX || maxY <= minY) return null;
  const padY = (maxY - minY) * 0.09;
  return { x: minX, y: Math.max(0, minY - padY), w: maxX - minX, h: maxY - minY + padY };
};

const meanVisibility = (pts: Landmark[]) => {
  if (!pts.length) return 0;
  return pts.reduce((s, p) => s + (p.visibility ?? 1), 0) / pts.length;
};

export interface PoseTrackerOptions {
  maxPeople?: number;
  segmentation?: boolean;
  delegate?: "GPU" | "CPU";
}

export class PoseTracker {
  private constructor(private landmarker: PoseLandmarker) {}

  static async create(
    fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
    opts: PoseTrackerOptions = {}
  ) {
    const landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate: opts.delegate ?? "GPU" },
      runningMode: "VIDEO",
      numPoses: opts.maxPeople ?? 2,
      outputSegmentationMasks: opts.segmentation ?? false,
      minPoseDetectionConfidence: 0.4,
      minPosePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
    return new PoseTracker(landmarker);
  }

  /** Runs one frame; returns per-person observations and raw masks. */
  detect(
    image: ImageBitmap | HTMLVideoElement,
    timestampMs: number
  ): { observations: Observation[]; masks?: MPMask[] } {
    const res: PoseLandmarkerResult = this.landmarker.detectForVideo(
      image as unknown as HTMLVideoElement,
      Math.round(timestampMs)
    );
    const observations: Observation[] = [];
    res.landmarks?.forEach((lm, i) => {
      const pts = toLandmarks(lm);
      const box = boxFromLandmarks(pts);
      if (!box) return;
      observations.push({
        kind: "person",
        box,
        score: meanVisibility(pts),
        pose: pts,
        worldPose: res.worldLandmarks?.[i] ? toLandmarks(res.worldLandmarks[i]) : undefined,
        maskIndex: i,
      });
    });
    return { observations, masks: res.segmentationMasks ?? undefined };
  }

  close() {
    this.landmarker.close();
  }
}
