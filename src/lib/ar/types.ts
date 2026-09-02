// ============================================================
// AR tracking engine — shared types.
// Stage boundaries (input → detect → track → landmarks →
// segmentation → smoothing → transform → render → output) are
// expressed here so new filters can be added without touching
// the tracking core.
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

/** Normalised landmark (0..1 of frame) with optional depth + visibility. */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface BoundingBox {
  /** 0..1 of frame */
  x: number;
  y: number;
  w: number;
  h: number;
}

export type TargetKind = "person" | "object";

/** Raw per-frame observation coming out of the detection stage. */
export interface Observation {
  kind: TargetKind;
  box: BoundingBox;
  score: number;
  pose?: Landmark[];
  worldPose?: Landmark[];
  face?: Landmark[];
  /** 4x4 column-major matrix from the face landmarker (head orientation). */
  faceMatrix?: number[];
  hands?: { handedness: "Left" | "Right"; landmarks: Landmark[] }[];
  /** Index of this person inside the segmentation mask (0 = background). */
  maskIndex?: number;
}

export interface HeadOrientation {
  /** Radians. */
  yaw: number;
  pitch: number;
  roll: number;
}

/** A target after the tracking + smoothing stages. */
export interface TrackedTarget {
  /** Persistent across frames. */
  id: number;
  kind: TargetKind;
  box: BoundingBox;
  center: Vec2;
  /** Frame-space size relative to the first confident observation. */
  scale: number;
  /** Radians, derived from shoulder line (person) or motion (object). */
  rotation: number;
  /** Normalised units per second. */
  velocity: Vec2;
  /** Mean landmark z where available (negative = closer to camera). */
  depth: number;
  confidence: number;
  /** True while the target is being motion-predicted through a detection gap. */
  coasting: boolean;
  ageFrames: number;
  lastSeenAt: number;
  pose?: Landmark[];
  face?: Landmark[];
  head?: HeadOrientation;
  hands?: { handedness: "Left" | "Right"; landmarks: Landmark[] }[];
  maskIndex?: number;
}

/** Output of the segmentation stage (person pixels). */
export interface SegmentationFrame {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface FrameResult {
  timestamp: number;
  observations: Observation[];
  segmentation?: SegmentationFrame;
  inferenceMs: number;
}

/** Anchors an attachment to a body region / landmark cluster. */
export type AnchorId =
  | "forehead"
  | "face"
  | "eyes"
  | "mouth"
  | "head"
  | "neck"
  | "chest"
  | "torso"
  | "hips"
  | "leftHand"
  | "rightHand"
  | "leftFoot"
  | "rightFoot"
  | "leftShoulder"
  | "rightShoulder"
  | "fullBody"
  | "object";

export interface AnchorTransform {
  /** Pixels in output space. */
  x: number;
  y: number;
  /** Pixels. */
  width: number;
  height: number;
  /** Radians. */
  rotation: number;
  /** 0..1 — fades attachments out while coasting / low confidence. */
  alpha: number;
  depth: number;
}

export type AttachmentKind = "sprite" | "sequence" | "vector" | "mesh";

export interface ARAttachment {
  id: string;
  label: string;
  kind: AttachmentKind;
  anchor: AnchorId;
  /** Multiplier applied to the anchor's natural size. */
  scale?: number;
  /** Offset in anchor-relative units (1 = anchor width). */
  offset?: Vec2;
  rotationOffset?: number;
  /** Image / sprite-sheet URLs (animated PNG sequence when >1). */
  frames?: string[];
  fps?: number;
  /** Programmatic drawing for vector effects (trails, auras, fins…). */
  draw?: (
    ctx: CanvasRenderingContext2D,
    t: AnchorTransform,
    target: TrackedTarget,
    timeMs: number
  ) => void;
  /** Full-body skin swap texture used by the mesh-deformation renderer. */
  skinTexture?: string;
  /** Tint used when no texture is supplied. */
  tint?: string;
  premium?: boolean;
}

export interface EngineOptions {
  maxPeople?: number;
  /** Frames a target may be predicted for after detection loss. */
  coastFrames?: number;
  /** 0..1, higher = snappier / more jitter. */
  stickiness?: number;
  segmentation?: boolean;
  face?: boolean;
  hands?: boolean;
  /** Cap inference rate independently of render rate. */
  inferenceFps?: number;
}

export interface EngineStats {
  fps: number;
  inferenceMs: number;
  renderMs: number;
  targets: number;
  droppedFrames: number;
}
