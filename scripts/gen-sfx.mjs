#!/usr/bin/env node
/**
 * Generate lightweight WAV SFX into audio/ — mirrors in-game synth profiles.
 * Run: node scripts/gen-sfx.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "audio");
const SR = 44100;

mkdirSync(outDir, { recursive: true });

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  const path = join(outDir, name);
  writeFileSync(path, buf);
  console.log(`  wrote ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

function tone(freq, dur, type = "sine", peak = 0.5, t0 = 0) {
  const len = Math.ceil((t0 + dur) * SR);
  const out = new Float32Array(len);
  const start = Math.floor(t0 * SR);
  const end = Math.floor((t0 + dur) * SR);
  for (let i = start; i < end && i < len; i++) {
    const t = (i - start) / SR;
    const env = Math.exp(-t * 6) * (1 - Math.exp(-t * 80));
    let w;
    const ph = 2 * Math.PI * freq * t;
    if (type === "sine") w = Math.sin(ph);
    else if (type === "triangle") w = (2 / Math.PI) * Math.asin(Math.sin(ph));
    else if (type === "sawtooth") w = 2 * (t * freq - Math.floor(t * freq + 0.5));
    else w = Math.sign(Math.sin(ph));
    out[i] += w * peak * env;
  }
  return out;
}

function whoosh(dur, peak = 0.25, t0 = 0) {
  const len = Math.ceil((t0 + dur) * SR);
  const out = new Float32Array(len);
  const start = Math.floor(t0 * SR);
  const end = Math.floor((t0 + dur) * SR);
  for (let i = start; i < end && i < len; i++) {
    const t = (i - start) / SR;
    const env = Math.sin((Math.PI * t) / dur) * peak;
    out[i] += (Math.random() * 2 - 1) * env;
  }
  return out;
}

function mix(...bufs) {
  let len = 0;
  for (const b of bufs) len = Math.max(len, b.length);
  const out = new Float32Array(len);
  for (const b of bufs) for (let i = 0; i < b.length; i++) out[i] += b[i];
  for (let i = 0; i < len; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

const profiles = {
  hire: () => mix(tone(523.25, 0.12), tone(659.25, 0.15, "sine", 0.55, 0.1), tone(783.99, 0.2, "triangle", 0.45, 0.2)),
  greenlight: () => mix(tone(880, 0.08, "sine", 0.35, 0.05), whoosh(0.22, 0.2)),
  "first-greenlight": () =>
    mix(
      tone(392, 0.18, "triangle", 0.52),
      tone(523.25, 0.16, "triangle", 0.46, 0.07),
      tone(659.25, 0.14, "triangle", 0.4, 0.14),
      tone(783.99, 0.12, "triangle", 0.34, 0.21),
      tone(987.77, 0.1, "triangle", 0.28, 0.28),
      tone(1174.66, 0.24, "sine", 0.48, 0.38),
      whoosh(0.22, 0.18, 0.02)
    ),
  premiere: () =>
    mix(
      tone(392, 0.22, "triangle", 0.5),
      tone(493.88, 0.2, "triangle", 0.45, 0.09),
      tone(587.33, 0.18, "triangle", 0.4, 0.18),
      tone(783.99, 0.16, "triangle", 0.35, 0.27),
      whoosh(0.15, 0.15)
    ),
  claim: () => mix(tone(1046.5, 0.09), tone(1318.5, 0.12, "sine", 0.4, 0.04), tone(1567.98, 0.15, "triangle", 0.35, 0.08)),
  "tab-switch": () => mix(whoosh(0.12, 0.3), tone(320, 0.06, "sine", 0.18, 0.02)),
  "unlock-open": () =>
    mix(tone(440, 0.1), tone(554.37, 0.12, "triangle", 0.38, 0.08), tone(659.25, 0.16, "sine", 0.34, 0.16), whoosh(0.14, 0.2, 0.04)),
  "milestone-collect": () =>
    mix(
      tone(880, 0.1, "sine", 0.46),
      tone(1046.5, 0.1, "sine", 0.38, 0.05),
      tone(1318.5, 0.1, "sine", 0.3, 0.1),
      tone(1567.98, 0.2, "triangle", 0.4, 0.18),
      whoosh(0.1, 0.15, 0.1)
    ),
  error: () => mix(tone(180, 0.14, "sawtooth", 0.35), tone(140, 0.18, "square", 0.28, 0.06)),
};

console.log("Generating SFX WAV files…\n");
for (const [name, fn] of Object.entries(profiles)) {
  writeWav(`${name}.wav`, fn());
}
console.log("\nDone.");