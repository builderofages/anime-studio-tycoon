/* Anime Studio Tycoon — Electron main process (Steam / desktop wrapper).
 *
 * The game is a single-page app that imports ./strings.js as an ES module.
 * ES module imports are blocked over file:// in Chromium, so we serve the
 * game files from a tiny in-process HTTP server bound to 127.0.0.1 and point
 * the window at it. This keeps the web build 100% unmodified.
 */
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Where the game files live: packaged → resources/game, dev → repo root.
const GAME_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "game")
  : path.join(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
        // prevent path traversal
        const safe = path
          .normalize(urlPath)
          .replace(/^(\.\.[/\\])+/, "")
          .replace(/^[/\\]+/, "");
        const file = path.join(GAME_DIR, safe);
        if (!file.startsWith(GAME_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          res.writeHead(404); res.end("Not found"); return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
        fs.createReadStream(file).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end("Error");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`));
  });
}

let steam = null;
try { steam = require("./steam"); } catch (e) { /* steamworks not installed/initialised — runs fine without it */ }

let win = null;
async function createWindow() {
  const base = await startServer();
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: "#1a1426",
    title: "Anime Studio Tycoon",
    autoHideMenuBar: true,
    icon: path.join(GAME_DIR, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // open external links (privacy/terms/checkout) in the OS browser, keep the game in-app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "Game", submenu: [
      { label: "Toggle Fullscreen", accelerator: "F11", click: () => win.setFullScreen(!win.isFullScreen()) },
      { type: "separator" },
      { role: "quit" },
    ]},
    { label: "View", submenu: [ { role: "reload" }, { role: "toggledevtools" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" } ] },
  ]));

  win.loadURL(base);
}

app.whenReady().then(() => {
  if (steam && steam.init) { try { steam.init(); } catch (e) { console.warn("Steam init skipped:", e && e.message); } }
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// Renderer → main bridge for Steam achievements (see preload.js + steam.js)
const { ipcMain } = require("electron");
ipcMain.on("steam-achievement", (_e, id) => { try { steam && steam.unlock && steam.unlock(id); } catch (e) {} });
