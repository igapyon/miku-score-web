import fs from "node:fs";
import path from "node:path";

import {
  readRuntimeLock,
  runtimeCachePath,
  runtimeDownloadUrl,
  verifyRuntimeBytes,
} from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const args = parseArgs(process.argv.slice(2));
const lock = readRuntimeLock(ROOT);
const cachePath = runtimeCachePath(ROOT, lock);
const localRuntimePath = args.runtimePath ?? process.env.MIKU_SCORE_RUNTIME_FILE;

let bytes;
let sourceLabel;
if (localRuntimePath) {
  const resolved = path.resolve(localRuntimePath);
  bytes = fs.readFileSync(resolved);
  sourceLabel = resolved;
} else if (fs.existsSync(cachePath)) {
  const cached = fs.readFileSync(cachePath);
  try {
    verifyRuntimeBytes(cached, lock);
    bytes = cached;
    sourceLabel = cachePath;
  } catch {
    fs.rmSync(cachePath, { force: true });
  }
}

if (!bytes) {
  const url = runtimeDownloadUrl(lock);
  const response = await fetch(url, {
    headers: { "user-agent": "miku-score-web-runtime-fetch" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`miku-score runtime download failed: ${response.status} ${response.statusText} (${url})`);
  }
  bytes = Buffer.from(await response.arrayBuffer());
  sourceLabel = url;
}

verifyRuntimeBytes(bytes, lock);
fs.mkdirSync(path.dirname(cachePath), { recursive: true });
const temporaryPath = `${cachePath}.tmp-${process.pid}`;
fs.writeFileSync(temporaryPath, bytes);
fs.renameSync(temporaryPath, cachePath);
console.log(`[runtime:fetch] verified ${lock.release_tag} ${lock.asset_name}`);
console.log(`[runtime:fetch] source ${sourceLabel}`);

function parseArgs(argv) {
  if (argv.length === 0) return {};
  if (argv.length === 2 && argv[0] === "--runtime" && !argv[1].startsWith("--")) {
    return { runtimePath: argv[1] };
  }
  throw new Error("usage: node scripts/fetch-runtime.mjs [--runtime <local-runtime.mjs>]");
}
