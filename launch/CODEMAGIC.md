# Codemagic — TestFlight & Play internal

Repo includes `codemagic.yaml` with two workflows:

| Workflow | Output | Publishing |
|----------|--------|------------|
| `ios-release` | `.ipa` | TestFlight (auto-submit) |
| `android-release` | `.aab` | Google Play internal track |

## Prerequisites

### iOS (Codemagic group: `app_store_connect`)

1. **App Store Connect API key** — Users & Access → Integrations → App Store Connect API
2. Add to Codemagic: Team settings → Integrations → **App Store Connect**
3. Codemagic group `app_store_connect` with credentials referenced in yaml
4. Bundle ID `com.trainyouragent.animestudiotycoon` registered in ASC
5. Set Vercel/env secrets for IAP before public TestFlight:
   - `APPLE_SHARED_SECRET`
   - `VALIDATOR_URL` → `https://anime-studio-tycoon.vercel.app/api/iap/validate`

### Android (groups: `google_play`, `keystore_credentials`)

1. Google Play service account JSON → Codemagic `google_play`
2. Upload keystore → `keystore_credentials` group
3. Package `com.trainyouragent.animestudiotycoon` created in Play Console

## Trigger a build

1. Push to `main` (already runs smoke tests in GitHub Actions)
2. [Codemagic](https://codemagic.io) → **Applications** → add repo `builderofages/anime-studio-tycoon`
3. Select workflow **`ios-release`** or **`android-release`**
4. **Start new build**

Build steps (from yaml):

```
npm ci → npm test → npm run prepare-native → cap sync → sign → ipa/aab
```

## After TestFlight upload

1. App Store Connect → TestFlight → add internal testers
2. Upload screenshots from `launch/store/`
3. Fill age rating questionnaire (4+ / simulation, no gambling with real money)
4. Privacy nutrition labels: **no data collected** (matches `privacy.html`)

## Local iOS sanity check (optional)

```bash
cd /Users/alexandermills/anime-studio
npm test && npm run prepare-native
npx cap add ios   # first time only
npx cap sync ios
npx cap open ios  # Xcode run on simulator
```