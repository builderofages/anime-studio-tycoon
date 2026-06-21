/* Preload — exposes a tiny, safe bridge to the game running in the renderer.
 * The web game stays unchanged; it only calls these if they exist (feature-detection). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("STEAM", true);

// The game calls window.STEAM_ACHIEVE(id) from checkAchievements() when it grants one.
contextBridge.exposeInMainWorld("STEAM_ACHIEVE", (id) => {
  try { ipcRenderer.send("steam-achievement", String(id)); } catch (e) {}
});
