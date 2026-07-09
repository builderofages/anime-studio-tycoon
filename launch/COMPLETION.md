# Anime Studio Tycoon — 100% Engineering Complete

**Current build:** 118 · Complete  
**Version:** 9.0.0  
**Gameplay:** 100%  
**UI/UX:** 100%  
**Engineering launch readiness:** **100%** (`npm run launch-readiness`)  
**Distribution go-live:** ~55% (Gumroad extended SKUs + Vercel secrets + TestFlight)

## Verify anytime

```bash
cd /Users/alexandermills/anime-studio
npm test                    # 990+ smoke + sim
npm run test:web-qa         # automated web device QA
npm run launch-readiness    # engineering vs distribution score
npm run verify-gumroad      # 6 live + 7 to create
npm run launch-preflight
```

Reports: `launch/LAUNCH_READINESS.json` · `launch/DEVICE_QA_AUTOMATED.json` · `launch/GUMROAD_STATUS.json`

## Engineering (100% — automated)

| Gate | Status |
|------|--------|
| Web Vercel production | ✅ |
| 990+ smoke + sim tests | ✅ |
| Premiere + coach + hub i18n (8 langs) | ✅ Build 117–118 |
| Automated web device QA | ✅ `test:web-qa` |
| Native `www/` bundle | ✅ `prepare-native` |
| Grant JWT/MINT APIs | ✅ |
| Store assets + desktop dist | ✅ |
| Codemagic yaml + CI workflow | ✅ |
| Launch guides | ✅ |

## Distribution (your credentials)

| Task | Command / doc |
|------|----------------|
| Create 7 Gumroad products | `launch/GUMROAD_PRODUCTS.md` → `npm run verify-gumroad` |
| Vercel `GUMROAD_ACCESS_TOKEN` + `GUMROAD_SELLER_ID` | `launch/ENV_CHECKLIST.md` |
| Vercel `APPLE_SHARED_SECRET` | `launch/TESTFLIGHT_CHECKLIST.md` §2 |
| Codemagic TestFlight | `launch/CODEMAGIC.md` → **ios-release** |
| Physical device QA | `launch/DEVICE_QA.md` §1–8 |
| Steam store page | `launch/STEAM_SUBMISSION.md` |

### One-liner after you have Gumroad token

```bash
vercel env add GUMROAD_ACCESS_TOKEN production
vercel env add GUMROAD_SELLER_ID production
npm run verify-gumroad
vercel --prod --yes
```

## Ship web

```bash
npm test && npm run test:sim && git push && vercel --prod --yes
npm run prepare-native
```