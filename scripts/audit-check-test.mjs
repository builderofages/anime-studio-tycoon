#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Execute the actual CLI with mocked npm results: no registry calls or installs.
const source = readFileSync(new URL("audit-check.mjs", import.meta.url), "utf8")
  .replace(/^import .*;\r?\n/gm, "")
  .replace('const root = join(dirname(fileURLToPath(import.meta.url)), "..");', 'const root = "/project";');
const report = (total = 0, fixable = false) => ({
  status: total ? 1 : 0,
  stdout: JSON.stringify({
    metadata: { vulnerabilities: { total, high: total } },
    vulnerabilities: total ? { example: { fixAvailable: fixable } } : {},
  }),
});
function run(results) {
  const output = [];
  let calls = 0;
  let code;
  const exit = {};
  try {
    vm.runInNewContext(source, {
      spawnSync: () => results[calls++] || report(),
      join: (...parts) => parts.join("/"),
      console: { log: (...args) => output.push(args.join(" ")), error: (...args) => output.push(args.join(" ")) },
      process: { exit(value) { code = value; throw exit; } },
    });
  } catch (error) {
    if (error !== exit) throw error;
  }
  return { code, calls, output: output.join("\n") };
}

assert.equal(run([report(), report()]).code, 0, "clean reports pass");
assert.equal(run([report(1, false), report()]).code, 0, "valid non-fixable advisories retain existing policy");
const fixable = run([report(), report(1, true)]);
assert.equal(fixable.code, 1, "fixable desktop vulnerability fails");
assert.match(fixable.output, /desktop: 1 advisories/, "totals are not double-counted");

const errors = [
  { status: 1, stdout: JSON.stringify({ error: { code: "ENOLOCK", summary: "Missing lockfile" } }) },
  { status: 1, stdout: JSON.stringify({ error: { code: "ENOTFOUND", summary: "Registry unavailable" } }) },
  { status: null, error: new Error("npm executable unavailable") },
  { status: null, signal: "SIGTERM" },
  { status: 1, stdout: "not JSON" },
  { status: 0, stdout: "" },
  { status: 0, stdout: "{}" },
  { ...report(), status: 2 },
  { ...report(), status: 1 },
];
for (const error of errors) {
  for (const results of [[error], [report(), error]]) {
    const result = run(results);
    assert.equal(result.code, 1, "audit execution/report failures fail closed in either package");
    assert.doesNotMatch(result.output, /audit:check OK/, "no false green result");
  }
}
console.log("Audit CLI regressions passed: valid reports, fixable advisories, and 18 failure cases.");
