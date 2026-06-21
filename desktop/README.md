# Anime Studio Tycoon — Steam / Desktop (Electron)

Wraps the exact same web game (`../index.html` + `../strings.js`) into a desktop
app for **Steam** (Windows / macOS / Linux). The game files are served from a
tiny in‑process HTTP server so the ES‑module import (`./strings.js`) works — the
web build is shipped 100% unmodified.

## Run it (dev)

```bash
cd desktop
npm install
npm start            # launches Electron, loads the game from the repo root
```

## Build installers

```bash
npm run dist         # current OS
npm run dist:win     # Windows (nsis + zip)
npm run dist:mac     # macOS (dmg + zip)
npm run dist:linux   # Linux (AppImage + tar.gz)
```

Output lands in `desktop/dist/`. `electron-builder` copies the game files
(`index.html`, `strings.js`, `logic.js`, `privacy.html`, `terms.html`) into the
app's `resources/game/` (see `build.extraResources` in `package.json`).

## Steamworks

`steam.js` integrates Steamworks via [`steamworks.js`]. It **no‑ops cleanly** if
the Steam client, the SDK, or an App ID aren't present, so dev/CI builds still run.

To wire a real release:

1. Get an **App ID** from the Steamworks partner site.
2. Put it in `steam_appid.txt` (next to the binary) or set `STEAM_APP_ID`.
   (`480` = Valve's public *Spacewar* test app — replace before release.)
3. In Steamworks, create **achievements** whose API names match
   `achievements.json` (e.g. game id `rel100` → `ACH_REL100`). The game already
   unlocks them: `checkAchievements()` calls `window.STEAM_ACHIEVE(id)`, which the
   Electron preload forwards to `steam.js`.
4. Add the Steamworks **redistributables** (`steam_api`/`steam_api64`,
   `sdkencryptedappticket`) per `steamworks.js` docs for each platform.

### Uploading to Steam

Use SteamPipe (`steamcmd` + an app build script) to push `desktop/dist/<platform>`
to your app's depots, then set the default branch live in Steamworks.

## Cloud saves (wired)

The game mirrors its save to `ast_save.json` in Electron's `userData` directory
(`main.js` ↔ `preload.js` ↔ the game's `save()`/`syncCloudSave()`), and reads the
newer of cloud‑vs‑local on boot. To enable **Steam Auto‑Cloud**, in Steamworks →
*Cloud* add a root mapping for each OS pointing at the userData folder, e.g.:

| OS | userData path (root: substitute as shown) |
|---|---|
| Windows | `%AppData%/Anime Studio Tycoon` → pattern `ast_save.json` |
| macOS | `~/Library/Application Support/Anime Studio Tycoon` |
| Linux | `~/.config/Anime Studio Tycoon` |

(Or use the Steamworks ISteamRemoteStorage API for explicit control.)

## What's next

- **Steam overlay / rich presence:** available through `steamworks.js`; not yet wired.
- **Controller / Steam Deck input:** the game supports gamepad nav already; verify
  glyphs and text legibility on Deck before requesting "Verified".

[`steamworks.js`]: https://github.com/ceifa/steamworks.js
