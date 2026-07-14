/**
 * Anime Studio Tycoon — Polish layer (v30)
 * Crisis snooze, rating coach, pathway hints for studio stars.
 */
(function () {
  const SNOOZE_MS = 600000;

  function closeCrisisModal() {
    if (typeof window.dismissCrisisModal === "function") window.dismissCrisisModal();
  }

  function snoozeCrises(hook) {
    const S = hook.getState();
    const until = Date.now() + SNOOZE_MS;
    S.crisisSnoozeUntil = until;
    S.lastChaos = until;
    S.lastStarDemand = until;
    S.lastDecision = until;
    closeCrisisModal();
    hook.toast("😴 Crises snoozed for 10 minutes — focus on production!", true);
    hook.save();
    hook.render();
  }

  function injectSnoozeButton() {
    const m = document.getElementById("decision");
    if (!m || m.style.display !== "flex") return;
    const body = document.getElementById("decision-body");
    if (!body || body.querySelector("[data-crisis-snooze]")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-ghost";
    btn.dataset.crisisSnooze = "1";
    btn.style.cssText = "width:100%;margin-top:12px;font-size:11px;opacity:.85";
    btn.textContent = "😴 Snooze all crises 10 min";
    body.appendChild(btn);
  }

  function ratingCoach(S, hook) {
    if (S.ratingGuideSeen || (S.releases || 0) < 1) return;
    S.ratingGuideSeen = true;
    hook.save();
    setTimeout(
      () => hook.toast("⭐ Tap your studio stars (top-left) — JW-style rating unlocks bigger projects!", true),
      2200
    );
  }

  function installHooks() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__polishInstalled) return false;
    hook.__polishInstalled = true;

    window.__AST_SNOOZE_CRISES__ = () => snoozeCrises(hook);

    const origRender = hook.render;
    hook.render = function () {
      origRender();
      injectSnoozeButton();
    };

    const origRelease = hook.releaseProject;
    hook.releaseProject = function (slot) {
      const S = hook.getState();
      const before = S.releases || 0;
      origRelease(slot);
      if ((hook.getState().releases || 0) > before) ratingCoach(hook.getState(), hook);
    };

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-crisis-snooze]")) {
        e.preventDefault();
        e.stopPropagation();
        snoozeCrises(hook);
      }
    });

    return true;
  }

  const poll = setInterval(() => {
    if (installHooks()) clearInterval(poll);
  }, 80);
})();