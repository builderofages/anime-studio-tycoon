# Security

## Reporting

Found a vulnerability? Email **trainyouragent@gmail.com**. Please don't open a public issue for sensitive reports.

## Dependency advisories (Dependabot)

The app that ships to players is a static web bundle (`index.html`, `strings.js`)
plus thin native wrappers. **No `node_modules` are shipped to end users** — npm
packages are used only at *build time* (Capacitor CLI for iOS/Android, Electron +
electron-builder for the desktop/Steam build).

The currently-flagged advisories are all in those **build-time toolchains** and
have **no upstream fix available**:

| Advisory | Where | Shipped to users? | Fixable now? |
|---|---|---|---|
| `node-tar` (GHSA-r6q2-hw4h-h46w, GHSA-vmf3-w455-68vh) | `@capacitor/cli`, `@capacitor/assets`, `electron-builder` → `app-builder-lib` / `dmg-builder` | No (build only) | No upstream fix |
| `uuid` <11.1.1 (GHSA-w5hq-g745-h8pq) | `@capacitor/cli` → `xcode` → `uuid` | No (build only) | Constrained by `xcode`; no clean bump |

These are tracked and will be picked up automatically when Capacitor /
electron-builder release patched transitive deps. They do **not** affect the
runtime security of the game, which:

- collects no personal data and has no backend (see `privacy.html`),
- stores progress only in local storage / app storage,
- renders only first-party, controlled strings (no user-generated content is
  interpolated into the DOM).

Lockfiles are intentionally **not** committed: pinning the full transitive tree
only multiplies the visible (unfixable, build‑only) advisories without reducing
real risk. The build uses `npm ci || npm install`, so it resolves fine without a
committed lockfile. We'll commit one once the upstream toolchains ship patched
transitive deps.

## IAP & web purchase validation

**Native (iOS/Android):** `iap.js` posts receipts to `/api/iap/validate` (deploy
`server/validate.js`). Set `APPLE_SHARED_SECRET`, `GOOGLE_SA_JSON`, and
`GOOGLE_PACKAGE_NAME` in Vercel env before shipping paid builds.

**Web:** Raw `?grant=` / `?unlock=` URLs are **disabled on production**. Buyers
receive signed `?pt=` tokens minted via `POST /api/grant/mint` (Gumroad webhook
or manual). Set `GRANT_JWT_SECRET` and `GRANT_MINT_SECRET` in Vercel.

**Client trust:** Single-player economy is client-side; saves can be edited locally.
Server validation applies to **real-money entitlements only**.
