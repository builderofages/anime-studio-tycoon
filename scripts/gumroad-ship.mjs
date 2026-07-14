#!/usr/bin/env node
/** DISABLED — Gumroad ship is complete. Never opens Chrome or polls auth. */
import { frozenMessage, isGumroadFrozen } from "./_gumroad-guard.mjs";

console.log("gumroad-ship is disabled (distribution complete).\n");
console.log(frozenMessage());
console.log("\nPlay: https://anime-studio-tycoon.vercel.app/play");
if (!isGumroadFrozen()) console.log("\nTo re-enable automation, delete launch/GUMROAD_FROZEN.json (not recommended).");
process.exit(0);