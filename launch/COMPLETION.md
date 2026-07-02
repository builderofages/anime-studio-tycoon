# Anime Studio Tycoon — Path to 100%

**Current build:** 31 · Design  
**Version:** 9.0.0  
**Gameplay completion:** 100%  
**UI/UX completion:** 100%  
**Launch readiness:** ~94% (Gumroad token + 7 products + Codemagic)

## Shipped layers (v1–v30)

| Build | Layer | Key systems |
|-------|-------|-------------|
| Core | Base | Staff, stars, chaos, prestige, IAP, 50+ achievements |
| 17 | AAA | Ranks, season pass, sakura FX |
| 18 | Gameplay+ | Daily goals, merch, rivals, pity, smart cast |
| 19 | Ultra | Pipeline, bidding, market share, audio settings |
| 20 | Endless | Moods, chemistry, risk, cour, difficulty |
| 21 | Empire | Named staff, war room, blend, banner, insurance |
| 22 | Studio+ | 10× scout, spark shop, polish, relations, templates |
| 23 | Final | OST, streaming, Influence, recovery minigame, crisis recaps |
| 24 | AAA S-Tier | Dynasty score, briefings, festivals, contracts, syndication |
| 25 | Legend | Dynasty perks, career ledger, rival festivals, rank ceremonies |
| 26 | Premium HUD | Command HUD, pathway rail, tab badges, command dock |
| 27 | Complete | Tab heroes, produce grid, star cards, store shelf, quest chest |
| 28 | Studio Stars | JW-style 5★ rating, pillar progress, project gates |
| 29 | Fixed | Hook bridge — all expansion layers actually run |
| 30 | Polish | Crisis snooze, rating achievements, rating coach, pathway hints |
| 31 | Design | Unified dark UI, rating in HUD, slimmer layout, dark modals |

## Art & media

```bash
npm run fetch-launch-assets   # CDN art → launch/store/
npm run prepare-store-icons   # PWA + iOS icon
cd desktop && npm run dist:mac  # Steam .dmg
```

## Platform launch checklist

| Task | Owner | Status |
|------|-------|--------|
| Web (Vercel) | Auto | ✅ |
| CI smoke tests (126+) | Auto | ✅ |
| Hook bridge (all layers live) | Auto | ✅ |
| Crisis spam + snooze | Auto | ✅ |
| Studio star rating (JW-style) | Auto | ✅ |
| IAP + grant APIs | Auto | ✅ JWT/MINT on Vercel |
| Desktop Electron 9.0.0 | Auto | `npm run dist:mac` |
| Gumroad live keys | You | `GUMROAD_ACCESS_TOKEN` + 7 products |
| Codemagic iOS/Android | You | `launch/CODEMAGIC.md` |
| TestFlight / ASC upload | You | App Store Connect |
| Steam store page | You | `launch/STEAM_SUBMISSION.md` |

## Ship web

```bash
cd /Users/alexandermills/anime-studio
npm test && git push && vercel --prod --yes
```