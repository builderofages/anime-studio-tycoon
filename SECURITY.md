# Security

## Reporting

Found a vulnerability? Email **trainyouragent@gmail.com**. Please don't open a public issue for sensitive reports.

## Dependency advisories (Dependabot)

The app that ships to players is a static web bundle (`index.html`, `strings.js`)
plus thin native wrappers. **No `node_modules` are shipped to end users** — npm
packages are used only at *build time* (Capacitor CLI for iOS/Android, Electron +
electron-builder for the desktop/Steam build).

**Build 74 (2026-07):** Root `package.json` uses npm `overrides` for patched
`tar`, `minimatch`, and `uuid`. Both mobile/Capacitor and desktop `npm audit`
report **0 vulnerabilities** (desktop bumped to Electron 43+).

| Advisory | Where | Shipped to users? | Status |
|---|---|---|---|
| `node-tar`, `minimatch`, `uuid` | Capacitor / assets toolchain | No (build only) | **Patched via overrides** (root) |
| Electron GHSA-* | `desktop/` devDependency | No (Steam build only) | **Patched** (Electron ^43.1.0) |

These do **not** affect the runtime security of the game, which:

- collects no personal data and has no backend (see `privacy.html`),
- stores progress only in local storage / app storage,
- renders only first-party, controlled strings (no user-generated content is
  interpolated into the DOM).

Lockfiles remain **gitignored**; `overrides` pin patched transitive versions at
install time. Run `npm run audit:check` after dependency changes.

## IAP & web purchase validation

**Native (iOS/Android):** `iap.js` posts receipts to `/api/iap/validate` (deploy
`server/validate.js`). Set `APPLE_SHARED_SECRET`, `GOOGLE_SA_JSON`, and
`GOOGLE_PACKAGE_NAME` in Vercel env before shipping paid builds.

**Web:** Raw `?grant=` / `?unlock=` URLs are **disabled on production**. Buyers
receive signed `?pt=` tokens minted via `POST /api/grant/mint` (Gumroad webhook
or manual). Set `GRANT_JWT_SECRET` and `GRANT_MINT_SECRET` in Vercel.

**Client trust:** Single-player economy is client-side; saves can be edited locally.
Server validation applies to **real-money entitlements only**.
