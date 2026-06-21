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

Lockfiles (`package-lock.json`, `desktop/package-lock.json`) are committed so
builds are reproducible and audits are deterministic.

## Note on client trust

Like most single-player idle games, the economy runs entirely client-side, so a
determined user can edit their own save. Real-money entitlements on native builds
are validated by the App Store / Google Play purchase flow. The web `?grant=`
convenience path is honor-system; server-side receipt verification is tracked as
a roadmap item before any competitive/online leaderboard ships.
