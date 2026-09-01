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
   * Frame pump: throttled to `inferenceFps` and gated on the worker
   * being free, so inference never runs more often than useful.
   */
  private pump = () => {
    if (!this.running) return;
    this.timer = requestAnimationFrame(this.pump);

    const video = this.video;
    const worker = this.worker;
    if (!video || !worker || video.readyState < 2 || this.pumping) return;

    const now = performance.now();
    const minGap = 1000 / this.opts.inferenceFps;
    if (now - this.lastInferenceAt < minGap) return;
    this.lastInferenceAt = now;

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

  private handleMessage(msg: {
    type: string;
    message?: string;
    dropped?: boolean;
  } & Partial<FrameResult>) {
    switch (msg.type) {
      case "ready":
        this.emit("ready");
        break;
      case "error":
        this.emit("error", msg.message);
        break;
      case "dropped":
        this.stats.droppedFrames++;
        break;
      case "result": {
        const t = (msg.timestamp ?? performance.now()) / 1000;
        this.state.targets = this.tracker.update(msg.observations ?? [], t);
        this.state.segmentation = msg.segmentation;
        this.state.lastResultAt = t;
        this.stats.inferenceMs = msg.inferenceMs ?? 0;
        break;
      }
    }
  }
}
