# TestFlight submit checklist

10 steps from green repo → internal testers. Bundle ID: `com.trainyouragent.animestudiotycoon`.

## 1. Preflight locally

```bash
npm test
npm run prepare-native
npm run launch-preflight
```

Confirm: `www/logic.js`, `www/iap.js`, `iap.js` in `www/index.html`, `www/og-share.jpg`, `www/play.html`, `www/robots.txt`, `www/sitemap.xml`, `www/iap.js` has absolute `VALIDATOR_URL`, build **109+**, return-hub present.

## 2. Vercel IAP secrets

In Vercel → Settings → Environment Variables (production):

- `APPLE_SHARED_SECRET` — App Store Connect → App → App Information → Shared Secret
- `VALIDATOR_URL` = `https://anime-studio-tycoon.vercel.app/api/iap/validate`

See `launch/ENV_CHECKLIST.md` for grant/Gumroad vars.

## 3. App Store Connect app record

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** → New App
2. Name: **Anime Studio Tycoon**
3. Bundle ID: `com.trainyouragent.animestudiotycoon`
4. SKU: `ast-ios-2026` (any unique string)
5. Primary language: English (U.S.)

## 4. Codemagic integration

1. [Codemagic](https://codemagic.io) → add repo `builderofages/anime-studio-tycoon`
2. Team settings → Integrations → **App Store Connect** API key
3. Environment group **`app_store_connect`** with that integration
4. Confirm `codemagic.yaml` workflow **`ios-release`** is visible

Details: `launch/CODEMAGIC.md`.

## 5. Store icons (optional but recommended)

```bash
npm run prepare-store-icons
```

Upload `launch/store/app-icon.png` and screenshots from `launch/store/` when filling ASC metadata.

## 6. Trigger iOS build

Codemagic → **ios-release** → **Start new build** on `main`.

Pipeline: `npm ci` → `npm test` → `prepare-native` → `cap sync ios` → sign → `.ipa` → TestFlight.

## 7. Wait for processing

App Store Connect → your app → **TestFlight**. Build status moves **Processing** → **Ready to Test** (often 10–30 min).

## 8. Compliance & export

On the build row:

- **Missing Compliance** → No encryption beyond Apple OS APIs (or answer per your legal review)
- **Export Compliance** → typically “No” for standard HTTPS only

## 9. Internal testing group

1. TestFlight → **Internal Testing** → create group (e.g. “Studio team”)
2. Add build **109+**
3. Add testers (ASC users with App Manager / Developer role)
4. Testers install via **TestFlight** app

## 10. Smoke test on device

On a physical iPhone:

- [ ] Cold launch → splash → playable studio
- [ ] Return hub after simulated absence (or fresh install + continue save)
- [ ] Audio on first tap (Web Audio unlock)
- [ ] Store tab loads; IAP sheet opens (sandbox account)
- [ ] Settings → privacy link opens `privacy.html`

**Ship gate:** all preflight checks pass + Codemagic green + one device smoke test.

Next: external beta or App Store review → `launch/STORE_LISTING.md`.