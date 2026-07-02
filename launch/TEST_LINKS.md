# Anime Studio Tycoon — Test Links (all angles)

**Build:** 27 · Complete · v9.0.0  
**Verified:** 2026-07-02

---

## Play now (primary)

| Link | Use |
|------|-----|
| **[https://anime-studio-tycoon.vercel.app](https://anime-studio-tycoon.vercel.app)** | Main production URL |
| **[https://anime-studio-tycoon.vercel.app/play](https://anime-studio-tycoon.vercel.app/play)** | Short alias (same game) |

**Phone:** Open either URL in Safari/Chrome → Share → **Add to Home Screen** (PWA).

---

## Local test (your machine)

```bash
cd /Users/alexandermills/anime-studio
npx serve -l 3456 .
```

→ **[http://localhost:3456](http://localhost:3456)**

Or open `index.html` directly (some APIs won’t work offline; saves still work in localStorage).

---

## Desktop (Steam build)

```bash
open "/Users/alexandermills/anime-studio/desktop/dist/Anime Studio Tycoon-9.0.0-arm64.dmg"
```

Install → launch **Anime Studio Tycoon** (Electron + Steam achievements hook).

---

## 5-minute smoke test (playthrough)

1. **Start** → tap **Let's Build!**
2. **Staff** tab → hire 1 Animator
3. **Produce** → pick genre → greenlight **Short Film**
4. Tap poster to boost → wait for **Ready** → **Premiere**
5. Check **Director's Pathway** CTA updates
6. **Quests** → claim login reward if shown
7. Refresh page → save should persist

---

## What to check per tab

| Tab | Verify |
|-----|--------|
| Produce | HUD, pathway rail, dynasty badge, smart cast, production grid |
| Staff | Hire buttons, department headers |
| Stars | Scout (after 50 fans), rarity card glow |
| Quests | Daily/weekly quests, achievement strip |
| Studio | Upgrades, dynasty perks, career ledger |
| Market | Campaign cards |
| Store | Gem balance, Producer Pass shelf, redeem codes |

---

## Dev / QA shortcuts

| Action | How |
|--------|-----|
| Reset save | Footer **↺ Reset** |
| What's new | Footer **✨ News** |
| Promo codes | Store → **Redeem Gumroad License** or codes `WELCOME` / `ANIME50` (if UI exposes redeem) |
| Force fresh UI | Hard refresh: **Cmd+Shift+R** (Mac) / **Ctrl+Shift+R** (Win) |
| Run automated tests | `npm test` (108 checks) |
| Launch preflight | `npm run launch-preflight` |

---

## Repo & deploy

| Resource | URL |
|----------|-----|
| GitHub | [github.com/builderofages/anime-studio-tycoon](https://github.com/builderofages/anime-studio-tycoon) |
| Vercel project | `tya2023s-projects/anime-studio-tycoon` |

Redeploy:

```bash
npm test && git push && vercel --prod --yes
```

---

## Not testable until you configure

- **Real Gumroad purchases** → need `GUMROAD_ACCESS_TOKEN` on Vercel
- **iOS TestFlight** → Codemagic + App Store Connect
- **Steam store listing** → upload DMG + assets to Steamworks

Free gameplay, saves, quests, and progression work without those.