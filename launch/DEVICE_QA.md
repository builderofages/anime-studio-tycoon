# Device QA — iPhone & Android smoke test

Structured manual pass before TestFlight external beta or Play internal track. Run after `npm test`, `npm run prepare-native`, and `npm run launch-preflight` are green.

**Build gate:** build **108+** · Legion
**URLs:** [Play](https://anime-studio-tycoon.vercel.app/play) · [OG card](https://anime-studio-tycoon.vercel.app/og-share.jpg)

---

## Devices to cover

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS | Safari 16+ on iPhone SE (small) | Safari on iPhone 15/16 (notch) |
| Android | Chrome on mid-range (720p) | Chrome on Pixel / Samsung (gesture nav) |
| Native | TestFlight build | Play internal APK (Capacitor `www/`) |

Use one **fresh install** and one **returning save** per platform.

---

## Pre-flight (both platforms)

- [ ] `npm test` — smoke + playtest audit pass
- [ ] `npm run test:sim` — honest-flow VM sim pass
- [ ] `npm run prepare-native` — `www/v5-idle-feel.js`, `www/og-share.jpg`, absolute `VALIDATOR_URL` in `www/iap.js`
- [ ] Build tag shows **build 113 · Audio** in footer / What's New
- [ ] ⚙️ Settings → Sound: mute toggle + music/SFX sliders work; drawer stays open while adjusting

---

## iOS Safari regression (Build 108)

Automated smoke asserts `bindAudioGestureUnlock`, `primeHtml5Audio`, `-webkit-fill-available`, and `100dvh` in `ast-v5.css`. Manual pass on a notch iPhone:

| Case | Action | Expected |
|------|--------|----------|
| Viewport | Cold load `/play` in Safari | No double scrollbars; app fills screen (`100dvh` + `-webkit-fill-available` fallback); no rubber-band on `body` |
| Notch | Start screen + in-game HUD | Top chrome clears notch (`--safe-t` on `#app`); tab dock clears home indicator (`--safe-b` on `#command-dock`); achievement toast below notch |
| Input zoom | Focus studio name, language, store redeem fields | No page zoom (all inputs/selects ≥ **16px**); keyboard does not hide focused field (overlay scroll + `focusin` scroll) |
| Audio | Fresh tab, no prior tap | Silent until first gesture |
| Audio unlock | First tap Play / tab / hire | `primeHtml5Audio()` runs; tab/hire chime audible; no sustained `AudioContext suspended` errors |
| Modal scroll | Open start screen on iPhone SE | Long start card scrolls inside overlay; Collect / Play remain reachable above keyboard |

**Pass if:** all six cases Pass on Safari iOS 16+.

---

## 1. Cold launch

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Kill app / close tab; relaunch `/play` or native icon | Splash → start screen or resume save without blank screen |
| 1.2 | Tap **Play** (honest ¥1,500) | Studio loads; produce tab active; no JS alert |
| 1.3 | Optional: **Demo** from start | Inflated yen; all tabs reachable |

**Pass if:** playable within ~5s on LTE; no infinite spinner.

---

## 2. Return hub

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Play 2–3 min; background app 30+ min (or tweak save `lastActive` in dev) | On return, **Return hub** overlay batches offline ¥ / fans |
| 2.2 | Tap **Collect** | Overlay closes; resources update; subtle collect SFX |
| 2.3 | Re-open app within 1 min | Return hub does **not** spam again |

**Pass if:** hub shows once per absence; collect celebration fires.

---

## 3. Audio (mobile unlock)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Fresh session before any tap | No audio yet (iOS policy) |
| 3.2 | First tap on hire / tab / greenlight | Web Audio unlocks; tab-switch or hire chime audible |
| 3.3 | Toggle sound in settings (if off) | SFX respect mute |

**Pass if:** first intentional gesture produces sound; no console `AudioContext` suspended errors.

---

## 4. IAP sandbox (native or Store tab)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Open **Store** tab | SKU list loads; balance hero visible |
| 4.2 | Tap a consumable / pass (sandbox account signed in) | Platform purchase sheet opens |
| 4.3 | Cancel purchase | No grant; no crash |
| 4.4 | Complete sandbox purchase (optional) | Gems / pass applied once; idempotent on restore |

**Pass if:** sheet opens; `iap.js` does not log validator 503 on production URL.

---

## 5. Share & OG preview

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Start screen **Share** or in-game share milestone | System share sheet opens |
| 5.2 | Paste link in iMessage / Slack preview | Card shows `og-share.jpg`, title, description |
| 5.3 | Hit milestone (100 fans) if time permits | Share milestone modal + `milestone-collect` SFX |

**Pass if:** preview image is `og-share.jpg`, not a broken or generic icon.

---

## 6. Tab unlock rings

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Fresh honest save — only Produce + Staff unlocked | Locked tabs show ring progress % |
| 6.2 | Release first anime | Studio tab ring completes; unlock modal + `unlock-open` chime |
| 6.3 | Progress toward Stars / Market | Ring fills smoothly on dock icons |

**Pass if:** `tab-unlock-ring-on` visible on locked tabs; no truncated coach labels.

---

## 7. Greenlight burst (first premiere path)

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Hire animator → greenlight first project | `first-greenlight` arpeggio on first slot start |
| 7.2 | Observe slot card | `celebrateGreenlightSlot` burst / glow on confirm |
| 7.3 | Complete first premiere | First-premiere ribbon; fan toast |

**Pass if:** first greenlight feels distinct from repeat greenlights.

---

## 8. PWA install (mobile web only)

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Safari **Add to Home Screen** or Chrome **Install app** | Banner or coach nudge appears when eligible |
| 8.2 | Launch from home screen icon | Standalone mode; no browser chrome |
| 8.3 | Dismiss banner | Does not re-spam same session |

**Pass if:** `maybeShowPwaInstallBanner` path works; manifest icon correct.

---

## Pass / fail log (copy per session)

| # | Check | Device | OS / Browser | Build | Tester | Date | Result | Notes |
|---|-------|--------|--------------|-------|--------|------|--------|-------|
| 1 | Cold launch | | | | | | ☐ Pass ☐ Fail | |
| 2 | Return hub | | | | | | ☐ Pass ☐ Fail | |
| 3 | Audio unlock | | | | | | ☐ Pass ☐ Fail | |
| 4 | IAP sandbox | | | | | | ☐ Pass ☐ Fail | |
| 5 | Share OG preview | | | | | | ☐ Pass ☐ Fail | |
| 6 | Tab unlock rings | | | | | | ☐ Pass ☐ Fail | |
| 7 | Greenlight burst | | | | | | ☐ Pass ☐ Fail | |
| 8 | PWA install | | | | | | ☐ Pass ☐ Fail | |

**Ship gate:** all eight **Pass** on at least one iPhone and one Android (or documented waiver with ticket).

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-------------|
| QA | | | |
| Dev | | | |

Related: `launch/TESTFLIGHT_CHECKLIST.md` · `launch/ENV_CHECKLIST.md`