#!/usr/bin/env node
/** Regenerate scene BGM loops from audio/bgm.m4a (requires ffmpeg). */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "audio/bgm.m4a");
if (!existsSync(src)) {
  console.error("Missing", src);
  process.exit(1);
}

const tracks = [
  ["bgm-produce.m4a", '-af "atempo=1.08,treble=g=5,apad=whole_dur=30" -t 30'],
  ["bgm-market.m4a", '-stream_loop -1 -ss 8 -t 30 -af "equalizer=f=800:width_type=o:width=2:g=4,equalizer=f=2000:width_type=o:width=2:g=3,equalizer=f=120:width_type=o:width=2:g=-2"'],
  ["bgm-premiere.m4a", '-t 30 -af "highpass=f=180,volume=1.25,treble=g=3"'],
  ["bgm-chill.m4a", '-af "atempo=0.92,lowpass=f=2800" -t 30'],
];

for (const [out, args] of tracks) {
  const dest = join(root, "audio", out);
  console.log("→", out);
  execSync(
    `ffmpeg -y -i "${src}" ${args} -c:a aac -b:a 256k -profile:a aac_low "${dest}"`,
    { stdio: "inherit" }
  );
}
console.log("Done — 4 BGM scene tracks.");