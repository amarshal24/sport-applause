import model from "@/assets/models/magic-touch.asset.json";
import type { InteractiveSegmenterLegacy } from "@mediapipe/tasks-vision";

export class MotionSegmenter {
  private task: InteractiveSegmenterLegacy | null = null;
  private loading: Promise<void> | null = null;
  private disposed = false;
  async select(video: HTMLVideoElement, x: number, y: number) {
    if (!this.loading) this.loading = (async () => {
      const { FilesetResolver, InteractiveSegmenterLegacy } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
      const response = await fetch(model.url);
      if (!response.ok) throw new Error("Could not load the object-selection model");
      const modelAssetBuffer = new Uint8Array(await response.arrayBuffer());
      if (String.fromCharCode(...modelAssetBuffer.slice(4, 8)) !== "TFL3") throw new Error("The object-selection model did not load. Try the hosted preview or use manual selection.");
      const task = await InteractiveSegmenterLegacy.createFromOptions(files, { baseOptions: { modelAssetPath: model.url }, outputCategoryMask: true, outputConfidenceMasks: false });
      if (this.disposed) { task.close(); return; }
      this.task = task;
    })().catch(error => { this.loading = null; throw error; });
    await this.loading;
    if (!this.task || this.disposed) throw new Error("Object selection is unavailable");
    const result = this.task.segment(video, { keypoint: { x: x / 100, y: y / 100 } });
    try {
      const mask = result.categoryMask;
      if (!mask) throw new Error("No object mask was returned");
      const data = mask.getAsUint8Array();
      const preview = document.createElement("canvas"); preview.width = mask.width; preview.height = mask.height;
      const ctx = preview.getContext("2d"); if (!ctx) throw new Error("Mask preview unavailable");
      const image = ctx.createImageData(mask.width, mask.height);
      let minX = mask.width, minY = mask.height, maxX = 0, maxY = 0, count = 0;
      // Magic Touch's selected-object category is 0; 255 is background.
      const tint = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
      ctx.fillStyle = `hsl(${tint})`; ctx.fillRect(0, 0, 1, 1);
      const rgb = ctx.getImageData(0, 0, 1, 1).data;
      for (let i = 0; i < data.length; i++) if (data[i] === 0) {
        const px = i % mask.width, py = Math.floor(i / mask.width);
        minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); count++;
        image.data[i * 4] = rgb[0]; image.data[i * 4 + 1] = rgb[1]; image.data[i * 4 + 2] = rgb[2]; image.data[i * 4 + 3] = 95;
      }
      if (!count) throw new Error("No object found at this point. Select again or use manual tracking.");
      ctx.putImageData(image, 0, 0);
      return { mask: preview, size: Math.max(2, Math.min(60, Math.max((maxX - minX) / mask.width, (maxY - minY) / mask.height) * 100)) };
    } finally { result.close(); }
  }
  dispose() { this.disposed = true; this.task?.close(); this.task = null; }
}