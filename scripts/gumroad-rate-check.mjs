#!/usr/bin/env node
/** Rate check — skipped when Gumroad distribution is frozen (no HTTP). */
import { frozenMessage, isGumroadFrozen } from "./_gumroad-guard.mjs";

if (isGumroadFrozen()) {
  console.log(frozenMessage());
  console.log("OK (frozen — no probe sent)");
  process.exit(0);
}

const url = process.argv[2] || "https://trainagent.gumroad.com/l/xmwvvi";
const r = await fetch(url, { redirect: "follow" });
if (r.status === 429) {
  console.error("Gumroad rate-limited (HTTP 429). Stop retrying.");
  process.exit(2);
}
if (!r.ok) {
  console.error(`Gumroad probe ${url} → HTTP ${r.status}`);
  process.exit(1);
}
console.log(`OK ${url} → ${r.status}`);