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
        message: "Production ready — premiere now!",
        tab: "produce",
        cta: "Premiere",
        urgent: true,
        action: { type: "premiere", slot: ready },
      };
    }
    if ((S.releases || 0) < 15 && activeCount(S) > 0) {
      const pr = (S.projects || []).find(Boolean);
      if (pr) {
        const p = hook.getProject(pr.pid);
        if (p && pr.progress < p.work) {
          const st = S.staff || {};
          if ((st.director || 0) > 0) {
            return {
              message: "Assigning experienced directors increases final score!",
              tab: "produce",
              cta: "Team",
              urgent: false,
              action: { type: "tab", tab: "staff" },
            };
          }
          return {
            message: "Tap the poster to boost speed — or wait for your team",
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
    if ((S.staff?.director || 0) < 1 && activeCount(S) > 0 && (S.releases || 0) >= 1 && (S.releases || 0) < 12) {
      return {
        message: "Hire a Director — they boost your production score",
        tab: "staff",
        cta: "Hire",
        action: { type: "tab", tab: "staff" },
      };
    }
    if ((S.staff?.director || 0) >= 1 && activeCount(S) > 0 && (S.releases || 0) >= 2 && (S.releases || 0) < 15) {
      return {
        message: "Experienced directors increase your final production score",
        tab: "produce",
        cta: "Lines",
        action: { type: "tab", tab: "produce" },
      };
    }
    if ((S.releases || 0) < 8 && activeCount(S) > 0 && hook.hireCost && hook.ROLES) {
      const priority = ["director", "animator", "writer", "producer", "voice"];
      const afford = priority.find((k) => hook.ROLES[k] && S.yen >= hook.hireCost(k));
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
        <div class="hud-avatar-wrap" id="hud-avatar-wrap"><img class="hud-avatar" src="start-hero.png?v=86" alt=""><span class="hud-lv-badge" id="hud-lv-badge">1</span></div>
        <div class="hud-identity">
          <div class="hud-brand-line"><span class="hud-sakura-logo" aria-hidden="true">🌸</span><span class="hud-studio-name" id="hud-studio-name">Studio</span></div>
          <span class="hud-studio-rank-label" id="hud-studio-rank-label">Studio Rank C</span>
        </div>
        <div class="hud-brand-actions">
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
        <img class="coach-avatar" src="https://d8j0ntlcm91z4.cloudfront.net/user_342M7OMJEmtQi5ZXBKPVqJZUjCn/hf_20260614_063644_801c60be-70bb-4a64-99db-703283d57b54.jpeg?v=86" alt="" width="40" height="40">
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
      else if (main?.dataset.glView === "1") { hook.getState().tab = "quests"; hook.render(); }
      hook.play("click");
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

  function closeDrawer() {
    const d = document.getElementById("hud-drawer");
    if (d) d.hidden = true;
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
      const today = new Date().toISOString().slice(0, 10);
      const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
      mailBtn.classList.toggle("has-dot", claimableQuests(S) > 0 || loginPending || demoDots);
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
      if ((S.combo || 0) >= 2) {
        combo.classList.add("show");
        comboN.textContent = S.combo;
      } else combo.classList.remove("show");
    }

    const pw = analyzePathway(S, hook);
    window.__AST_PATHWAY__ = pw;

    const rail = document.getElementById("pathway-rail");
    if (rail) {
      rail.classList.toggle("coach-hidden", glView);
      if (!glView) delete rail.dataset.coachDismissed;
    }

    const nowEl = document.getElementById("pathway-now");
    if (nowEl) nowEl.textContent = pw.message;
    const cta = document.getElementById("pathway-cta");
    if (cta) {
      cta.textContent = "→";
      cta.setAttribute("aria-label", pw.cta || "Go");
      cta.classList.toggle("urgent", !!pw.urgent);
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