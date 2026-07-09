# Anime Studio Tycoon — Path to 100%

**Current build:** 117 · Ship  
**Version:** 9.0.0  
**Gameplay completion:** 100%  
**UI/UX completion:** 100%  
**Launch readiness:** ~96% (Gumroad token + 7 products + Codemagic + device QA sign-off)

## Shipped layers (v1–v117)

| Build | Layer | Key systems |
|-------|-------|-------------|
| Core | Base | Staff, stars, chaos, prestige, IAP, 50+ achievements |
| 17–31 | AAA → Design | Ranks, season pass, dynasty, premium HUD, studio rating |
| 108–112 | Legion → Layout | Mobile HUD grid, desktop 720–900px shell |
| 113–114 | Audio → Soundtracks | Mute/sliders, 5 BGM tracks, tab crossfade |
| 115–116 | Premiere → Polish | Red-carpet BGM, silent start, drawer gameplay toggles |
| **117** | **Ship** | **Premiere + coach pathway i18n (8 langs), perf guards** |

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
| CI smoke tests (980+) | Auto | ✅ |
| Hook bridge (all layers live) | Auto | ✅ |
| Premiere + coach i18n (8 langs) | Auto | ✅ Build 117 |
| IAP + grant APIs | Auto | ✅ JWT/MINT on Vercel |
| Desktop Electron 9.0.0 | Auto | `npm run dist:mac` |
| Device QA (iPhone + Android) | You | `launch/DEVICE_QA.md` |
| Gumroad live keys | You | `GUMROAD_ACCESS_TOKEN` + 7 products |
| Codemagic iOS/Android | You | `launch/CODEMAGIC.md` |
| TestFlight / ASC upload | You | App Store Connect |
| Steam store page | You | `launch/STEAM_SUBMISSION.md` |

## Ship web

```bash
cd /Users/alexandermills/anime-studio
npm test && npm run test:sim && git push && vercel --prod --yes
npm run prepare-native   # sync www/ for TestFlight
```