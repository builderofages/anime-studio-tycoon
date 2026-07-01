# Anime Studio Tycoon — Path to 100%

**Current build:** 22 · Studio+  
**Gameplay completion:** ~92%  
**Launch readiness:** ~55% (needs store ops + Higgsfield assets)

## Shipped layers (v1–v7)

| Build | Layer | Key systems |
|-------|-------|-------------|
| Core | Base | Staff, stars, chaos, prestige, IAP, 40+ achievements |
| 17 | AAA | Ranks, season pass, sakura FX |
| 18 | Gameplay+ | Daily goals, merch, rivals, pity, smart cast |
| 19 | Ultra | Pipeline, bidding, market share, audio settings |
| 20 | Endless | Moods, chemistry, risk, cour, difficulty |
| 21 | Empire | Named staff, war room, blend, banner, insurance |
| 22 | Studio+ | 10× scout, spark shop, polish, relations, templates, records |

## Remaining gameplay (~8%)

- OST / theme song production add-on
- Licensing/streaming recurring contracts
- Second prestige currency (Influence)
- Troubled production recovery minigame
- Post-crisis recap cards
- Full scroll preservation on all tabs
- Guided tutorial for energy/chaos/casting

## Art & media (Higgsfield)

**Auth required:** `hf auth login`

Then run:

```bash
chmod +x scripts/generate-launch-assets.sh
./scripts/generate-launch-assets.sh
```

Generates: app icon, Steam capsule, 2 store screenshots, trailer keyframe (+ optional 6s clip).

Existing in-game art uses CloudFront CDN (`hf_*` assets). Optional: bundle locally under `assets/` for offline native.

## Platform launch checklist

| Task | Owner | Status |
|------|-------|--------|
| Web (Vercel + Pages) | Auto | ✅ |
| CI smoke tests (58) | Auto | ✅ |
| Codemagic iOS/Android | You | Trigger + ASC credentials |
| TestFlight beta | You | App Store Connect |
| Steam Electron build | Auto | `cd desktop && npm run dist:mac` |
| Steam store page | You | Capsule + trailer + tags |
| Age rating / privacy labels | You | Apple + Google forms |
| IAP receipt hardening | Dev | `security/iap-hardening` branch |
| Dependabot vulns (16) | Dev | npm audit fix |

## One command to ship beta

```bash
# After hf auth login + assets generated:
cd /Users/alexandermills/anime-studio
npm test && git push && vercel --prod --yes
# Codemagic: trigger ios_release workflow
```