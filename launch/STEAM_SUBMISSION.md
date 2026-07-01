# Steam partner submission

## Build artifact

```bash
cd /Users/alexandermills/anime-studio/desktop
npm install && npm run dist:mac   # macOS
npm run dist:win                # Windows (on Win or CI)
```

**Output:** `desktop/dist/Anime Studio Tycoon-8.0.0-arm64.dmg` (+ `.zip`)

Icon: `desktop/icon.png` (1024×1024 sakura app icon)

## Store page assets (from `launch/store/`)

| Asset | File | Steam spec |
|-------|------|------------|
| Capsule header | `steam-capsule.jpg` | 460×215 or 616×353 |
| Small capsule | crop from capsule | 231×87 |
| Screenshots | `screenshot-produce.png`, `screenshot-stars.png` | 1920×1080 or 9:16 mobile |
| Library hero | `trailer-keyframe.jpg` | 3840×2160 optional |

Copy: `launch/STORE_LISTING.md` (Steam section)

## Suggested tags

Simulation, Casual, Indie, Anime, Management, Singleplayer, Free to Play, Idler

## Age rating

Everyone / PEGI 3 — no violence, gambling uses virtual currency only, no real-money payouts.

## Depots

Upload macOS `.zip` or `.dmg` contents as default depot. Windows build when ready.

## Achievements

Steam stats wired via `desktop/achievements.json` + `steam.js` (52 achievements including v8 Final).