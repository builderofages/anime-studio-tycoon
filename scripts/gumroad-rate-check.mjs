#!/usr/bin/env node
/** One request — detect Gumroad/Cloudflare rate limit before batch scripts run. */
const url = process.argv[2] || "https://trainagent.gumroad.com/l/xmwvvi";
const r = await fetch(url, { redirect: "follow" });
if (r.status === 429) {
  console.error("Gumroad rate-limited (HTTP 429). Stop retrying — wait 2–6h or use phone hotspot.");
  process.exit(2);
}
if (!r.ok) {
  console.error(`Gumroad probe ${url} → HTTP ${r.status}`);
  process.exit(1);
}
console.log(`OK ${url} → ${r.status}`);