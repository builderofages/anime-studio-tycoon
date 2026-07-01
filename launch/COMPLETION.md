# Anime Studio Tycoon — Path to 100%

**Current build:** 23 · Final  
**Gameplay completion:** 100%  
**Launch readiness:** ~85% (Gumroad token + 7 products + Codemagic)

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

## Art & media

**CDN fallback (ready now):**

```bash
npm run fetch-launch-assets
```

Downloads icon, Steam capsule, screenshots → `launch/store/`.

**Fresh Higgsfield gens (optional):**

```bash
higgsfield auth login
./scripts/generate-launch-assets.sh
node scripts/collect-higgsfield-urls.mjs
```

Store copy: `launch/STORE_LISTING.md`  
Gumroad wiring: `launch/GUMROAD_SETUP.md`  
TestFlight: `launch/CODEMAGIC.md`

## Platform launch checklist

| Task | Owner | Status |
|------|-------|--------|
| Web (Vercel + Pages) | Auto | ✅ |
| CI smoke tests | Auto | ✅ |
| Gameplay v8 Final | Auto | ✅ |
| Store assets (CDN) | Auto | `npm run fetch-launch-assets` ✅ |
| IAP + web grant APIs | Auto | JWT/MINT secrets on Vercel ✅ — add `GUMROAD_ACCESS_TOKEN` |
| Higgsfield fresh assets | You | `higgsfield auth login` (optional) |
| Codemagic iOS/Android | You | Trigger + ASC credentials |
| TestFlight beta | You | App Store Connect |
| Steam Electron build | Auto | `cd desktop && npm run dist:mac` |
| Steam store page | You | `launch/STORE_LISTING.md` + assets |
| Age rating / privacy labels | You | Apple + Google forms |
| Dependabot vulns | N/A | Build-time only — see SECURITY.md |

## One command to ship web

```bash
cd /Users/alexandermills/anime-studio
npm test && git push && vercel --prod --yes
```