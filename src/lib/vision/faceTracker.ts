// ============================================================
// Pipeline stage 4: face landmarks + head orientation.
// Also owns the association of faces (and hands) to the person
// observations produced by the pose stage.
// ============================================================

import {
  FaceLandmarker,
  HandLandmarker,
  type FilesetResolver,
  type FaceLandmarkerResult,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { HeadOrientation, Landmark, Observation } from "@/lib/ar/types";
import { toLandmarks, boxFromLandmarks } from "./poseTracker";

export const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
export const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** 4x4 column-major facial transformation matrix → yaw/pitch/roll. */
export const matrixToEuler = (m?: number[]): HeadOrientation | undefined => {
  if (!m || m.length < 16) return undefined;
  const r00 = m[0];
  const r10 = m[1];
  const r20 = m[2];
  const r21 = m[6];
  const r22 = m[10];
  const sy = Math.sqrt(r00 * r00 + r10 * r10);
  if (sy < 1e-6) return { yaw: 0, pitch: Math.atan2(-r20, sy), roll: 0 };
  return {
    roll: Math.atan2(r10, r00),
    pitch: Math.atan2(-r20, sy),
    yaw: Math.atan2(r21, r22),
  };
};

export class FaceTracker {
  private constructor(
    private face: FaceLandmarker,
    private hand: HandLandmarker | null
  ) {}

  static async create(
    fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
    opts: { maxFaces?: number; hands?: boolean; delegate?: "GPU" | "CPU" } = {}
  ) {
    const delegate = opts.delegate ?? "GPU";
    const face = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate },
      runningMode: "VIDEO",
      numFaces: opts.maxFaces ?? 2,
      outputFacialTransformationMatrixes: true,
    });
    let hand: HandLandmarker | null = null;
    if (opts.hands) {
      hand = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: HAND_MODEL, delegate },
        runningMode: "VIDEO",
        numHands: (opts.maxFaces ?? 2) * 2,
      });
    }
    return new FaceTracker(face, hand);
  }

  detect(image: ImageBitmap | HTMLVideoElement, timestampMs: number) {
    const ts = Math.round(timestampMs);
    const img = image as unknown as HTMLVideoElement;
    return {
      faces: this.face.detectForVideo(img, ts),
      hands: this.hand ? this.hand.detectForVideo(img, ts) : null,
    };
  }

  close() {
    this.face.close();
    this.hand?.close();
  }
}

/** Attaches faces to the nearest person; promotes face-only detections. */
export const mergeFaces = (obs: Observation[], faces: FaceLandmarkerResult | null) => {
  if (!faces?.faceLandmarks?.length) return;
  const matrixAt = (i: number) => {
    const m = faces.facialTransformationMatrixes?.[i];
    return m ? Array.from(m.data) : undefined;
  };

  if (!obs.length) {
    faces.faceLandmarks.forEach((lm, i) => {
      const pts = toLandmarks(lm);
      const box = boxFromLandmarks(pts);
      if (!box) return;
      obs.push({
        kind: "person",
        box: { x: box.x - box.w * 0.4, y: box.y - box.h * 0.5, w: box.w * 1.8, h: box.h * 3 },
        score: 0.7,
        face: pts,
        faceMatrix: matrixAt(i),
      });
    });
    return;
  }

  faces.faceLandmarks.forEach((lm, i) => {
    const pts = toLandmarks(lm);
    const nose = pts[1] ?? pts[0];
    let best: Observation | null = null;
    let bestD = Infinity;
    for (const o of obs) {
      if (o.face) continue;
      const cx = o.box.x + o.box.w / 2;
      const d = Math.hypot(cx - nose.x, o.box.y + o.box.h * 0.15 - nose.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (!best) return;
    best.face = pts;
    best.faceMatrix = matrixAt(i);
  });
};

/** Attaches hands to the nearest person by wrist proximity. */
export const mergeHands = (obs: Observation[], hands: HandLandmarkerResult | null) => {
  if (!hands?.landmarks?.length || !obs.length) return;
  hands.landmarks.forEach((lm, i) => {
    const pts: Landmark[] = toLandmarks(lm);
    const wrist = pts[0];
    let best: Observation | null = null;
    let bestD = Infinity;
    for (const o of obs) {
      const cx = o.box.x + o.box.w / 2;
      const cy = o.box.y + o.box.h / 2;
      const d = Math.hypot(cx - wrist.x, cy - wrist.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    if (!best) return;
    const handedness = (hands.handedness?.[i]?.[0]?.categoryName as "Left" | "Right") ?? "Right";
    best.hands = [...(best.hands ?? []), { handedness, landmarks: pts }];
  });
};
