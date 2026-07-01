# Anime Studio Tycoon — Path to 100%

**Current build:** 23 · Final  
**Gameplay completion:** 100%  
**Launch readiness:** ~60% (store ops + Higgsfield auth for fresh assets)

## Shipped layers (v1–v8)

| Build | Layer | Key systems |
|-------|-------|-------------|
| Core | Base | Staff, stars, chaos, prestige, IAP, 40+ achievements |
| 17 | AAA | Ranks, season pass, sakura FX |
| 18 | Gameplay+ | Daily goals, merch, rivals, pity, smart cast |
| 19 | Ultra | Pipeline, bidding, market share, audio settings |
| 20 | Endless | Moods, chemistry, risk, cour, difficulty |
| 21 | Empire | Named staff, war room, blend, banner, insurance |
| 22 | Studio+ | 10× scout, spark shop, polish, relations, templates |
| 23 | Final | OST, streaming deals, Influence, recovery minigame, crisis recaps, scroll fix, pro guide |

## Art & media (Higgsfield CLI)

No separate Higgsfield MCP — use the **`higgsfield` CLI** (same API).

**Auth required (one-time, interactive):**

```bash
higgsfield auth login
```

**Generate all launch assets:**

```bash
chmod +x scripts/generate-launch-assets.sh
./scripts/generate-launch-assets.sh
node scripts/collect-higgsfield-urls.mjs
```

Outputs land in `launch/store/` (icon, Steam capsule, screenshots, trailer keyframe/clip).

Existing in-game art uses CloudFront CDN (`hf_*` assets in `index.html`).

## Platform launch checklist

| Task | Owner | Status |
|------|-------|--------|
| Web (Vercel + Pages) | Auto | ✅ |
| CI smoke tests | Auto | ✅ |
| Gameplay v8 Final | Auto | ✅ |
| Higgsfield store assets | You | `higgsfield auth login` then run scripts |
| Codemagic iOS/Android | You | Trigger + ASC credentials |
| TestFlight beta | You | App Store Connect |
| Steam Electron build | Auto | `cd desktop && npm run dist:mac` |
| Steam store page | You | Capsule + trailer + tags |
| Age rating / privacy labels | You | Apple + Google forms |
| IAP receipt hardening | Dev | `security/iap-hardening` branch |
| Dependabot vulns | Dev | npm audit fix |

## One command to ship web

```bash
cd /Users/alexandermills/anime-studio
npm test && git push && vercel --prod --yes
```