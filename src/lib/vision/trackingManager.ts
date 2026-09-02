// ============================================================
// Pipeline orchestrator (stages 1 → 5).
// frame input → worker inference → association/tracking →
// smoothing → persistent tracking state.
//
// This class owns ALL high-frequency data. Nothing here touches
// React state: consumers read `manager.state` from a ref inside
// their own rAF loop, or subscribe to throttled stat updates.
// ============================================================

import { MultiTargetTracker } from "@/lib/ar/tracker";
import type {
  EngineOptions,
  EngineStats,
  FrameResult,
  SegmentationFrame,
  TrackedTarget,
} from "@/lib/ar/types";
import InferenceWorker from "@/lib/ar/inference.worker?worker";

export interface TrackingState {
  targets: TrackedTarget[];
  segmentation?: SegmentationFrame;
  /** Timestamp (s) of the last inference result. */
  lastResultAt: number;
}

type StatusListener = (s: {
  status: "idle" | "loading" | "ready" | "error";
  message?: string;
}) => void;

export class TrackingManager {
  /** Read this from a render loop — it mutates in place, never via React. */
  readonly state: TrackingState = { targets: [], lastResultAt: 0 };
  readonly stats: EngineStats = {
    fps: 0,
    inferenceMs: 0,
    renderMs: 0,
    targets: 0,
    droppedFrames: 0,
  };

  private worker: Worker | null = null;
  private tracker: MultiTargetTracker;
  private video: HTMLVideoElement | null = null;
  private running = false;
  private pumping = false;
  private lastInferenceAt = 0;
  private frameTimes: number[] = [];
  private statusListeners = new Set<StatusListener>();
  private opts: Required<EngineOptions>;
  private timer: number | null = null;

  constructor(opts: EngineOptions = {}) {
    this.opts = {
      maxPeople: opts.maxPeople ?? 2,
      coastFrames: opts.coastFrames ?? 14,
      stickiness: opts.stickiness ?? 0.55,
      segmentation: opts.segmentation ?? true,
      face: opts.face ?? true,
      hands: opts.hands ?? false,
      inferenceFps: opts.inferenceFps ?? 30,
    };
    this.tracker = new MultiTargetTracker({
      coastFrames: this.opts.coastFrames,
      stickiness: this.opts.stickiness,
      maxTargets: this.opts.maxPeople,
    });
  }

  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private emit(status: "idle" | "loading" | "ready" | "error", message?: string) {
    if (status === "error") console.error("[vision]", message);
    this.statusListeners.forEach((fn) => fn({ status, message }));
  }

  /** Boots the worker + models. Safe to call once per manager. */
  async init() {
    if (this.worker) return;
    this.emit("loading");
    const worker = new InferenceWorker();
    this.worker = worker;
    worker.onmessage = (e: MessageEvent) => this.handleMessage(e.data);
    worker.onerror = (e) => this.emit("error", e.message || "Vision worker crashed");
    worker.postMessage({
      type: "init",
      maxPeople: this.opts.maxPeople,
      face: this.opts.face,
      hands: this.opts.hands,
      segmentation: this.opts.segmentation,
    });
  }

  setSource(video: HTMLVideoElement | null) {
    this.video = video;
    this.tracker.reset();
    this.state.targets = [];
    this.state.segmentation = undefined;
  }

  setStickiness(v: number) {
    this.opts.stickiness = v;
    this.tracker.setStickiness(v);
  }

  setInferenceFps(fps: number) {
    this.opts.inferenceFps = Math.max(5, Math.min(60, fps));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.pump();
  }

  stop() {
    this.running = false;
    if (this.timer) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stop();
    this.worker?.postMessage({ type: "dispose" });
    this.worker?.terminate();
    this.worker = null;
    this.localPose?.close();
    this.localFace?.close();
    this.localPose = null;
    this.localFace = null;
    this.statusListeners.clear();
  }

