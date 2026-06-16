// Solo / local game: the platform requires a root code module.
// All real game logic lives client-side in index.html (single-player tycoon).
export const meta = { game: "anime-studio-tycoon", minPlayers: 1, maxPlayers: 1 };
export function setup() { return {}; }
export function validateAction() { return { ok: true }; }
export function applyAction(state) { return state; }
export function isGameOver() { return { over: false }; }
export function viewFor(state) { return state; }
