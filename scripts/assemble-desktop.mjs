#!/usr/bin/env node
/** Verify desktop/Steam bundle has all game assets listed in electron-builder config. */
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "desktop/package.json"), "utf8"));
const filter = pkg.build?.extraResources?.[0]?.filter || [];
let ok = true;
for (const f of filter) {
  const p = join(root, f);
  if (!existsSync(p)) {
    console.error("MISSING:", f);
    ok = false;
  } else {
    console.log("OK:", f);
  }
}
if (!ok) process.exit(1);
console.log("Desktop bundle assets verified:", filter.length);