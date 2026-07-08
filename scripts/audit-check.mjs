#!/usr/bin/env node
/**
 * Fail CI only when npm audit reports fixable runtime issues.
 * Build-tool transitive advisories with overrides are allowed.
 */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function audit(cwd) {
  const r = spawnSync("npm", ["audit", "--json"], { cwd, encoding: "utf8" });
  let data;
  try {
    data = JSON.parse(r.stdout || "{}");
  } catch {
    console.error("npm audit failed in", cwd);
    process.exit(1);
  }
  return data;
}

let failed = 0;
for (const cwd of [root, join(root, "desktop")]) {
  const data = audit(cwd);
  const meta = data.metadata?.vulnerabilities || {};
  const total = Object.values(meta).reduce((a, n) => a + (n || 0), 0);
  const fixable = (data.vulnerabilities && Object.values(data.vulnerabilities).filter((v) => v.fixAvailable).length) || 0;
  const label = cwd === root ? "root" : "desktop";
  console.log(`${label}: ${total} advisories (${fixable} with npm fix available)`);
  if (total > 0 && fixable > 0) failed++;
}

if (failed) {
  console.error("Run npm audit fix in affected package roots.");
  process.exit(1);
}
console.log("audit:check OK — no fixable advisories remain");
process.exit(0);