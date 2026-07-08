/**
 * Anime Studio Tycoon — HUD v3
 * Minimal chrome: compact stat bar, slim coach, icon dock, utility drawer.
 */
(function () {
  const QUEST_METRICS = {
    rel: "releases", rel2: "releases", yen: "yen", big: "yen", camp: "campaigns",
    hire: "hires", hire2: "hires", hype: "hypeSpent", scout: "scouts",
    green: "greenlit", tap: "taps", tap2: "taps",
  };

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

  function analyzePathway(S, hook) {
    const ready = readySlot(S, hook);
    if (ready >= 0) {
      return {
        message: "Production ready — hit Global Premiere!",
        tab: "produce",
        cta: "Premiere",
        urgent: true,
        action: { type: "tab", tab: "produce" },
      };
    }
    if ((S.releases || 0) < 5 && activeCount(S) > 0) {
      const pr = (S.projects || []).find(Boolean);
      if (pr) {
        const p = hook.getProject(pr.pid);
        if (p && pr.progress < p.work) {
          return {
            message: "Tap the poster to boost speed — or wait for your team",
            tab: "produce",
            cta: "Boost",
            urgent: false,
            action: { type: "tab", tab: "produce" },
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
        message: "Greenlight your first anime",
        tab: "produce",
        cta: "Greenlight",
        action: { type: "tab", tab: "produce" },
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
    if (claimableQuests(S) > 0) {
      return {
        message: "Quest rewards ready to claim",
        tab: "quests",
        cta: "Claim",
        urgent: true,
        action: { type: "tab", tab: "quests" },
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
    if (pw && pw.action && pw.action.type === "rating") {
      (document.getElementById("hud-studio-rating") || document.getElementById("studio-rank"))?.click();
      hook.play("click");
      return;
    }
    if (pw && pw.action && pw.action.type === "tab") {
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
      <div class="hud-top">
        <button type="button" class="hud-menu-btn" id="hud-menu-btn" aria-label="Menu">☰</button>
        <div class="hud-avatar-wrap"><img class="hud-avatar" src="start-hero.png?v=55" alt=""><span class="hud-lv-badge" id="hud-lv-badge">1</span></div>
        <div class="hud-identity">
          <span class="hud-studio-name" id="hud-studio-name">Studio</span>
          <div id="hud-studio-rating" class="hud-rating-chip" title="Studio rating"></div>
        </div>
        <span class="hud-trend-chip" id="hud-trend-chip"></span>
        <span class="hud-combo" id="hud-combo"><span id="hud-combo-n">0</span>x</span>
      </div>
      <div class="hud-stats" id="hud-resources"></div>
      <div class="hud-drawer" id="hud-drawer" hidden>
        <div class="hud-drawer-inner">
          <div class="hud-drawer-label">⚙️ Settings</div>
          <div id="hud-drawer-slot"></div>
        </div>
      </div>`;

    top.parentNode.insertBefore(shell, top);

    const resWrap = document.getElementById("hud-resources");
    const plusTab = { yen: "market", fans: "market", gems: "store" };
    ["yen", "fans", "gems"].forEach((k) => {
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
        <img class="coach-avatar" src="https://d8j0ntlcm91z4.cloudfront.net/user_342M7OMJEmtQi5ZXBKPVqJZUjCn/hf_20260614_063644_801c60be-70bb-4a64-99db-703283d57b54.jpeg?v=55" alt="" width="40" height="40">
        <div class="coach-body">
          <span class="coach-label">Coach's Tip</span>
          <p class="coach-msg" id="pathway-now"></p>
        </div>
        <button type="button" class="coach-cta" id="pathway-cta">→</button>
        <button type="button" class="coach-gift" id="coach-gift" aria-label="Rewards"><span class="coach-gift-ic">🎁</span><span class="coach-gift-dot" id="coach-gift-dot" hidden></span></button>
        <button type="button" class="coach-dismiss" id="coach-dismiss" aria-label="Dismiss">×</button>
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

    document.documentElement.classList.add("premium-hud", "hud-v3-active");

    document.getElementById("pathway-cta").addEventListener("click", runPathwayAction);
    document.getElementById("coach-gift").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      hook.getState().tab = "quests";
      hook.render();
      hook.play("click");
      closeDrawer();
    });
    document.getElementById("coach-dismiss").addEventListener("click", () => {
      const rail = document.getElementById("pathway-rail");
      if (rail) {
        rail.classList.add("coach-hidden");
        rail.dataset.coachDismissed = "1";
      }
    });
    document.getElementById("hud-menu-btn").addEventListener("click", () => {
      const d = document.getElementById("hud-drawer");
      if (d) d.hidden = !d.hidden;
    });
    const drawer = document.getElementById("hud-drawer");
    drawer.addEventListener("click", (e) => {
      if (e.target.id === "hud-drawer") e.currentTarget.hidden = true;
    });
    drawerSlot.addEventListener("click", (e) => {
      if (e.target.closest("button, select, a")) drawer.hidden = true;
    });
  }

  function closeDrawer() {
    const d = document.getElementById("hud-drawer");
    if (d) d.hidden = true;
  }

  function updateHud(S, hook) {
    buildHudShell();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("hud-studio-name", S.studioName || "Your Studio");
    const lv = document.getElementById("hud-lv-badge");
    if (lv) lv.textContent = String(S.studioLevel || 1);

    const trend = hook.trendGenre ? hook.trendGenre() : "Action";
    set("hud-trend-chip", "📈 " + trend);
    const trendEl = document.getElementById("trend");
    if (trendEl) trendEl.textContent = trend;

    const combo = document.getElementById("hud-combo");
    const comboN = document.getElementById("hud-combo-n");
    if (combo && comboN) {
      if ((S.combo || 0) >= 2) {
        combo.classList.add("show");
        comboN.textContent = S.combo;
      } else combo.classList.remove("show");
    }

    const pw = analyzePathway(S, hook);
    window.__AST_PATHWAY__ = pw;

    const rail = document.getElementById("pathway-rail");
    const showCoach = !!pw.urgent || (S.releases || 0) < 3;
    if (rail) {
      if (showCoach) {
        rail.classList.remove("coach-hidden");
        delete rail.dataset.coachDismissed;
      } else if (!rail.dataset.coachDismissed) {
        rail.classList.add("coach-hidden");
      }
    }

    const nowEl = document.getElementById("pathway-now");
    if (nowEl) nowEl.textContent = pw.message;
    const cta = document.getElementById("pathway-cta");
    if (cta) {
      cta.textContent = pw.cta;
      cta.classList.toggle("urgent", !!pw.urgent);
    }

    const today = new Date().toISOString().slice(0, 10);
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    const rewardPending = claimableQuests(S) > 0 || loginPending;
    const giftDot = document.getElementById("coach-gift-dot");
    if (giftDot) giftDot.hidden = !rewardPending;
  }

  function updateTabBadges(S, hook) {
    const today = new Date().toISOString().slice(0, 10);
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    const hireAfford = hook.ROLES && hook.hireCost && Object.keys(hook.ROLES).some((k) => S.yen >= hook.hireCost(k));
    const scoutAfford = (hook.castingCost && S.yen >= hook.castingCost()) || S.gems >= (hook.SCOUT_GEMS || 8);
    const starsUnlocked = (S.releases || 0) >= 2 || (S.totalFansEver || 0) >= 20;
    const freeGems = S.freeGemsDate !== today;
    const badges = {
      produce: readySlot(S, hook) >= 0,
      quests: claimableQuests(S) > 0 || loginPending,
      staff: !!hireAfford,
      stars: starsUnlocked && scoutAfford,
      store: freeGems,
    };
    document.querySelectorAll(".tab").forEach((tab) => {
      const k = tab.dataset.tab;
      tab.querySelector(".tab-badge")?.remove();
      if (badges[k]) {
        const b = document.createElement("span");
        b.className = "tab-badge";
        tab.appendChild(b);
      }
    });
  }

  function install() {
    const hook = window.__AST_HOOK__;
    if (!hook || hook.__hudPremiumInstalled) return false;
    hook.__hudPremiumInstalled = true;
    buildHudShell();
    const origRender = hook.render;
    hook.render = function () {
      origRender();
      closeDrawer();
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
    hook.render();
    return true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(buildHudShell, 0));
  } else buildHudShell();

  const poll = setInterval(() => { if (install()) clearInterval(poll); }, 60);
})();