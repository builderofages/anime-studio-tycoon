/**
 * Anime Studio Tycoon — HUD v3
 * Minimal chrome: compact stat bar, slim coach, icon dock, utility drawer.
 */
(function () {
  const QUEST_METRICS = {
    rel: "releases", rel2: "releases", yen: "yen", big: "yen", camp: "campaigns",
    hire: "hires", hire2: "hires", hype: "hypeSpent", scout: "scouts",
    green: "greenlit", tap: "taps", tap2: "taps",
    w_rel: "releases", w_yen: "yen", w_scout: "scouts", w_green: "greenlit",
    w_camp: "campaigns", w_hire: "hires", w_tap: "taps",
  };

  const GUIDED_STEPS = [
    {
      id: "name",
      label: "Studio",
      stepN: 1,
      title: "Name your studio",
      body: (S) => `You're ${S.studioName || "the director"}! Your brand shows at the top of the screen.`,
      target: () => document.getElementById("hud-studio-name"),
      done: (S) => !!S._tutorialNameDone,
      coach: (S) => ({
        message: `Welcome, ${S.studioName || "Director"}! Tap Next when you're ready.`,
        cta: "Next",
        urgent: true,
        action: { type: "tutorial-next" },
      }),
    },
    {
      id: "hire",
      label: "Hire",
      stepN: 2,
      title: "Hire your first staff",
      body: () => "Animators and writers speed up every production. Hire one on Recruit.",
      target: () =>
        document.querySelector('[data-hire="animator"]') ||
        document.querySelector('[data-hire="writer"]') ||
        document.querySelector('.tab[data-tab="staff"]'),
      done: (S) => staffTotal(S) > 0,
      coach: () => ({
        message: "Open Recruit and hire your first team member",
        tab: "staff",
        cta: "Recruit",
        urgent: true,
        action: { type: "tab", tab: "staff" },
      }),
    },
    {
      id: "greenlight",
      label: "Greenlight",
      stepN: 3,
      title: "Greenlight your first anime",
      body: () => "Pick a project and start production — one tap greenlights your debut show.",
      target: () =>
        document.querySelector(".aaa-quick-gl-banner") ||
        document.querySelector(".aaa-gl-confirm-banner") ||
        document.querySelector('.tab[data-tab="produce"]'),
      done: (S) => activeCount(S) > 0 || (S.releases || 0) > 0,
      coach: () => ({
        message: "Greenlight your first anime on Play",
        tab: "produce",
        cta: "Greenlight",
        urgent: true,
        action: { type: "quick-greenlight" },
      }),
    },
    {
      id: "boost",
      label: "Boost",
      stepN: 4,
      title: "Tap to boost speed",
      body: () => "Tap the poster or Boost button to rush episodes — great for your first premiere.",
      target: () =>
        document.querySelector(".aaa-poster.aaa-tap-hint") ||
        document.querySelector(".aaa-play-btn") ||
        document.querySelector(".aaa-poster[data-act='tapboost']"),
      done: (S) => (S.taps || 0) > 0,
      coach: (S, hook) => {
        const pr = (S.projects || []).find(Boolean);
        const slot = pr ? (S.projects || []).indexOf(pr) : 0;
        return {
          message: "Tap the poster to boost production speed",
          tab: "produce",
          cta: "Boost",
          urgent: true,
          action: { type: "tapboost", slot },
        };
      },
    },
    {
      id: "premiere",
      label: "Premiere",
      stepN: 5,
      title: "Premiere when ready",
      body: () => "When the bar fills, hit Global Premiere to earn ¥, fans, and your first hit.",
      target: () =>
        document.querySelector(".aaa-premiere-ready") ||
        document.getElementById("pathway-cta"),
      done: (S) => (S.releases || 0) > 0,
      coach: (S, hook) => {
        const ready = readySlot(S, hook);
        return {
          message: ready >= 0 ? "Production ready — premiere now!" : "Keep boosting until production finishes",
          tab: "produce",
          cta: ready >= 0 ? "Premiere" : "Play",
          urgent: ready >= 0,
          action: ready >= 0 ? { type: "premiere", slot: ready } : { type: "tab", tab: "produce" },
        };
      },
    },
  ];

  let _gtHighlight = null;

  function shouldRunGuidedTutorial(S, hook) {
    if (hook.isGuidedTutorialEligible) return hook.isGuidedTutorialEligible();
    if (hook.isDemoMode && hook.isDemoMode()) return false;
    if (S.tutorialSeen) return false;
    if ((S.releases || 0) > 0) return false;
    return !!S._guidedFresh;
  }

  function getGuidedStep(S, hook) {
    for (const step of GUIDED_STEPS) {
      if (!step.done(S, hook)) return step;
    }
    return null;
  }

  function clearGtHighlight() {
    if (_gtHighlight) {
      _gtHighlight.classList.remove("gt-highlight");
      _gtHighlight = null;
    }
  }

  function ensureGuidedTutorialShell() {
    if (document.getElementById("guided-tutorial")) return;
    const el = document.createElement("div");
    el.id = "guided-tutorial";
    el.hidden = true;
    el.innerHTML = `
      <div class="gt-card">
        <div class="gt-kicker">First session</div>
        <div class="gt-step" id="gt-step-label">Step 1 of 5</div>
        <h3 class="gt-title" id="gt-title"></h3>
        <p class="gt-body" id="gt-body"></p>
        <div class="gt-actions">
          <button type="button" class="btn-ghost gt-skip" data-act="tutorial-skip">Skip tutorial</button>
          <button type="button" class="btn-primary gt-next" id="gt-next" hidden>Next ▶</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector(".gt-skip").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (hook?.completeTutorial) hook.completeTutorial();
      else if (hook) {
        const S = hook.getState();
        S.tutorialSeen = true;
        S._guidedFresh = false;
        hook.save?.();
      }
      document.documentElement.classList.remove("gt-tutorial-active");
      el.hidden = true;
      clearGtHighlight();
      hook?.render?.();
      hook?.play?.("click");
    });
    document.getElementById("gt-next").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      const S = hook.getState();
      S._tutorialNameDone = true;
      hook.save?.();
      hook.play("click");
      hook.render();
    });
  }

  function updateGuidedTutorial(S, hook) {
    ensureGuidedTutorialShell();
    const panel = document.getElementById("guided-tutorial");
    if (!shouldRunGuidedTutorial(S, hook)) {
      document.documentElement.classList.remove("gt-tutorial-active");
      if (panel) panel.hidden = true;
      clearGtHighlight();
      return null;
    }
    const step = getGuidedStep(S, hook);
    if (!step) {
      if (hook.completeTutorial) hook.completeTutorial();
      else {
        S.tutorialSeen = true;
        S._guidedFresh = false;
        hook.save?.();
      }
      document.documentElement.classList.remove("gt-tutorial-active");
      if (panel) panel.hidden = true;
      clearGtHighlight();
      return null;
    }
    document.documentElement.classList.add("gt-tutorial-active");
    if (panel) {
      panel.hidden = false;
      const title = typeof step.title === "function" ? step.title(S, hook) : step.title;
      const body = typeof step.body === "function" ? step.body(S, hook) : step.body;
      document.getElementById("gt-step-label").textContent = `Step ${step.stepN} of ${GUIDED_STEPS.length}`;
      document.getElementById("gt-title").textContent = title;
      document.getElementById("gt-body").textContent = body;
      const nextBtn = document.getElementById("gt-next");
      if (nextBtn) nextBtn.hidden = step.id !== "name";
    }
    clearGtHighlight();
    const target = step.target?.();
    if (target) {
      target.classList.add("gt-highlight");
      _gtHighlight = target;
      requestAnimationFrame(() => {
        try { target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); } catch (_e) {}
      });
    }
    const coach = typeof step.coach === "function" ? step.coach(S, hook) : step.coach;
    return coach;
  }

  function staffTotal(S) {
    const st = S.staff || {};
    return (st.animator || 0) + (st.writer || 0) + (st.director || 0) + (st.voice || 0) + (st.producer || 0);
  }

  function activeCount(S) {
    return (S.projects || []).filter(Boolean).length;
  }

  function readySlot(S, hook) {
    for (let i = 0; i < (S.projects || []).length; i++) {
      const pr = S.projects[i];
      if (!pr) continue;
      const p = hook.getProject(pr.pid);
      if (pr.progress >= p.work) return i;
    }
    return -1;
  }

  function claimableQuests(S) {
    let n = 0;
    (S.quests || []).forEach((q) => {
      if (q.claimed) return;
      const key = QUEST_METRICS[q.id] || q.id;
      if (((S.questProg || {})[key] || 0) >= q.goal) n++;
    });
    (S.weeklyQuests || []).forEach((q) => {
      if (q.claimed) return;
      const key = QUEST_METRICS[q.id] || q.id;
      if (((S.weekProg || {})[key] || 0) >= q.goal) n++;
    });
    return n;
  }

  function analyzePathway(S, hook, ctx) {
    ctx = ctx || {};
    const glView = !!ctx.glView;
    const guidedCoach = ctx.guidedCoach;
    if (guidedCoach) return guidedCoach;
    const showcase = hook.isShowcaseDemo && hook.isShowcaseDemo();
    const st = S.staff || {};
    const staffed = staffTotal(S);
    const wellStaffed = showcase || staffed >= 6 || ((st.director || 0) >= 1 && (st.animator || 0) >= 2);

    const ready = readySlot(S, hook);
    if (ready >= 0) {
      return {
        message: "Production ready — premiere now!",
        tab: "produce",
        cta: "Premiere",
        urgent: true,
        showOnGreenlight: true,
        action: { type: "premiere", slot: ready },
      };
    }

    if (glView) {
      const empties = Math.max(0, (S.slots || 1) - activeCount(S));
      if (empties > 0) {
        const trend = hook.trendGenre ? hook.trendGenre() : "Action";
        return {
          message: showcase
            ? `Pick a project — 🔥 ${trend} is trending for bonus rewards`
            : "Choose a project and greenlight to fill your open slot",
          tab: "produce",
          cta: "Greenlight",
          urgent: !showcase,
          showOnGreenlight: true,
          action: { type: "gl-focus" },
        };
      }
    }

    if (!glView && (S.releases || 0) < 15 && activeCount(S) > 0) {
      const pr = (S.projects || []).find(Boolean);
      if (pr) {
        const p = hook.getProject(pr.pid);
        if (p && pr.progress < p.work) {
          if (!wellStaffed && (st.director || 0) < 1) {
            return {
              message: "Hire a Director — they boost your production score",
              tab: "staff",
              cta: "Hire",
              action: { type: "tab", tab: "staff" },
            };
          }
          return {
            message: showcase
              ? "Production is rolling — tap the poster to boost speed"
              : "Tap the poster to boost speed — or wait for your team",
            tab: "produce",
            cta: "Boost",
            urgent: false,
            action: { type: "tapboost", slot: (S.projects || []).indexOf(pr) },
          };
        }
      }
    }
    if ((S.studioStars || 1) < 3 && (S.releases || 0) >= 1 && (S.releases || 0) < 15) {
      return {
        message: `Push toward ${(S.studioStars || 1) + 1}★ studio rating`,
        tab: "produce",
        cta: "Rating",
        urgent: false,
        action: { type: "rating" },
      };
    }
    if ((S.releases || 0) === 0 && activeCount(S) === 0) {
      if (staffTotal(S) === 0) {
        return {
          message: "Hire animators and writers first",
          tab: "staff",
          cta: "Hire",
          action: { type: "tab", tab: "staff" },
        };
      }
      if (S.yen < 100) {
        return {
          message: "Low cash — freelance or wait for royalties",
          tab: "produce",
          cta: "Produce",
          action: { type: "tab", tab: "produce" },
        };
      }
      return {
        message: "One tap to greenlight your first anime",
        tab: "produce",
        cta: "Greenlight",
        urgent: true,
        action: { type: "quick-greenlight" },
      };
    }
    if (activeCount(S) > 0 && (S.releases || 0) < 5) {
      return {
        message: "Tap posters to boost production speed",
        tab: "produce",
        cta: "Lines",
        action: { type: "tab", tab: "produce" },
      };
    }
    if ((S.stars || []).length === 0 && S.fans >= 50) {
      return {
        message: "Scout star talent for bigger premieres",
        tab: "stars",
        cta: "Stars",
        action: { type: "tab", tab: "stars" },
      };
    }
    const today = new Date().toISOString().slice(0, 10);
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    if (claimableQuests(S) > 0 || loginPending) {
      return {
        message: loginPending && claimableQuests(S) === 0
          ? "Daily login reward is ready"
          : "Rewards ready — tap to claim",
        tab: "quests",
        cta: "Claim",
        urgent: true,
        action: { type: "claim-reward" },
      };
    }
    if (!wellStaffed && (S.staff?.director || 0) < 1 && activeCount(S) > 0 && (S.releases || 0) >= 1 && (S.releases || 0) < 12) {
      return {
        message: "Hire a Director — they boost your production score",
        tab: "staff",
        cta: "Hire",
        action: { type: "tab", tab: "staff" },
      };
    }
    if (!wellStaffed && !showcase && (S.releases || 0) < 8 && activeCount(S) > 0 && hook.hireCost && hook.ROLES) {
      const priority = ["director", "animator", "writer", "producer", "voice"];
      const afford = priority.find((k) => hook.ROLES[k] && S.yen >= hook.hireCost(k) && (S.staff[k] || 0) < 2);
      if (afford) {
        return {
          message: `Hire a ${hook.ROLES[afford].name} to speed up production`,
          tab: "staff",
          cta: "Hire",
          urgent: (S.staff[afford] || 0) === 0,
          action: { type: "hire", role: afford },
        };
      }
    }
    const todayGems = new Date().toISOString().slice(0, 10);
    if (S.freeGemsDate !== todayGems) {
      return {
        message: "Free daily gems are waiting in the Store",
        tab: "store",
        cta: "Claim",
        urgent: true,
        action: { type: "tab", tab: "store" },
      };
    }
    if ((S.dynastyPoints || 0) - (S.dynastySpent || 0) >= 12 && (S.releases || 0) >= 15) {
      return {
        message: "Dynasty perks available in Studio",
        tab: "studio",
        cta: "Studio",
        action: { type: "tab", tab: "studio" },
      };
    }
    return {
      message: "Trending: " + (hook.trendGenre ? hook.trendGenre() : "Action"),
      tab: "produce",
      cta: "Play",
      action: { type: "tab", tab: "produce" },
    };
  }

  function runPathwayAction() {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    const pw = window.__AST_PATHWAY__;
    if (!pw || !pw.action) return;
    if (pw.action.type === "premiere" && typeof hook.releaseProject === "function") {
      hook.releaseProject(pw.action.slot);
      hook.play("click");
      return;
    }
    if (pw.action.type === "quick-greenlight" && typeof hook.quickGreenlight === "function") {
      hook.getState().tab = "produce";
      hook.quickGreenlight();
      hook.play("click");
      return;
    }
    if (pw.action.type === "claim-reward" && typeof hook.claimFirstReward === "function") {
      hook.claimFirstReward();
      hook.play("click");
      return;
    }
    if (pw.action.type === "hire" && typeof hook.hire === "function") {
      hook.getState().tab = "staff";
      hook.hire(pw.action.role);
      hook.play("click");
      return;
    }
    if (pw.action.type === "rating") {
      (document.getElementById("hud-studio-rating") || document.getElementById("studio-rank"))?.click();
      hook.play("click");
      return;
    }
    if (pw.action.type === "tapboost" && typeof hook.tapBoost === "function") {
      hook.getState().tab = "produce";
      hook.tapBoost(pw.action.slot);
      hook.play("click");
      return;
    }
    if (pw.action.type === "tutorial-next") {
      const S = hook.getState();
      S._tutorialNameDone = true;
      hook.save?.();
      hook.render();
      hook.play("click");
      return;
    }
    if (pw.action.type === "gl-focus") {
      const btn = document.querySelector(".aaa-gl-confirm-banner, .aaa-gl-card.sel");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
      hook.play("click");
      return;
    }
    if (pw.action.type === "tab") {
      hook.getState().tab = pw.action.tab;
      hook.render();
      hook.play("click");
    }
  }

  function buildHudShell() {
    if (document.getElementById("hud-shell")) return;
    const top = document.getElementById("top");
    if (!top) return;

    const shell = document.createElement("div");
    shell.id = "hud-shell";
    shell.className = "hud-v3";
    shell.innerHTML = `
      <div class="hud-brand-row">
        <button type="button" class="hud-back-btn" id="hud-back-btn" aria-label="Back" hidden>←</button>
        <div class="hud-avatar-wrap" id="hud-avatar-wrap"><img class="hud-avatar" src="start-hero.png?v=88" alt=""><span class="hud-lv-badge" id="hud-lv-badge">1</span></div>
        <div class="hud-identity">
          <div class="hud-brand-line"><span class="hud-sakura-logo" aria-hidden="true">🌸</span><span class="hud-studio-name" id="hud-studio-name">Studio</span></div>
          <span class="hud-studio-rank-label" id="hud-studio-rank-label">Studio Rank C</span>
        </div>
        <div class="hud-studio-rating jw-studio-rank" id="hud-studio-rating" role="button" tabindex="0" aria-label="Studio rating"></div>
        <span class="hud-combo" id="hud-combo">COMBO x<span id="hud-combo-n">0</span></span>
        <div class="hud-brand-actions">
          <button type="button" class="hud-menu-btn" id="hud-settings-btn" aria-label="Settings">⚙️</button>
          <button type="button" class="hud-mail-btn" id="hud-mail-btn" aria-label="Mail and rewards">✉️</button>
          <span class="hud-awards-chip" id="hud-awards" hidden title="Golden Anime Awards"><span class="hud-awards-ic">🏆</span><span class="hud-awards-copy"><small>年度最佳动画公司</small><b>Golden Anime Awards</b></span></span>
        </div>
        <div class="hud-stats" id="hud-resources"></div>
      </div>
      <div class="hud-drawer" id="hud-drawer" hidden>
        <div class="hud-drawer-inner">
          <div class="hud-drawer-label">⚙️ Settings</div>
          <div id="hud-drawer-slot"></div>
        </div>
      </div>`;

    top.parentNode.insertBefore(shell, top);

    const resWrap = document.getElementById("hud-resources");
    const plusTab = { yen: "market", fans: "market", gems: "store", hype: "produce" };
    ["yen", "fans", "gems", "hype"].forEach((k) => {
      const el = top.querySelector(".res." + k);
      if (!el) return;
      el.classList.add("hud-stat", k);
      const wrap = document.createElement("div");
      wrap.className = "hud-stat-wrap " + k;
      wrap.appendChild(el);
      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "hud-stat-plus";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Get more " + k);
      plus.addEventListener("click", () => {
        const hook = window.__AST_HOOK__;
        if (!hook) return;
        hook.getState().tab = plusTab[k];
        hook.render();
        hook.play("click");
        closeDrawer();
      });
      wrap.appendChild(plus);
      resWrap.appendChild(wrap);
    });

    const trend = top.querySelector("#trendbar");
    if (trend) trend.style.display = "none";
    top.classList.add("legacy-hidden");

    if (!document.getElementById("pathway-rail")) {
      const rail = document.createElement("div");
      rail.id = "pathway-rail";
      rail.className = "coach-bar";
      rail.innerHTML = `
        <img class="coach-avatar" src="https://d8j0ntlcm91z4.cloudfront.net/user_342M7OMJEmtQi5ZXBKPVqJZUjCn/hf_20260614_063644_801c60be-70bb-4a64-99db-703283d57b54.jpeg?v=88" alt="" width="40" height="40">
        <div class="coach-body">
          <span class="coach-label">Coach's Tip</span>
          <p class="coach-msg" id="pathway-now"></p>
        </div>
        <button type="button" class="coach-cta" id="pathway-cta" aria-label="Go">→</button>
        <button type="button" class="coach-gift" id="coach-gift" aria-label="Rewards"><span class="coach-gift-ic">🎁</span><span class="coach-gift-dot" id="coach-gift-dot" hidden></span></button>
        <div class="pathway-steps" id="pathway-steps" hidden></div>`;
      const goal = document.getElementById("goal");
      goal.parentNode.insertBefore(rail, goal.nextSibling);
    }

    const tabs = document.getElementById("tabs");
    if (tabs && !document.getElementById("command-dock")) {
      const dock = document.createElement("div");
      dock.id = "command-dock";
      tabs.parentNode.insertBefore(dock, tabs);
      dock.appendChild(tabs);
    }

    const foot = document.querySelector(".foot");
    const drawerSlot = document.getElementById("hud-drawer-slot");
    if (foot && drawerSlot) {
      while (foot.firstChild) drawerSlot.appendChild(foot.firstChild);
      foot.remove();
    }
    organizeDrawerSlot();
    wireGoalBar();

    document.documentElement.classList.add("premium-hud", "hud-v3-active");

    if (!document.getElementById("sakura-petals")) {
      const petals = document.createElement("div");
      petals.id = "sakura-petals";
      petals.setAttribute("aria-hidden", "true");
      petals.innerHTML = Array.from({ length: 12 }, (_, i) =>
        `<i class="petal" style="--d:${(i * 0.7).toFixed(1)}s;--x:${(i * 8.3) % 100}%;--s:${0.6 + (i % 4) * 0.15}"></i>`
      ).join("");
      document.body.appendChild(petals);
    }

    document.getElementById("hud-back-btn").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      const main = document.getElementById("main");
      if (main?.dataset.glBack === "1" && hook.greenlightBack) hook.greenlightBack();
      else if (main?.dataset.glView === "1") {
        hook.getState().tab = "produce";
        if (hook.greenlightBack) hook.greenlightBack();
        else hook.render();
      }
      hook.play("click");
    });
    document.getElementById("hud-settings-btn").addEventListener("click", () => {
      openDrawer();
      const hook = window.__AST_HOOK__;
      if (hook) hook.play("click");
    });
    document.getElementById("pathway-cta").addEventListener("click", runPathwayAction);
    document.getElementById("hud-mail-btn").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      hook.getState().tab = "quests";
      hook.render();
      hook.play("click");
    });
    document.getElementById("coach-gift").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      hook.getState().tab = "quests";
      hook.render();
      hook.play("click");
      closeDrawer();
    });
    const drawer = document.getElementById("hud-drawer");
    drawer.addEventListener("click", (e) => {
      if (e.target.id === "hud-drawer") e.currentTarget.hidden = true;
    });
    drawerSlot.addEventListener("click", (e) => {
      if (e.target.closest("button, select, a")) drawer.hidden = true;
    });
  }

  function openDrawer() {
    const d = document.getElementById("hud-drawer");
    if (d) d.hidden = false;
  }

  function closeDrawer() {
    const d = document.getElementById("hud-drawer");
    if (d) d.hidden = true;
  }

  function enterDemoFromDrawer() {
    const hook = window.__AST_HOOK__;
    if (!hook) return;
    closeDrawer();
    if (typeof hook.restartAsDemo === "function") {
      hook.restartAsDemo();
      hook.play("click");
      return;
    }
    try {
      const url = new URL(location.href);
      url.searchParams.set("demo", "1");
      location.href = url.pathname + url.search;
    } catch (e) {
      location.href = location.pathname + "?demo=1";
    }
  }

  function organizeDrawerSlot() {
    const slot = document.getElementById("hud-drawer-slot");
    if (!slot) return;

    const reset = document.getElementById("btn-reset");
    const mute = document.getElementById("btn-mute");
    const lang = document.getElementById("lang-sel");
    const share = slot.querySelector('[data-act="share"]') || document.querySelector('[data-act="share"]');
    const news = slot.querySelector('[data-act="whatsnew-show"]') || document.querySelector('[data-act="whatsnew-show"]');
    const buildtag = document.getElementById("buildtag");
    const save = document.getElementById("btn-save");
    if (save) save.style.display = "none";

    function group(label, key) {
      let g = slot.querySelector(`.hud-drawer-group[data-drawer-group="${key}"]`);
      if (!g) {
        g = document.createElement("div");
        g.className = "hud-drawer-group";
        g.dataset.drawerGroup = key;
        const lbl = document.createElement("div");
        lbl.className = "hud-drawer-sublabel";
        lbl.textContent = label;
        g.appendChild(lbl);
      }
      return g;
    }

    const resetG = group("Reset", "reset");
    const soundG = group("Sound", "sound");
    const langG = group("Language", "language");
    let moreG = slot.querySelector('.hud-drawer-group[data-drawer-group="more"]');
    if (!moreG) {
      moreG = document.createElement("div");
      moreG.className = "hud-drawer-group hud-drawer-more";
      moreG.dataset.drawerGroup = "more";
      const lbl = document.createElement("div");
      lbl.className = "hud-drawer-sublabel";
      lbl.textContent = "More";
      moreG.appendChild(lbl);
    }

    if (reset) {
      reset.classList.add("hud-drawer-owned");
      if (reset.parentNode !== resetG) resetG.appendChild(reset);
    }

    let demo = document.getElementById("hud-demo-link");
    if (!demo) {
      demo = document.createElement("a");
      demo.id = "hud-demo-link";
      demo.className = "hud-drawer-link hud-drawer-owned";
      demo.href = "#";
      demo.textContent = "✨ Try Demo Mode";
      demo.addEventListener("click", (e) => {
        e.preventDefault();
        const go = () => enterDemoFromDrawer();
        if (window.__AST_CONFIRM__) window.__AST_CONFIRM__("Try Demo Mode?", "Loads the Sakura Films showcase studio.", go);
        else if (confirm("Try Demo Mode?\nLoads the Sakura Films showcase studio.")) go();
      });
    }
    if (demo.parentNode !== resetG) resetG.appendChild(demo);

    if (mute) {
      mute.classList.add("hud-drawer-owned");
      if (mute.parentNode !== soundG) soundG.appendChild(mute);
    }
    if (lang) {
      lang.classList.add("hud-drawer-owned");
      if (lang.parentNode !== langG) langG.appendChild(lang);
    }

    [share, news].filter(Boolean).forEach((el) => {
      el.classList.add("hud-drawer-owned");
      if (el.parentNode !== moreG) moreG.appendChild(el);
    });
    slot.querySelectorAll('a[href="privacy.html"], a[href="terms.html"]').forEach((a) => {
      a.classList.add("hud-drawer-owned");
      if (a.parentNode !== moreG) moreG.appendChild(a);
    });
    if (buildtag && buildtag.parentNode !== moreG) moreG.appendChild(buildtag);

    if (!slot.dataset.organized) {
      slot.innerHTML = "";
      slot.appendChild(resetG);
      slot.appendChild(soundG);
      slot.appendChild(langG);
      slot.appendChild(moreG);
      slot.dataset.organized = "1";
    }
  }

  function pulseHudCombo() {
    const combo = document.getElementById("hud-combo");
    if (!combo) return;
    combo.classList.remove("hud-combo-pulse");
    void combo.offsetWidth;
    combo.classList.add("hud-combo-pulse", "hud-combo-tap");
    window.setTimeout(() => combo.classList.remove("hud-combo-tap"), 450);
  }

  function goalMilestoneAction(S, hook) {
    const milestones = hook.MILESTONES || [];
    const nextM = milestones.find((m) => S.fans < m.fans);
    let tab = "produce";
    let selectors = [".aaa-play-btn", ".aaa-poster", ".aaa-gl-open", '[data-act="greenlight-view"]', ".slotpanel", ".aaa-premiere-ready"];

    if (!nextM) {
      tab = "studio";
      selectors = [".aaa-dash-compact", ".dash-panel", ".panel"];
    } else {
      const fans = nextM.fans;
      if (fans >= 25000) {
        tab = "studio";
        selectors = [".aaa-dash-compact", ".dynasty-badge", ".panel"];
      } else if (fans >= 9000) {
        tab = "market";
        selectors = [".ui-campaign-card", '[data-act="freelance"]', ".panel"];
      } else if (fans >= 2200) {
        tab = "stars";
        selectors = [".pick", ".staffrow", '[data-act="spin"]'];
      } else if (fans >= 500) {
        tab = "market";
        selectors = [".ui-campaign-card", ".aaa-play-btn", ".aaa-poster"];
      } else if (fans >= 120) {
        tab = "produce";
        selectors = [".aaa-gl-open", '[data-act="greenlight-view"]', ".aaa-premiere-ready", ".aaa-play-btn"];
      } else if ((S.releases || 0) < 1 && staffTotal(S) === 0) {
        tab = "staff";
        selectors = [".hirebtn", ".staffrow", ".panel"];
      }
    }

    hook.getState().tab = tab;
    hook.render();
    hook.play("click");
    requestAnimationFrame(() => {
      const main = document.getElementById("main");
      for (let i = 0; i < selectors.length; i++) {
        const el = main?.querySelector(selectors[i]);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
      main?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function wireGoalBar() {
    const goal = document.getElementById("goal");
    if (!goal || goal.dataset.hudGoalWired) return;
    goal.dataset.hudGoalWired = "1";
    goal.setAttribute("role", "button");
    goal.setAttribute("tabindex", "0");
    goal.setAttribute("aria-label", "North-star milestone — tap to jump to the next action");
    const run = () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      goalMilestoneAction(hook.getState(), hook);
    };
    goal.addEventListener("click", run);
    goal.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        run();
      }
    });
  }

  function renderPathwaySteps(S, hook) {
    const guided = shouldRunGuidedTutorial(S, hook);
    if (guided) {
      let current = GUIDED_STEPS.findIndex((d) => !d.done(S, hook));
      if (current < 0) current = GUIDED_STEPS.length - 1;
      return GUIDED_STEPS.map((d, i) => {
        const done = d.done(S, hook);
        const cls = ["pathway-step"];
        if (done) cls.push("done");
        else if (i === current) cls.push("current");
        const mark = done ? "✓" : String(d.stepN);
        return `<span class="${cls.join(" ")}" title="${d.label}"><span class="pathway-step-n">${mark}</span><span class="pathway-step-lbl">${d.label}</span></span>`;
      }).join("");
    }
    const showcase = hook.isShowcaseDemo && hook.isShowcaseDemo();
    const starsOk = hook.featureUnlocked ? hook.featureUnlocked("stars") : (S.releases || 0) >= 2;
    const studioOk = hook.featureUnlocked ? hook.featureUnlocked("studio") : (S.releases || 0) >= 1;
    const defs = [
      { id: "hire", label: "Hire", done: staffTotal(S) > 0 },
      { id: "gl", label: "Greenlight", done: activeCount(S) > 0 || (S.releases || 0) > 0 },
      { id: "boost", label: "Boost", done: (S.taps || 0) > 2 || (S.releases || 0) > 0 },
      { id: "premiere", label: "Premiere", done: (S.releases || 0) > 0 },
      { id: "stars", label: "Stars", done: (S.stars || []).length > 0, locked: !starsOk },
      { id: "studio", label: "Studio", done: (S.releases || 0) >= 2, locked: !studioOk },
    ];
    let current = defs.findIndex((d) => !d.done && !d.locked);
    if (current < 0) current = Math.max(0, defs.filter((d) => !d.locked).length - 1);
    return defs.map((d, i) => {
      const cls = ["pathway-step"];
      if (d.done) cls.push("done");
      else if (d.locked) cls.push("locked");
      else if (i === current) cls.push("current");
      const mark = d.done ? "✓" : d.locked ? "🔒" : String(i + 1);
      return `<span class="${cls.join(" ")}" title="${d.label}"><span class="pathway-step-n">${mark}</span><span class="pathway-step-lbl">${d.label}</span></span>`;
    }).join("");
  }

  function stepNeedsTab(S, hook, tab) {
    const step = getGuidedStep(S, hook);
    if (!step || step.id === "name") return false;
    if (step.id === "greenlight" && hook.isGreenlightView?.()) return false;
    return !!tab;
  }

  function ensureHudStats() {
    const resWrap = document.getElementById("hud-resources");
    const top = document.getElementById("top");
    if (!resWrap || !top || resWrap.querySelector(".hud-stat-wrap.fans")) return;
    const plusTab = { yen: "market", fans: "market", gems: "store", hype: "produce" };
    ["fans"].forEach((k) => {
      const el = top.querySelector(".res." + k);
      if (!el) return;
      el.classList.add("hud-stat", k);
      const wrap = document.createElement("div");
      wrap.className = "hud-stat-wrap " + k;
      wrap.appendChild(el);
      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "hud-stat-plus";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Get more " + k);
      plus.addEventListener("click", () => {
        const hook = window.__AST_HOOK__;
        if (!hook) return;
        hook.getState().tab = plusTab[k];
        hook.render();
        hook.play("click");
        closeDrawer();
      });
      wrap.appendChild(plus);
      const gemsWrap = resWrap.querySelector(".hud-stat-wrap.gems");
      if (gemsWrap) resWrap.insertBefore(wrap, gemsWrap);
      else resWrap.appendChild(wrap);
    });
  }

  function updateHud(S, hook) {
    buildHudShell();
    ensureHudStats();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const nameEl = document.getElementById("hud-studio-name");
    if (nameEl) nameEl.textContent = (S.studioName || "Your Studio").toUpperCase();
    const rankLbl = document.getElementById("hud-studio-rank-label");
    if (rankLbl) {
      const stars = S.studioStars || 1;
      const letter = stars >= 5 ? "S+" : stars >= 4 ? "S" : stars >= 3 ? "A" : stars >= 2 ? "B" : "C";
      rankLbl.textContent = "Studio Rank " + letter;
    }
    const main = document.getElementById("main");
    const glView = main?.dataset.glView === "1";
    const shell = document.getElementById("hud-shell");
    if (shell) shell.classList.toggle("hud-gl-view", glView);
    const backBtn = document.getElementById("hud-back-btn");
    const avatarWrap = document.getElementById("hud-avatar-wrap");
    if (backBtn) backBtn.hidden = !glView;
    if (avatarWrap) avatarWrap.hidden = !!glView;

    const awards = document.getElementById("hud-awards");
    if (awards) awards.hidden = glView ? false : (S.releases || 0) < 8;
    const showcaseDemo = hook.isShowcaseDemo && hook.isShowcaseDemo();
    const demoDots = showcaseDemo && !glView;
    const mailBtn = document.getElementById("hud-mail-btn");
    if (mailBtn) {
      mailBtn.hidden = glView;
      const today = new Date().toISOString().slice(0, 10);
      const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
      mailBtn.classList.toggle("has-dot", !glView && (claimableQuests(S) > 0 || loginPending || demoDots));
    }
    const lv = document.getElementById("hud-lv-badge");
    if (lv) lv.textContent = String(S.studioLevel || 1);

    const trend = hook.trendGenre ? hook.trendGenre() : "Action";
    const trendEl = document.getElementById("trend");
    if (trendEl) trendEl.textContent = trend;

    const hypeEl = document.getElementById("r-hype");
    if (hypeEl) {
      const hype = hook.hudDisplayValue ? hook.hudDisplayValue("hype") : S.hype;
      const cap = hook.hudHypeCap ? hook.hudHypeCap() : (hook.hypeCap ? hook.hypeCap() : 100);
      hypeEl.textContent = (hook.fmt ? hook.fmt(hype) : String(hype)) + "/" + (hook.fmt ? hook.fmt(cap) : String(cap));
    }

    const combo = document.getElementById("hud-combo");
    const comboN = document.getElementById("hud-combo-n");
    if (combo && comboN) {
      const active = (S.combo || 0) >= 2;
      const left = 60000 - (Date.now() - (S.lastReleaseAt || 0));
      const pct = active && left > 0 ? Math.max(0, Math.min(100, (left / 60000) * 100)) : 0;
      combo.style.setProperty("--combo-pct", pct + "%");
      if (active && left > 0) {
        combo.classList.add("show");
        comboN.textContent = S.combo;
      } else if (!combo.classList.contains("hud-combo-tap")) {
        combo.classList.remove("show");
      }
    }

    if (window.__AST_STUDIO_RATING__?.refreshHud) {
      window.__AST_STUDIO_RATING__.refreshHud(S, hook);
    }

    const guidedCoach = updateGuidedTutorial(S, hook);
    const pw = analyzePathway(S, hook, { glView, guidedCoach });
    window.__AST_PATHWAY__ = pw;

    const rail = document.getElementById("pathway-rail");
    if (rail) {
      const showCoach = guidedCoach || !glView || !!pw.showOnGreenlight;
      rail.classList.toggle("coach-hidden", !showCoach);
      rail.classList.toggle("coach-guided", !!guidedCoach);
      if (showCoach) delete rail.dataset.coachDismissed;
    }

    const nowEl = document.getElementById("pathway-now");
    if (nowEl) nowEl.textContent = pw.message;
    const cta = document.getElementById("pathway-cta");
    if (cta) {
      const label = pw.cta || "Go";
      cta.textContent = label.length > 14 ? label.slice(0, 13) + "…" : label;
      cta.setAttribute("aria-label", label);
      cta.classList.toggle("urgent", !!pw.urgent);
      cta.hidden = !pw.action;
    }

    const stepsEl = document.getElementById("pathway-steps");
    if (stepsEl) {
      const showSteps = guidedCoach || showcaseDemo || (S.releases || 0) < 15;
      stepsEl.innerHTML = showSteps ? renderPathwaySteps(S, hook) : "";
      stepsEl.hidden = !showSteps;
    }

    if (guidedCoach?.tab && S.tab !== guidedCoach.tab && stepNeedsTab(S, hook, guidedCoach.tab)) {
      S.tab = guidedCoach.tab;
      hook.render();
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    const rewardPending = claimableQuests(S) > 0 || loginPending || demoDots;
    const giftDot = document.getElementById("coach-gift-dot");
    if (giftDot) giftDot.hidden = !rewardPending;
  }

  function updateTabBadges(S, hook) {
    const today = new Date().toISOString().slice(0, 10);
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    const claimable = claimableQuests(S);
    const hireAfford = hook.ROLES && hook.hireCost && Object.keys(hook.ROLES).some((k) => S.yen >= hook.hireCost(k));
    const scoutAfford = (hook.castingCost && S.yen >= hook.castingCost()) || S.gems >= (hook.SCOUT_GEMS || 8);
    const starsUnlocked = (S.releases || 0) >= 2 || (S.totalFansEver || 0) >= 20;
    const freeGems = S.freeGemsDate !== today;
    const badges = {
      produce: readySlot(S, hook) >= 0,
      quests: claimable > 0 || loginPending,
      staff: !!hireAfford,
      stars: starsUnlocked && scoutAfford,
      store: freeGems,
    };
    document.querySelectorAll(".tab").forEach((tab) => {
      const k = tab.dataset.tab;
      const on = !!badges[k];
      tab.classList.toggle("tab-has-badge", on);
      tab.querySelector(".tab-badge")?.remove();
      if (on) {
        const b = document.createElement("span");
        b.className = "tab-badge";
        b.setAttribute("aria-hidden", "true");
        if (k === "quests" && claimable > 0) b.title = claimable + " reward" + (claimable > 1 ? "s" : "") + " ready";
        tab.appendChild(b);
      }
      const lbl = tab.querySelector(".tab-lbl");
      if (lbl && k === "quests") {
        const note = claimable > 0 ? " — rewards ready" : loginPending ? " — login reward ready" : "";
        lbl.setAttribute("aria-label", (tab.getAttribute("aria-label") || "Quests") + note);
      }
    });
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__hudPremiumInstalled) return false;
    hook.__hudPremiumInstalled = true;
    buildHudShell();
    organizeDrawerSlot();
    wireGoalBar();
    const origRender = hook.render;
    hook.render = function () {
      origRender();
      closeDrawer();
      organizeDrawerSlot();
      updateHud(hook.getState(), hook);
      updateTabBadges(hook.getState(), hook);
    };
    const origUpdateTop = window.updateTopBar;
    if (typeof origUpdateTop === "function") {
      window.updateTopBar = function () {
        origUpdateTop();
        updateHud(hook.getState(), hook);
      };
    }
    if (typeof hook.tapBoost === "function" && !hook.__hudComboTapHooked) {
      hook.__hudComboTapHooked = true;
      const origTap = hook.tapBoost;
      hook.tapBoost = function (slot) {
        origTap(slot);
        pulseHudCombo();
      };
    }
    hook.render();
    return true;
  }

  window.__AST_HUD__ = { organizeDrawerSlot, pulseHudCombo, goalMilestoneAction };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(buildHudShell, 0));
  } else buildHudShell();

  const poll = setInterval(() => { if (install()) clearInterval(poll); }, 60);
})();