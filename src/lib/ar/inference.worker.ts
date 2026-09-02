// ============================================================
// Pipeline stages 2-4, off the main thread.
// detection → pose landmarks → face/hands → segmentation.
// Task setup lives in src/lib/vision/*; this worker only pumps
// frames through them and ships results back to the manager.
// ============================================================

/// <reference lib="webworker" />

import { FilesetResolver } from "@mediapipe/tasks-vision";
import { PoseTracker } from "@/lib/vision/poseTracker";
import { FaceTracker, mergeFaces, mergeHands } from "@/lib/vision/faceTracker";
import { buildLabelMask } from "@/lib/vision/segmenter";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

let pose: PoseTracker | null = null;
let face: FaceTracker | null = null;
let busy = false;

interface InitMsg {
  type: "init";
  maxPeople: number;
  face: boolean;
  hands: boolean;
  segmentation: boolean;
}
interface FrameMsg {
  type: "frame";
  bitmap: ImageBitmap;
  timestamp: number;
}
type InMsg = InitMsg | FrameMsg | { type: "dispose" };

const post = (msg: unknown, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer);

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;

  if (msg.type === "init") {
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        pose = await PoseTracker.create(fileset, {
          maxPeople: msg.maxPeople,
          segmentation: msg.segmentation,
          delegate,
        });
        if (msg.face || msg.hands) {
          face = await FaceTracker.create(fileset, {
            maxFaces: msg.maxPeople,
            hands: msg.hands,
            delegate,
          });
        }
        post({ type: "ready", delegate });
        return;
      } catch (err) {
        pose?.close();
        face?.close();
        pose = null;
        face = null;
        if (delegate === "CPU") {
          post({ type: "error", message: (err as Error)?.message ?? "Failed to load vision models" });
        }
      }
    }
    return;
  }

  if (msg.type === "dispose") {
    pose?.close();
    face?.close();
    pose = null;
    face = null;
    return;
  }

  if (msg.type !== "frame") return;
  if (!pose || busy) {
    msg.bitmap.close();
    if (busy) post({ type: "dropped" });
    return;
  }

  busy = true;
  const started = performance.now();
  try {
    const { observations, masks } = pose.detect(msg.bitmap, msg.timestamp);
    if (face) {
      const { faces, hands } = face.detect(msg.bitmap, msg.timestamp);
      mergeFaces(observations, faces);
      mergeHands(observations, hands);
    }
    const segmentation = buildLabelMask(masks);

    post(
      {
        type: "result",
        timestamp: msg.timestamp,
        observations,
        segmentation,
        inferenceMs: performance.now() - started,
      },
      segmentation ? [segmentation.data.buffer] : []
    );
  } catch (err) {
    post({ type: "error", message: (err as Error)?.message ?? "Inference failed" });
  } finally {
    msg.bitmap.close();
    busy = false;
  }
};

export {};
