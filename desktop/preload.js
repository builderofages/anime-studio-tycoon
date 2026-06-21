/* Preload — exposes a tiny, safe bridge to the game running in the renderer.
 * The web game stays unchanged; it only calls these if they exist (feature-detection). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("STEAM", true);

// The game calls window.STEAM_ACHIEVE(id) from checkAchievements() when it grants one.
contextBridge.exposeInMainWorld("STEAM_ACHIEVE", (id) => {
  try { ipcRenderer.send("steam-achievement", String(id)); } catch (e) {}
});

// Cloud-save bridge: mirror the save blob to a file in userData (which Steam
// Auto-Cloud syncs). The game writes on every save and reads once on boot.
contextBridge.exposeInMainWorld("ASTCloudSave", (data) => {
  try { ipcRenderer.send("ast-save", String(data)); } catch (e) {}
});
contextBridge.exposeInMainWorld("ASTCloudLoad", () => {
  try { return ipcRenderer.sendSync("ast-load"); } catch (e) { return null; }
});