  /** Called by the render loop to keep the FPS counter honest. */
  noteRenderedFrame(now: number, renderMs: number) {
    this.frameTimes.push(now);
    while (this.frameTimes.length && now - this.frameTimes[0] > 1000) this.frameTimes.shift();
    this.stats.fps = this.frameTimes.length;
    this.stats.renderMs = renderMs;
    this.stats.targets = this.state.targets.length;
  }

  /**
   * Frame pump: throttled to `inferenceFps` and gated on the previous
   * inference finishing, so we never run detection more often than useful.
   */
  private pump = () => {
    if (!this.running) return;
    this.timer = requestAnimationFrame(this.pump);

    const video = this.video;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
    if (this.pumping) return;

    const now = performance.now();
    const minGap = 1000 / this.opts.inferenceFps;
    if (now - this.lastInferenceAt < minGap) return;
    this.lastInferenceAt = now;

    if (this.localPose) {
      this.runLocal(video, now);
      return;
    }

    const worker = this.worker;
    if (!worker || !this.workerReady) return;
    this.pumping = true;
    createImageBitmap(video)
      .then((bitmap) => {
        worker.postMessage({ type: "frame", bitmap, timestamp: now }, [bitmap]);
      })
      .catch(() => undefined)
      .finally(() => {
        this.pumping = false;
      });
  };

  /** Main-thread inference path (used when the worker cannot host wasm). */
  private runLocal(video: HTMLVideoElement, now: number) {
    const pose = this.localPose;
    if (!pose) return;
    this.pumping = true;
    const started = performance.now();
    try {
      const { observations, masks } = pose.detect(video, now);
      if (this.localFace) {
        const { faces, hands } = this.localFace.detect(video, now);
        mergeFaces(observations, faces);
        mergeHands(observations, hands);
      }
      this.ingest({
        timestamp: now,
        observations,
        segmentation: buildLabelMask(masks),
        inferenceMs: performance.now() - started,
      });
    } catch {
      this.stats.droppedFrames++;
    } finally {
      this.pumping = false;
    }
  }

  private async initLocalFallback() {
    if (this.localPose) return;
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        this.localPose = await PoseTracker.create(fileset, {
          maxPeople: this.opts.maxPeople,
          segmentation: this.opts.segmentation,
          delegate,
        });
        if (this.opts.face || this.opts.hands) {
          this.localFace = await FaceTracker.create(fileset, {
            maxFaces: this.opts.maxPeople,
            hands: this.opts.hands,
            delegate,
          });
        }
        this.emit("ready");
        return;
      } catch (err) {
        this.localPose?.close();
        this.localFace?.close();
        this.localPose = null;
        this.localFace = null;
        if (delegate === "CPU") {
          this.emit("error", (err as Error)?.message ?? "Could not load the vision models");
        }
      }
    }
  }

  /** Tracking + smoothing stages, shared by both inference paths. */
  private ingest(result: FrameResult) {
    const t = result.timestamp / 1000;
    this.state.targets = this.tracker.update(result.observations, t);
    this.state.segmentation = result.segmentation;
    this.state.lastResultAt = t;
    this.stats.inferenceMs = result.inferenceMs;
  }

  private handleMessage(
    msg: { type: string; message?: string } & Partial<FrameResult>
  ) {
    switch (msg.type) {
      case "ready":
        this.workerReady = true;
        this.emit("ready");
        break;
      case "error":
        // Some browsers/bundlers can't host the wasm runtime inside a
        // worker — fall back to main-thread inference instead of failing.
        this.workerReady = false;
        this.worker?.terminate();
        this.worker = null;
        this.emit("loading");
        this.initLocalFallback();
        break;
      case "dropped":
        this.stats.droppedFrames++;
        break;
      case "result":
        this.ingest({
          timestamp: msg.timestamp ?? performance.now(),
          observations: msg.observations ?? [],
          segmentation: msg.segmentation,
          inferenceMs: msg.inferenceMs ?? 0,
        });
        break;
    }
  }
}

