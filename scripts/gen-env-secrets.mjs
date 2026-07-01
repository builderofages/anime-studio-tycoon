#!/usr/bin/env node
/** Generate secrets for Vercel env — paste output into Project Settings. */
import crypto from "crypto";

const jwt = crypto.randomBytes(32).toString("hex");
const mint = crypto.randomBytes(24).toString("hex");

console.log("Paste into Vercel → anime-studio-tycoon → Settings → Environment Variables:\n");
console.log(`GRANT_JWT_SECRET=${jwt}`);
console.log(`GRANT_MINT_SECRET=${mint}`);
console.log(`GRANT_REDIRECT_BASE=https://anime-studio-tycoon.vercel.app/`);
console.log("# GUMROAD_ACCESS_TOKEN=<from Gumroad Settings → Advanced>");
console.log("# GUMROAD_SELLER_ID=<your seller id>");
console.log("# APPLE_SHARED_SECRET=<App Store Connect>");
console.log("# GOOGLE_SA_JSON=<Play service account JSON>");
console.log("# GOOGLE_PACKAGE_NAME=com.trainyouragent.animestudiotycoon");