import { openDB } from "idb";
import type { Project } from "./model";
const db = () =>
  openDB("usportz-local-editing", 1, {
    upgrade(d) {
      d.createObjectStore("projects");
    },
  });
export async function saveProject(userId: string, p: Project) {
  const d = await db();
  try {
    await d.put("projects", { ...p, savedAt: Date.now() }, userId);
  } finally {
    d.close();
  }
}
export async function recoverProject(userId: string): Promise<Project | null> {
  const d = await db();
  try {
    return (await d.get("projects", userId)) ?? null;
  } finally {
    d.close();
  }
}
export async function clearProject(userId: string) {
  const d = await db();
  try {
    await d.delete("projects", userId);
  } finally {
    d.close();
  }
}
