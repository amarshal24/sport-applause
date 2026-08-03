/**
 * ISSUE-035 verification: parseStorageUrl + publish-path hygiene.
 * Run: node scripts/verify-signed-media.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcRoot = join(root, "src");

// Mirror of src/lib/signedMedia.ts parseStorageUrl (kept in sync for CI-less checks)
function parseStorageUrl(url) {
  if (!url) return null;
  const cleaned = url.split("#")[0];
  const m = cleaned.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

const publicUrl =
  "https://abc.supabase.co/storage/v1/object/public/posts/user1/123.mp4";
const signedUrl =
  "https://abc.supabase.co/storage/v1/object/sign/posts/user1/123.mp4?token=xyz";
const withHash = `${publicUrl}#t=0.1`;

assert(parseStorageUrl(publicUrl)?.bucket === "posts", "parse public bucket");
assert(parseStorageUrl(publicUrl)?.path === "user1/123.mp4", "parse public path");
assert(parseStorageUrl(signedUrl)?.bucket === "posts", "parse signed bucket");
assert(parseStorageUrl(signedUrl)?.path === "user1/123.mp4", "parse signed path");
assert(parseStorageUrl(withHash)?.path === "user1/123.mp4", "strip media hash fragment");
assert(parseStorageUrl("https://cdn.example.com/foo.mp4") === null, "non-storage URL returns null");
assert(parseStorageUrl("") === null, "empty URL returns null");

// No call-site getPublicUrl outside the storageRefUrl helper
const allowed = new Set([
  join(srcRoot, "lib", "signedMedia.ts").replace(/\\/g, "/"),
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(extname(p))) out.push(p);
  }
  return out;
}

const offenders = [];
for (const file of walk(srcRoot)) {
  const norm = file.replace(/\\/g, "/");
  if (allowed.has(norm)) continue;
  const text = readFileSync(file, "utf8");
  if (text.includes("getPublicUrl")) offenders.push(norm.slice(srcRoot.length + 1));
}

assert(offenders.length === 0, `no getPublicUrl outside signedMedia (${offenders.join(", ") || "none"})`);

const helper = readFileSync(join(srcRoot, "lib", "signedMedia.ts"), "utf8");
assert(helper.includes("export function storageRefUrl"), "storageRefUrl helper exported");
assert(helper.includes("createSignedUrl"), "toSignedUrl uses createSignedUrl");

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll ISSUE-035 checks passed.");
