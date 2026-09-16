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
  function abort(reason) {
    console.error(`npm audit failed in ${cwd}: ${reason}`);
    process.exit(1);
  }
  if (r.error) abort(r.error.message);
  if (r.signal || r.status === null) abort(`process interrupted (${r.signal || "no exit status"})`);
  let data;
  try {
    data = JSON.parse(r.stdout);
  } catch {
    abort("invalid or empty JSON response");
  }
  if (data?.error) abort(`${data.error.code || "error"}: ${data.error.summary || "audit could not complete"}`);
  // npm exits 1 for valid vulnerability reports; do not confuse that with a failed audit.
  if (r.status !== 0 && r.status !== 1) abort(`unexpected exit status ${r.status}`);
  const meta = data?.metadata?.vulnerabilities;
  if (!meta || !Number.isInteger(meta.total) || meta.total < 0 ||
      !data.vulnerabilities || typeof data.vulnerabilities !== "object" || Array.isArray(data.vulnerabilities)) {
    abort("missing vulnerability report metadata");
  }
  if (r.status === 1 && meta.total === 0) abort("nonzero exit status without a vulnerability report");
  return data;
}

let failed = 0;
for (const cwd of [root, join(root, "desktop")]) {
  const data = audit(cwd);
  const meta = data.metadata?.vulnerabilities || {};
  const total = meta.total;
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
