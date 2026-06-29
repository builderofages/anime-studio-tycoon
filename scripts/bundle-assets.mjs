#!/usr/bin/env node
/**
 * Prepare native bundle: www/ + cap sync hint.
 */
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "..");

const prep = spawnSync("node", ["scripts/prepare-native.mjs"], {
  cwd: root,
  stdio: "inherit",
});

if (prep.status !== 0) process.exit(prep.status || 1);

const sync = spawnSync("npx", ["cap", "sync"], { cwd: root, stdio: "inherit" });
process.exit(sync.status === null ? 1 : sync.status);