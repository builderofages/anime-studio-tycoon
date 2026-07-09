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
      target: (S, hook) => staffHireTutorialTarget(S, hook),
      done: (S) => staffTotal(S) > 0,
      coach: (S, hook) => {
        const onStaff = S.tab === "staff";
        const btn = staffHireTutorialTarget(S, hook);
        const role = btn?.dataset?.hire || btn?.dataset?.staffHire;
        if (onStaff && role && hook.ROLES?.[role]) {
          return {
            message: `Tap Hire on ${hook.ROLES[role].name} — crew speeds every show`,
            tab: "staff",
            cta: "Hire",
            urgent: true,
            action: { type: "hire", role },
          };
        }
        return {
          message: "Open Recruit and hire your first team member",
          tab: "staff",
          cta: "Recruit",
          urgent: true,
          action: { type: "tab", tab: "staff" },
        };
      },
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
  let _renderMain = null;
  let _drawerPrevFocus = null;

  function staffHireTutorialTarget(S, hook) {
    const priority = ["animator", "writer", "director", "voice", "producer"];
    if (S.tab === "staff") {
      for (const k of priority) {
        const btn = document.querySelector(`[data-staff-hire="${k}"]:not([disabled])`);
        if (btn) return btn;
      }
      const hero = document.getElementById("staff-hero-cta");
      if (hero && !hero.disabled && hero.dataset.hire) return hero;
    }
    return document.querySelector('.tab[data-tab="staff"]');
  }

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
    const target = typeof step.target === "function" ? step.target(S, hook) : step.target?.();
    if (target) {
      target.classList.add("gt-highlight");
      _gtHighlight = target;
      requestAnimationFrame(() => {
        try { target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); } catch (_e) {}
      });
      if (step.id === "hire" && S.tab === "staff" && target.matches?.(".tab")) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const retry = typeof step.target === "function" ? step.target(S, hook) : null;
            if (retry && !retry.matches?.(".tab")) {
              clearGtHighlight();
              retry.classList.add("gt-highlight");
              _gtHighlight = retry;
              try { retry.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); } catch (_e) {}
            }
          });
        });
      }
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

  function studioRankUpCoach(S, hook) {
    const prog = hook.studioRankProgress ? hook.studioRankProgress(S) : null;
    if (prog && (S.studioStars || 1) < 5) {
      if (prog.ready) {
        return {
          message: `⭐ Ready for ${prog.tier?.name || "studio rank up"}!`,
          tab: "studio",
          cta: "Promote",
          urgent: true,
          action: { type: "rating" },
        };
      }
      if (prog.pct >= 50) {
        const weak = (prog.pillars || []).filter((p) => !p.done).sort((a, b) => a.pct - b.pct)[0];
        if (weak) {
          const cur = hook.fmt ? hook.fmt(weak.cur) : String(weak.cur);
          const need = hook.fmt ? hook.fmt(weak.need) : String(weak.need);
          const tab =
            weak.id === "team" ? "staff"
              : weak.id === "talent" ? "stars"
                : weak.id === "share" ? "market"
                  : "produce";
          return {
            message: `${prog.pct}% to ${prog.tier?.name || "next rank"} — ${weak.label} ${cur}/${need}`,
            tab,
            cta: "Rank up",
            urgent: prog.pct >= 80,
            action: { type: "rating" },
          };
        }
      }
    }
    const nextRank = hook.nextContentRank ? hook.nextContentRank(S.fans || 0) : null;
    if (nextRank) {
      const gap = nextRank.fans - (S.fans || 0);
      if (gap > 0 && gap <= Math.max(3, Math.round(nextRank.fans * 0.12))) {
        const gapTxt = hook.fmt ? hook.fmt(gap) : String(gap);
        const marketOk = hook.featureUnlocked ? hook.featureUnlocked("market") : (S.fans || 0) >= 50;
        return {
          message: `${gapTxt} fans to unlock ${nextRank.unlock}!`,
          tab: marketOk ? "market" : "produce",
          cta: "Grow",
          action: { type: "tab", tab: marketOk ? "market" : "produce" },
        };
      }
    }
    return null;
  }

  function pwaHomeScreenCoach(S, hook) {
    if (hook.isStandalonePwa && hook.isStandalonePwa()) return null;
    if (!hook.isMobilePlayDevice || !hook.isMobilePlayDevice()) return null;
    if ((S.releases || 0) < 2) return null;
    if (S.pwaInstalled || S.pwaCoachSeen) return null;
    if (!S.pwaInstallDismissed && hook.maybeShowPwaInstallBanner) {
      const banner = document.getElementById("pwa-install-banner");
      if (banner && !banner.hidden) return null;
    }
    return {
      message: "📲 Add to Home Screen — play offline & launch like an app",
      tab: "produce",
      cta: "Install",
      urgent: false,
      action: { type: "pwa-coach" },
    };
  }

  function franchiseOpportunityCoach(S, hook) {
    const opp = S.franchiseOpportunity;
    if (!opp?.base) return null;
    const empties = Math.max(0, (S.slots || 1) - activeCount(S));
    if (empties <= 0) return null;
    const season = (S.franchises?.[opp.base] || 1) + 1;
    const title = hook.sequelTitle ? hook.sequelTitle(opp.base, season) : `${opp.base} II`;
    return {
      message: `Your hit deserves a sequel — greenlight ${title}`,
      tab: "produce",
      cta: "Sequel",
      urgent: true,
      showOnGreenlight: true,
      action: { type: "franchise-sequel", base: opp.base, genre: opp.genre },
    };
  }

  function nextUnlockPreviewCoach(S, hook) {
    const rel = S.releases || 0;
    if (rel > 1) return null;
    const order = [
      { key: "studio", label: "🏢 Studio", prog: () => hook.studioUnlockProgress?.() },
      { key: "stars", label: "⭐ Stars", prog: () => hook.starsUnlockProgress?.() },
      { key: "market", label: "📣 Marketing", prog: () => hook.marketUnlockProgress?.() },
    ];
    for (const item of order) {
      if (hook.featureUnlocked?.(item.key)) continue;
      const hint = item.prog?.();
      if (!hint) continue;
      return {
        message: `🔓 Next unlock: ${item.label} — ${hint}`,
        tab: "produce",
        cta: rel === 0 ? "Start" : "Play",
        action: { type: "tab", tab: "produce" },
        nextUnlock: true,
      };
    }
    return null;
  }

  function festivalInviteCoach(S, hook) {
    if ((S.releases || 0) < 5) return null;
    const pending = hook.festivalInvitePending && hook.festivalInvitePending();
    const cost = hook.festivalEntryCost ? hook.festivalEntryCost() : 0;
    const afford = S.yen >= cost;
    if (pending) {
      const costTxt = hook.fmt ? hook.fmt(cost) : String(cost);
      return {
        message: afford
          ? "🎪 Festival invite — enter for fans, hype & circuit prestige!"
          : `🎪 Festival invite — save ¥${costTxt} for entry`,
        tab: "produce",
        cta: afford ? "Enter" : "Save",
        urgent: afford,
        action: { type: "festival-decision" },
      };
    }
    if (afford && (S.festivalWins || []).length < 5 && (hook.dynastyAvailable?.() || 0) < 30) {
      return {
        message: "🎪 You can afford festival entry — watch for invites!",
        tab: "produce",
        cta: "Play",
        action: { type: "tab", tab: "produce" },
      };
    }
    return null;
  }

  function dynastyPerkCoach(S, hook) {
    if ((S.releases || 0) < 10) return null;
    const avail = hook.dynastyAvailable
      ? hook.dynastyAvailable()
      : Math.max(0, (S.dynastyPoints || 0) - (S.dynastySpent || 0));
    if (avail < 12) return null;
    const score = hook.dynastyScore ? hook.dynastyScore() : 0;
    const dg = hook.dynastyGrade ? hook.dynastyGrade(score) : { g: "", label: "" };
    const peak = S.peakDynasty || score;
    const msg = avail >= 20
      ? `👑 ${avail} dynasty pts ready — invest in permanent perks`
      : `👑 ${avail} dynasty pts — open Perk Shop in Studio`;
    const sub = dg.g ? ` · ${dg.g}-rank ${score} (peak ${peak})` : "";
    return {
      message: msg + sub,
      tab: "studio",
      cta: "Perks",
      urgent: avail >= 20,
      action: { type: "dynasty-perks" },
    };
  }

  function fanMilestoneMarketCoach(S, hook) {
    const milestones = hook.FAN_TOAST_MILESTONES || [{ fans: 10 }, { fans: 50 }, { fans: 100 }];
    const target = milestones.map((m) => m.fans).find((f) => S.fans < f);
    if (!target) return null;
    const gap = target - S.fans;
    const stuck = gap > 0 && gap <= Math.max(4, Math.round(target * 0.15));
    if (!stuck) return null;
    const marketOk = hook.featureUnlocked ? hook.featureUnlocked("market") : (S.fans || 0) >= 50;
    if (!marketOk) {
      if (target === 50 && S.fans >= 38) {
        const need = 50 - S.fans;
        return {
          message: `${hook.fmt ? hook.fmt(need) : need} fans until Marketing unlocks`,
          tab: "produce",
          cta: "Play",
          action: { type: "tab", tab: "produce" },
        };
      }
      return null;
    }
    const camps = hook.CAMPAIGNS || [];
    const afford = camps.find((c) => S.yen >= c.cost);
    if (!afford) return null;
    const gapTxt = hook.fmt ? hook.fmt(gap) : String(gap);
    const targetTxt = hook.fmt ? hook.fmt(target) : String(target);
    const fanTxt = hook.fmt ? hook.fmt(afford.fans) : String(afford.fans);
    return {
      message: `${gapTxt} fans to ${targetTxt} — ${afford.name} adds +${fanTxt}`,
      tab: "market",
      cta: "Campaign",
      urgent: gap <= afford.fans,
      action: { type: "tab", tab: "market" },
    };
  }

  function firstGemSpendCoach(S, hook) {
    if (S.gemSpent) return null;
    const gems = S.gems || 0;
    if (gems < 4) return null;
    if ((S.releases || 0) < 1) return null;
    const active = activeCount(S);
    if (active > 0 && gems >= 4) {
      return {
        message: "4💎 Skip Production — finish your show instantly",
        tab: "store",
        cta: "Spend",
        urgent: false,
        action: { type: "tab", tab: "store", focus: "gem-spend" },
      };
    }
    if (gems >= 5) {
      return {
        message: "5💎 Hype Boost — great before your next greenlight",
        tab: "store",
        cta: "Spend",
        urgent: false,
        action: { type: "tab", tab: "store", focus: "gem-spend" },
      };
    }
    return null;
  }

  function chaosDisasterCoach(S, hook) {
    const chaosOk = hook.featureUnlocked ? hook.featureUnlocked("chaos") : (S.releases || 0) >= 10;
    if (!chaosOk) return null;
    const ch = S.chaos || 0;
    if (ch <= 50) return null;
    const chR = Math.round(ch);
    const affordCalm = (S.gems || 0) >= 6;
    return {
      message: `Chaos at ${chR}% — disaster looming! ${affordCalm ? "Grab a Calm Orb or" : ""} ease production pressure.`,
      tab: affordCalm && ch >= 55 ? "store" : "produce",
      cta: affordCalm && ch >= 55 ? "Calm Orb" : "Produce",
      urgent: ch >= 60,
      action: affordCalm && ch >= 55
        ? { type: "tab", tab: "store" }
        : { type: "tab", tab: "produce" },
    };
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
      const multi = (S.slots || 1) > 1;
      return {
        message: multi ? `Line ${ready + 1} ready — premiere now!` : "Production ready — premiere now!",
        tab: "produce",
        cta: "Premiere",
        urgent: true,
        showOnGreenlight: true,
        action: multi
          ? { type: "produce-slot-focus", slot: ready, thenPremiere: true }
          : { type: "premiere", slot: ready },
      };
    }

    if (!glView && (S.slots || 1) > 1) {
      const empties = Math.max(0, (S.slots || 1) - activeCount(S));
      if (empties === 1 && activeCount(S) > 0) {
        const emptyIx = (S.projects || []).findIndex((p) => !p);
        return {
          message: "You have an open production line — fill your open slot!",
          tab: "produce",
          cta: "Greenlight",
          urgent: true,
          action: emptyIx >= 0 ? { type: "produce-slot-empty", slot: emptyIx } : { type: "gl-focus" },
        };
      }
    }

    const franchiseCoach = franchiseOpportunityCoach(S, hook);
    if (franchiseCoach) return franchiseCoach;

    const chaosWarn = chaosDisasterCoach(S, hook);
    if (chaosWarn) return chaosWarn;

    const marketUnlocked = hook.featureUnlocked ? hook.featureUnlocked("market") : (S.fans || 0) >= 50;
    if (marketUnlocked && (S.campaignsRun || 0) === 0 && (S.releases || 0) < 15) {
      const camps = hook.CAMPAIGNS || [];
      const afford = camps.find((c) => S.yen >= c.cost);
      if (afford) {
        return {
          message: `Marketing unlocked — run ${afford.name} for quick fans`,
          tab: "market",
          cta: "Market",
          urgent: true,
          action: { type: "tab", tab: "market" },
        };
      }
    }

    const fanMarketCoach = fanMilestoneMarketCoach(S, hook);
    if (fanMarketCoach) return fanMarketCoach;

    const rankCoach = studioRankUpCoach(S, hook);
    if (rankCoach) return rankCoach;

    const festivalCoach = festivalInviteCoach(S, hook);
    if (festivalCoach) return festivalCoach;

    const dynastyCoach = dynastyPerkCoach(S, hook);
    if (dynastyCoach) return dynastyCoach;

    const chaosUnlocked = hook.featureUnlocked ? hook.featureUnlocked("chaos") : (S.releases || 0) >= 10;
    if (chaosUnlocked && !S.chaosMode && (S.releases || 0) >= 10 && (S.releases || 0) <= 25) {
      return {
        message: "Chaos Mode unlocked — enable for +50% rewards (crises rise faster)",
        tab: "produce",
        cta: "Chaos",
        urgent: (S.chaos || 0) < 35,
        action: { type: "chaos-enable" },
      };
    }

    const rel = S.releases || 0;
    if (!chaosUnlocked && rel >= 5 && rel < 10) {
      const need = 10 - rel;
      const needTxt = hook.fmt ? hook.fmt(need) : String(need);
      return {
        message: `${needTxt} left — 10 premieres to unlock Chaos Mode`,
        tab: "produce",
        cta: "Play",
        action: { type: "tab", tab: "produce" },
      };
    }

    const starsUnlocked = hook.featureUnlocked ? hook.featureUnlocked("stars") : (S.releases || 0) >= 2;
    if (starsUnlocked && (S.stars || []).length === 0 && (S.releases || 0) >= 2 && (S.releases || 0) <= 8) {
      const freeScout = (S.releases || 0) === 2 && !S.freeScoutUsed;
      return {
        message: freeScout
          ? "Stars unlocked — your first scout is FREE!"
          : "Scout star talent for bigger premieres",
        tab: "stars",
        cta: freeScout ? "Free Scout" : "Stars",
        urgent: true,
        action: { type: "tab", tab: "stars" },
      };
    }

    const researchUnlocked = hook.featureUnlocked ? hook.featureUnlocked("research") : (S.totalFansEver || 0) >= 120;
    const researchTabOk = researchUnlocked && (!hook.tabAccessible || hook.tabAccessible("research"));
    if (researchTabOk && typeof hook.researchCost === "function" && hook.trendGenre) {
      const trend = hook.trendGenre();
      const { cost, hypeCost } = hook.researchCost(trend);
      const totalMastery = hook.totalMasteryLevels ? hook.totalMasteryLevels() : 0;
      if (S.yen >= cost && S.hype >= hypeCost) {
        return {
          message: totalMastery === 0
            ? `🔬 Research ${trend} — trending genre boosts every premiere`
            : `🔬 Level ${trend} mastery — it's trending for bonus rewards`,
          tab: "research",
          cta: "Lab",
          urgent: totalMastery === 0,
          action: { type: "tab", tab: "research" },
        };
      }
    }

    if (glView) {
      const empties = Math.max(0, (S.slots || 1) - activeCount(S));
      if (empties > 0) {
        const trend = hook.suggestedGreenlightGenre ? hook.suggestedGreenlightGenre() : (hook.trendGenre ? hook.trendGenre() : "Action");
        const midGame = (S.releases || 0) >= 2 && (S.releases || 0) <= 10;
        return {
          message: midGame
            ? `🔥 ${trend} trending — tap Use pick for bonus fans & yen`
            : showcase
              ? `Pick a project — 🔥 ${trend} is trending for bonus rewards`
              : empties === 1
                ? "Choose a project — greenlight to fill your open slot"
                : "Choose a project and greenlight to fill your open slots",
          tab: "produce",
          cta: midGame ? "Trending" : "Greenlight",
          urgent: !showcase,
          showOnGreenlight: true,
          action: midGame && typeof hook.applyTrendingGenreSuggest === "function"
            ? { type: "gl-suggest-trend" }
            : { type: "gl-focus" },
        };
      }
    }

    if (!glView && (S.slots || 1) > 1 && activeCount(S) > 1) {
      let best = -1;
      let bestPct = 2;
      (S.projects || []).forEach((pr, i) => {
        if (!pr) return;
        const p = hook.getProject(pr.pid);
        if (!p || pr.progress >= p.work) return;
        const pct = pr.progress / p.work;
        if (pct < bestPct) {
          bestPct = pct;
          best = i;
        }
      });
      if (best >= 0) {
        const hud = hook.produceSlotHud ? hook.produceSlotHud() : null;
        const lines = hud ? `${hud.active}/${hud.total} lines active` : "Multiple lines active";
        return {
          message: `${lines} — boost your slowest show`,
          tab: "produce",
          cta: "Boost",
          action: { type: "produce-slot-focus", slot: best },
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
    if (
      (S.releases || 0) >= 1 &&
      (S.slots || 1) === 1 &&
      hook.expandCost &&
      S.yen >= hook.expandCost() &&
      (S.releases || 0) <= 12
    ) {
      return {
        message: "Expand your studio — unlock a second production line!",
        tab: "studio",
        cta: "Expand",
        urgent: true,
        action: { type: "studio-expand" },
      };
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
    if (!starsUnlocked && (S.releases || 0) >= 1 && (S.releases || 0) < 2) {
      const prog = hook.starsUnlockProgress ? hook.starsUnlockProgress() : null;
      if (prog) {
        return {
          message: prog,
          tab: "produce",
          cta: "Play",
          action: { type: "tab", tab: "produce" },
        };
      }
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
    const gemSpendCoach = firstGemSpendCoach(S, hook);
    if (gemSpendCoach) return gemSpendCoach;

    const todayGems = new Date().toISOString().slice(0, 10);
    if (S.freeGemsDate !== todayGems) {
      return {
        message: "Claim your free +10 💎 in the Store — resets daily",
        tab: "store",
        cta: "Claim",
        urgent: true,
        action: { type: "tab", tab: "store", focus: "freegems" },
      };
    }
    const dynastyFallback = dynastyPerkCoach(S, hook);
    if (dynastyFallback) return dynastyFallback;
    const pwaCoach = pwaHomeScreenCoach(S, hook);
    if (pwaCoach) return pwaCoach;
    const nextUnlockCoach = nextUnlockPreviewCoach(S, hook);
    if (nextUnlockCoach) return nextUnlockCoach;
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
    if (pw.action.type === "gl-suggest-trend" && typeof hook.applyTrendingGenreSuggest === "function") {
      hook.applyTrendingGenreSuggest();
      return;
    }
    if (pw.action.type === "gl-focus") {
      const btn = document.querySelector(".aaa-gl-confirm-banner, .aaa-gl-card.sel, .aaa-gl-trend-suggest-btn");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
      hook.play("click");
      return;
    }
    if (pw.action.type === "produce-slot-empty" || pw.action.type === "produce-slot-focus") {
      const needRender = hook.getState().tab !== "produce";
      hook.getState().tab = "produce";
      if (needRender) hook.render();
      if (typeof hook.focusProduceSlot === "function") {
        requestAnimationFrame(() => hook.focusProduceSlot(pw.action.slot ?? hook.firstEmptySlot?.() ?? 0, true));
      } else if (!needRender) hook.render();
      if (pw.action.thenPremiere && typeof hook.releaseProject === "function") {
        requestAnimationFrame(() => hook.releaseProject(pw.action.slot));
      } else if (pw.action.thenBoost && typeof hook.tapBoost === "function") {
        requestAnimationFrame(() => hook.tapBoost(pw.action.slot));
      }
      hook.play("click");
      return;
    }
    if (pw.action.type === "studio-expand") {
      hook.getState().tab = "studio";
      hook.render();
      hook.play("click");
      requestAnimationFrame(() => {
        const btn = document.querySelector(".aaa-studio-expand-btn,[data-act='expand']");
        if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    if (pw.action.type === "franchise-sequel" && typeof hook.focusFranchiseSequel === "function") {
      hook.getState().tab = "produce";
      hook.focusFranchiseSequel(pw.action.base, pw.action.genre);
      hook.play("click");
      return;
    }
    if (pw.action.type === "pwa-coach") {
      const S = hook.getState();
      S.pwaCoachSeen = true;
      hook.save?.();
      if (typeof hook.triggerPwaInstall === "function") hook.triggerPwaInstall();
      else hook.toast?.("📲 Tap Share → Add to Home Screen to install", true);
      hook.render();
      hook.play("click");
      return;
    }
    if (pw.action.type === "festival-decision") {
      hook.play("click");
      const modal = document.getElementById("decision");
      if (modal && modal.style.display === "flex" && hook.festivalInvitePending?.()) {
        modal.scrollIntoView({ behavior: "smooth", block: "center" });
        const yes = modal.querySelector("[data-act='dec-yes']:not([disabled])");
        if (yes) yes.focus();
      } else if (typeof hook.openFestivalDecisionModal === "function") {
        hook.openFestivalDecisionModal();
      } else {
        hook.toast?.("🎪 Festival invite will pop up during play — keep producing!");
      }
      return;
    }
    if (pw.action.type === "dynasty-perks") {
      hook.getState().tab = "studio";
      hook.render();
      hook.play("click");
      requestAnimationFrame(() => {
        document.getElementById("dynasty-perk-shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    if (pw.action.type === "chaos-enable") {
      if (typeof hook.toggleChaosMode === "function" && !hook.getState().chaosMode) hook.toggleChaosMode();
      else {
        hook.getState().chaosMode = true;
        hook.getState().tab = "produce";
        hook.render();
        hook.save?.();
      }
      hook.play("click");
      requestAnimationFrame(() => {
        document.getElementById("hud-chaos-pill")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      return;
    }
    if (pw.action.type === "tab") {
      const dest = pw.action.tab;
      if (hook.tabLocked?.(dest)) {
        hook.toast?.(hook.tabLockLabel?.(dest) || "🔒 Keep playing to unlock this tab");
      } else {
        hook.getState().tab = dest;
        hook.render();
        if (pw.action.focus === "freegems") {
          requestAnimationFrame(() => {
            document.querySelector(".aaa-free-gems-btn:not([disabled])")?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        } else if (pw.action.focus === "gem-spend") {
          requestAnimationFrame(() => {
            document.getElementById("aaa-gem-spend")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      }
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
      <div class="hud-drawer" id="hud-drawer" hidden aria-hidden="true" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="hud-drawer-inner" tabindex="-1">
          <div class="hud-drawer-label">⚙️ Settings</div>
          <div id="hud-drawer-slot"></div>
        </div>
      </div>`;

    top.parentNode.insertBefore(shell, top);

    const resWrap = document.getElementById("hud-resources");
    const marketTab = (hook) => (hook.featureUnlocked?.("market") ? "market" : "produce");
    const plusTab = (hook) => ({ yen: marketTab(hook), fans: marketTab(hook), gems: "store", hype: "produce" });
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
        const dest = plusTab(hook)[k];
        if (hook.tabLocked?.(dest)) hook.toast?.(hook.tabLockLabel?.(dest) || "🔒 Keep playing to unlock this tab");
        else { hook.getState().tab = dest; hook.render(); }
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
      rail.setAttribute("role", "region");
      rail.setAttribute("aria-label", "Coach tips");
      rail.innerHTML = `
        <img class="coach-avatar" src="https://d8j0ntlcm91z4.cloudfront.net/user_342M7OMJEmtQi5ZXBKPVqJZUjCn/hf_20260614_063644_801c60be-70bb-4a64-99db-703283d57b54.jpeg?v=88" alt="Coach avatar" width="40" height="40">
        <div class="coach-body">
          <span class="coach-label" id="coach-label">Coach's Tip</span>
          <p class="coach-msg" id="pathway-now" aria-live="polite" aria-labelledby="coach-label"></p>
        </div>
        <button type="button" class="coach-cta" id="pathway-cta" aria-label="Go to next action">→</button>
        <button type="button" class="coach-gift" id="coach-gift" aria-label="Rewards and quests"><span class="coach-gift-ic" aria-hidden="true">🎁</span><span class="coach-gift-dot" id="coach-gift-dot" hidden></span></button>
        <div class="pathway-steps" id="pathway-steps" hidden></div>`;
      const goal = document.getElementById("goal");
      if (goal && !document.getElementById("rival-race")) {
        const race = document.createElement("div");
        race.id = "rival-race";
        race.className = "rival-race-widget";
        race.hidden = true;
        race.innerHTML = `
          <span class="rival-race-ic" aria-hidden="true">🏁</span>
          <div class="rival-race-main">
            <span class="rival-race-rank">#<b id="rival-race-n">—</b></span>
            <span class="rival-race-total" id="rival-race-total"></span>
          </div>
          <div class="rival-race-detail">
            <span class="rival-race-copy" id="rival-race-copy">Industry race</span>
            <span class="rival-race-gap" id="rival-race-gap" hidden></span>
          </div>
          <div class="rival-race-leaders" id="rival-race-leaders" hidden></div>`;
        goal.parentNode.insertBefore(race, goal.nextSibling);
      }
      goal.parentNode.insertBefore(rail, (document.getElementById("rival-race") || goal).nextSibling);
    }

    const tabs = document.getElementById("tabs");
    if (tabs && !document.getElementById("command-dock")) {
      const dock = document.createElement("div");
      dock.id = "command-dock";
      tabs.parentNode.insertBefore(dock, tabs);
      dock.appendChild(tabs);
    }
    if (tabs) {
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", "Studio navigation");
      wireTabKeyboardNav();
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
      petals.innerHTML = Array.from({ length: 22 }, (_, i) =>
        `<i class="petal" style="--d:${(i * 0.42).toFixed(1)}s;--x:${(i * 4.7 + (i % 3) * 11) % 100}%;--s:${0.55 + (i % 5) * 0.12}"></i>`
      ).join("");
      document.body.appendChild(petals);
    }

    document.getElementById("hud-back-btn").addEventListener("click", () => {
      const hook = window.__AST_HOOK__;
      if (!hook) return;
      const main = document.getElementById("main");
      if (main?.dataset.glView === "1") {
        hook.getState().tab = "produce";
        if (hook.greenlightBack) hook.greenlightBack();
        else hook.render();
      } else if (main?.dataset.glBack === "1" && hook.greenlightBack) {
        hook.greenlightBack();
      }
      hook.play("click");
    });
    wireRatingChip();
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
      if (e.target.id === "hud-drawer") closeDrawer();
    });
    drawerSlot.addEventListener("click", (e) => {
      if (e.target.closest("button, select, a")) closeDrawer();
    });
    if (!document.body.dataset.hudDrawerEscWired) {
      document.body.dataset.hudDrawerEscWired = "1";
      document.addEventListener("keydown", (e) => {
        const d = document.getElementById("hud-drawer");
        if (!d || d.hidden) return;
        if (e.key === "Escape") {
          closeDrawer();
          return;
        }
        if (e.key !== "Tab") return;
        const inner = d.querySelector(".hud-drawer-inner");
        if (!inner) return;
        const items = [...inner.querySelectorAll(
          'button:not([disabled]), select:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )].filter((el) => !el.hidden && el.getAttribute("aria-hidden") !== "true");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !inner.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !inner.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      });
    }
  }

  function wireRatingChip() {
    const chip = document.getElementById("hud-studio-rating");
    if (!chip || chip.dataset.hudRatingWired) return;
    chip.dataset.hudRatingWired = "1";
    chip.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      chip.click();
    });
  }

  function wireTabKeyboardNav() {
    const tabs = document.getElementById("tabs");
    if (!tabs || tabs.dataset.hudTabKeysWired) return;
    tabs.dataset.hudTabKeysWired = "1";
    tabs.addEventListener("keydown", (e) => {
      const tabEls = [...tabs.querySelectorAll('.tab[role="tab"]:not([aria-disabled="true"])')];
      if (!tabEls.length) return;
      const idx = tabEls.indexOf(document.activeElement);
      let next = -1;
      if (e.key === "ArrowRight") next = idx < 0 ? 0 : (idx + 1) % tabEls.length;
      else if (e.key === "ArrowLeft") next = idx < 0 ? tabEls.length - 1 : (idx - 1 + tabEls.length) % tabEls.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabEls.length - 1;
      else return;
      e.preventDefault();
      tabEls[next]?.focus();
    });
  }

  function wireHudChipKeyboard(el) {
    if (!el || el.dataset.hudChipKeysWired) return;
    el.dataset.hudChipKeysWired = "1";
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      el.click();
    });
  }

  function openDrawer() {
    const d = document.getElementById("hud-drawer");
    if (!d) return;
    _drawerPrevFocus = document.activeElement;
    d.hidden = false;
    d.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      const first = d.querySelector(".hud-drawer-inner button:not([disabled]), .hud-drawer-inner select, .hud-drawer-inner a");
      (first || d.querySelector(".hud-drawer-inner"))?.focus?.();
    });
  }

  function closeDrawer() {
    const d = document.getElementById("hud-drawer");
    if (!d) return;
    d.hidden = true;
    d.setAttribute("aria-hidden", "true");
    if (_drawerPrevFocus && typeof _drawerPrevFocus.focus === "function") {
      try { _drawerPrevFocus.focus(); } catch (_e) {}
    }
    _drawerPrevFocus = null;
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

    let notifyG = slot.querySelector('.hud-drawer-group[data-drawer-group="notify"]');
    if (!notifyG) {
      notifyG = document.createElement("div");
      notifyG.className = "hud-drawer-group";
      notifyG.dataset.drawerGroup = "notify";
      const lbl = document.createElement("div");
      lbl.className = "hud-drawer-sublabel";
      lbl.textContent = "Alerts";
      notifyG.appendChild(lbl);
    }
    let pushBtn = document.getElementById("btn-push-notify");
    if (!pushBtn) {
      pushBtn = document.createElement("button");
      pushBtn.type = "button";
      pushBtn.id = "btn-push-notify";
      pushBtn.className = "btn-ghost hud-drawer-owned";
      pushBtn.dataset.act = "push-notify-show";
      pushBtn.textContent = "🔔 Premiere Alerts";
    }
    if (pushBtn.parentNode !== notifyG) notifyG.appendChild(pushBtn);

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
      slot.appendChild(notifyG);
      slot.appendChild(resetG);
      slot.appendChild(soundG);
      slot.appendChild(langG);
      slot.appendChild(moreG);
      slot.dataset.organized = "1";
    } else if (notifyG.parentNode !== slot) {
      slot.insertBefore(notifyG, slot.firstChild);
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
    const milestones = hook.allGoalMilestones ? hook.allGoalMilestones() : (hook.MILESTONES || []);
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
      } else if ((fans === 50 || fans === 100) && hook.featureUnlocked?.("market")) {
        tab = "market";
        selectors = [".aaa-market-afford", ".aaa-market-run-afford", "[data-camp]", ".aaa-market-card"];
      } else if (fans === 10) {
        tab = "produce";
        selectors = [".aaa-play-btn", ".aaa-poster", ".aaa-premiere-ready", ".aaa-gl-open"];
      } else if ((S.releases || 0) < 1 && staffTotal(S) === 0) {
        tab = "staff";
        selectors = [".hirebtn", ".staffrow", ".panel"];
      }
    }

    if (hook.tabAccessible && !hook.tabAccessible(tab)) {
      tab = "produce";
      selectors = [".aaa-play-btn", ".aaa-poster", ".aaa-gl-open", '[data-act="greenlight-view"]', ".slotpanel", ".aaa-premiere-ready"];
    } else if (hook.tabLocked?.(tab)) {
      hook.toast?.(hook.tabLockLabel?.(tab) || "🔒 Keep playing to unlock this tab");
      tab = "produce";
      selectors = [".aaa-play-btn", ".aaa-poster", ".aaa-gl-open", '[data-act="greenlight-view"]', ".slotpanel", ".aaa-premiere-ready"];
    }
    hook.getState().tab = tab;
    hook.render();
    hook.play("click");
    const goalEl = document.getElementById("goal");
    if (goalEl) {
      goalEl.classList.add("goal-milestone-hit");
      window.setTimeout(() => goalEl.classList.remove("goal-milestone-hit"), 1400);
    }
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
    if (!resWrap || !top) return;
    const marketTab = (h) => (h.featureUnlocked?.("market") ? "market" : "produce");
    const plusTab = (h) => ({ yen: marketTab(h), fans: marketTab(h), gems: "store", hype: "produce" });
    const order = ["yen", "fans", "gems", "hype"];
    order.forEach((k) => {
      if (resWrap.querySelector(".hud-stat-wrap." + k)) return;
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
        const dest = plusTab(hook)[k];
        if (hook.tabLocked?.(dest)) hook.toast?.(hook.tabLockLabel?.(dest) || "🔒 Keep playing to unlock this tab");
        else { hook.getState().tab = dest; hook.render(); }
        hook.play("click");
        closeDrawer();
      });
      wrap.appendChild(plus);
      const next = order.slice(order.indexOf(k) + 1).map((key) => resWrap.querySelector(".hud-stat-wrap." + key)).find(Boolean);
      if (next) resWrap.insertBefore(wrap, next);
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
    if (main) {
      if (S.tab === "produce" && !glView && (S.slots || 1) > 1 && hook.produceSlotHud) {
        const ph = hook.produceSlotHud();
        main.dataset.produceLines = `${ph.active}/${ph.total}`;
      } else delete main.dataset.produceLines;
    }
    const shell = document.getElementById("hud-shell");
    if (shell) shell.classList.toggle("hud-gl-view", glView);
    const backBtn = document.getElementById("hud-back-btn");
    const avatarWrap = document.getElementById("hud-avatar-wrap");
    if (backBtn) backBtn.hidden = !glView;
    if (avatarWrap) avatarWrap.hidden = !!glView;

    const awards = document.getElementById("hud-awards");
    if (awards) awards.hidden = glView ? false : (S.tab === "produce" ? false : (S.releases || 0) < 8);
    const showcaseDemo = hook.isShowcaseDemo && hook.isShowcaseDemo();
    const demoDots = showcaseDemo && !glView;
    const mailBtn = document.getElementById("hud-mail-btn");
    if (mailBtn) {
      mailBtn.hidden = glView;
      const today = new Date().toISOString().slice(0, 10);
      const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
      mailBtn.classList.toggle("has-dot", !glView && (claimableQuests(S) > 0 || loginPending || demoDots));
    }
    const festPending = hook.festivalInvitePending && hook.festivalInvitePending();
    let festBadge = document.getElementById("hud-festival-badge");
    if (festPending && shell) {
      if (!festBadge) {
        festBadge = document.createElement("button");
        festBadge.type = "button";
        festBadge.id = "hud-festival-badge";
        festBadge.className = "hud-festival-badge";
        festBadge.setAttribute("aria-label", "Festival invite pending");
        wireHudChipKeyboard(festBadge);
        festBadge.addEventListener("click", () => {
          const h = window.__AST_HOOK__;
          if (!h) return;
          h.play?.("click");
          if (typeof h.openFestivalDecisionModal === "function") {
            h.openFestivalDecisionModal();
            return;
          }
          const modal = document.getElementById("decision");
          if (modal && modal.style.display === "flex") {
            modal.scrollIntoView({ behavior: "smooth", block: "center" });
          } else if (h.toast) {
            h.toast("🎪 Festival invite is open — check the decision modal");
          }
        });
        const mail = document.getElementById("hud-mail-btn");
        if (mail && mail.parentNode) mail.parentNode.insertBefore(festBadge, mail);
        else shell.querySelector(".hud-brand-actions")?.appendChild(festBadge);
      }
      const cost = hook.festivalEntryCost ? hook.festivalEntryCost() : 0;
      const afford = S.yen >= cost;
      festBadge.hidden = !!glView;
      festBadge.classList.toggle("hud-festival-afford", afford);
      festBadge.innerHTML = `<span class="hud-festival-ic" aria-hidden="true">🎪</span><span class="hud-festival-lbl">Invite</span>`;
      festBadge.title = afford
        ? "Festival invite — you can afford entry!"
        : `Festival invite — need ¥${hook.fmt ? hook.fmt(cost) : cost}`;
    } else if (festBadge) {
      festBadge.hidden = true;
    }
    const lv = document.getElementById("hud-lv-badge");
    if (lv) lv.textContent = String(S.studioLevel || 1);

    const trend = hook.trendGenre ? hook.trendGenre() : "Action";
    const trendEl = document.getElementById("trend");
    if (trendEl) trendEl.textContent = trend;

    const race = document.getElementById("rival-race");
    if (race) {
      if (!race.querySelector("#rival-race-total")) {
        race.innerHTML = `
          <span class="rival-race-ic" aria-hidden="true">🏁</span>
          <div class="rival-race-main">
            <span class="rival-race-rank">#<b id="rival-race-n">—</b></span>
            <span class="rival-race-total" id="rival-race-total"></span>
          </div>
          <div class="rival-race-detail">
            <span class="rival-race-copy" id="rival-race-copy">Industry race</span>
            <span class="rival-race-gap" id="rival-race-gap" hidden></span>
          </div>
          <div class="rival-race-leaders" id="rival-race-leaders" hidden></div>`;
      }
      const showRace = (S.releases || 0) >= 2 && !glView;
      const expanded = (S.releases || 0) >= 10;
      race.hidden = !showRace;
      race.classList.toggle("rival-race-expanded", showRace && expanded);
      if (showRace && hook.industryStandings) {
        const st = hook.industryStandings();
        const n = document.getElementById("rival-race-n");
        const total = document.getElementById("rival-race-total");
        const copy = document.getElementById("rival-race-copy");
        const gap = document.getElementById("rival-race-gap");
        const leaders = document.getElementById("rival-race-leaders");
        if (n) n.textContent = String(st.rank);
        if (total) total.textContent = expanded ? ` / ${st.total}` : "";
        const next = st.idx > 0 ? st.all[st.idx - 1] : null;
        const me = st.all[st.idx];
        if (copy) {
          copy.textContent = next
            ? (expanded ? `vs ${next.name}` : `vs ${next.name} · ${hook.fmt ? hook.fmt(next.val) : next.val}`)
            : "Top studio in the world!";
        }
        if (gap) {
          if (expanded && next && me) {
            const gapVal = Math.max(0, next.val - me.val);
            gap.hidden = false;
            gap.textContent = `¥${hook.fmt ? hook.fmt(gapVal) : gapVal} to pass`;
          } else {
            gap.hidden = true;
          }
        }
        if (leaders) {
          if (expanded) {
            leaders.hidden = false;
            leaders.innerHTML = st.all.slice(0, 3).map((r, i) => {
              const mark = r.me ? " (you)" : "";
              return `<span class="rival-race-leader${r.me ? " rival-race-me" : ""}">${i + 1}. ${r.name}${mark}</span>`;
            }).join("");
          } else {
            leaders.hidden = true;
          }
        }
      }
    }

    const hypeEl = document.getElementById("r-hype");
    if (hypeEl) {
      const hype = hook.hudDisplayValue ? hook.hudDisplayValue("hype") : S.hype;
      const cap = hook.hudHypeCap ? hook.hudHypeCap() : (hook.hypeCap ? hook.hypeCap() : 100);
      hypeEl.textContent = (hook.fmt ? hook.fmt(hype) : String(hype)) + "/" + (hook.fmt ? hook.fmt(cap) : String(cap));
    }

    const combo = document.getElementById("hud-combo");
    const comboN = document.getElementById("hud-combo-n");
    if (combo && comboN) {
      if (glView) {
        combo.classList.remove("show");
      } else {
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
    }

    const chaosOk = hook.featureUnlocked ? hook.featureUnlocked("chaos") : (S.releases || 0) >= 10;
    let chaosPill = document.getElementById("hud-chaos-pill");
    if (chaosOk && shell) {
      if (!chaosPill) {
        chaosPill = document.createElement("button");
        chaosPill.type = "button";
        chaosPill.id = "hud-chaos-pill";
        chaosPill.className = "hud-chaos-pill";
        chaosPill.setAttribute("aria-label", "Chaos meter — tap to toggle Chaos Mode");
        wireHudChipKeyboard(chaosPill);
        chaosPill.addEventListener("click", () => {
          const h = window.__AST_HOOK__;
          if (!h) return;
          if (typeof h.toggleChaosMode === "function") h.toggleChaosMode();
          else {
            const st = h.getState();
            st.chaosMode = !st.chaosMode;
            h.render();
            h.save?.();
          }
          h.play?.("click");
        });
        const comboEl = document.getElementById("hud-combo");
        if (comboEl && comboEl.parentNode) comboEl.parentNode.insertBefore(chaosPill, comboEl.nextSibling);
        else shell.querySelector(".hud-brand-row")?.appendChild(chaosPill);
      }
      const ch = Math.round(S.chaos || 0);
      const on = !!S.chaosMode;
      chaosPill.hidden = !!glView;
      chaosPill.classList.toggle("hud-chaos-on", on);
      chaosPill.classList.toggle("hud-chaos-warn", ch >= 55);
      const crisisPulse = !!(window.__AST_CRISIS_OPEN__ || window.__AST_PENDING_WARROOM__);
      chaosPill.classList.toggle("hud-chaos-crisis", crisisPulse);
      chaosPill.style.setProperty("--chaos-pct", ch + "%");
      chaosPill.innerHTML = `<span class="hud-chaos-ic" aria-hidden="true">🌪️</span><span class="hud-chaos-lbl">${on ? "ON" : "Chaos"}</span><span class="hud-chaos-val">${ch}%</span><i class="hud-chaos-fill" aria-hidden="true"></i>`;
      chaosPill.title = on
        ? `Chaos ${ch}% — Mode ON (+50% rewards, more crises)`
        : `Chaos ${ch}% — tap to enable Chaos Mode`;
    } else if (chaosPill) {
      chaosPill.hidden = true;
    }

    if (hook.idleIncomeTooltip) {
      const idleTip = hook.idleIncomeTooltip();
      document.querySelectorAll(".hud-stat-wrap.yen .res.yen, .hud-stat-wrap.yen").forEach((el) => {
        el.title = idleTip;
      });
    }

    if (window.__AST_STUDIO_RATING__?.refreshHud) {
      window.__AST_STUDIO_RATING__.refreshHud(S, hook);
      const ratingChip = document.getElementById("hud-studio-rating");
      if (ratingChip) {
        const stars = S.studioStars || 1;
        ratingChip.setAttribute("aria-label", `${stars}-star studio rating — tap for details`);
      }
    }
    wireRatingChip();

    if (shouldRunGuidedTutorial(S, hook)) {
      const gStep = getGuidedStep(S, hook);
      if (gStep && gStep.id !== "name") {
        const coachHint = typeof gStep.coach === "function" ? gStep.coach(S, hook) : gStep.coach;
        if (coachHint?.tab && S.tab !== coachHint.tab && stepNeedsTab(S, hook, coachHint.tab)) {
          S.tab = coachHint.tab;
          if (_renderMain) _renderMain();
        }
      }
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
    if (nowEl) {
      nowEl.textContent = pw.message;
      nowEl.classList.toggle("coach-next-unlock", !!pw.nextUnlock);
    }
    const cta = document.getElementById("pathway-cta");
    if (cta) {
      const label = pw.cta || "Go";
      cta.textContent = label;
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

  const TAB_UNLOCK_RING_KEYS = ["studio", "stars", "market", "research", "chaos"];
  const TAB_UNLOCK_RING_COLOR = {
    studio: "var(--ui-gold)",
    stars: "var(--ui-gold)",
    market: "var(--ui-cyan)",
    research: "var(--ui-accent)",
    chaos: "var(--ui-accent-hot)",
  };

  function updateTabUnlockRings(S, hook) {
    document.querySelectorAll(".tab").forEach((tab) => {
      const k = tab.dataset.tab;
      if (!k || !TAB_UNLOCK_RING_KEYS.includes(k) || !hook.tabLocked?.(k)) {
        tab.classList.remove("tab-unlock-ring-on");
        tab.style.removeProperty("--tab-unlock-pct");
        tab.style.removeProperty("--tab-unlock-color");
        return;
      }
      const pct = hook.tabUnlockPct ? hook.tabUnlockPct(k) : null;
      if (pct == null) {
        tab.classList.remove("tab-unlock-ring-on");
        tab.style.removeProperty("--tab-unlock-pct");
        tab.style.removeProperty("--tab-unlock-color");
        return;
      }
      const clamped = Math.max(0, Math.min(100, pct));
      tab.classList.add("tab-unlock-ring-on");
      tab.style.setProperty("--tab-unlock-pct", String(clamped));
      tab.style.setProperty("--tab-unlock-color", TAB_UNLOCK_RING_COLOR[k] || "var(--ui-accent)");
      const hint = hook.tabLockLabel ? hook.tabLockLabel(k) : "";
      const ic = tab.querySelector(".ic");
      if (ic) ic.title = hint || ic.title || "";
    });
  }

  function updateTabBadges(S, hook) {
    const today = new Date().toISOString().slice(0, 10);
    const loginPending = S.loginLastClaimDate !== today && (S.loginClaimedCount || 0) < 31;
    const claimable = claimableQuests(S);
    const hireAfford = hook.ROLES && hook.hireCost && Object.keys(hook.ROLES).some((k) => S.yen >= hook.hireCost(k));
    const scoutAfford = (hook.castingCost && S.yen >= hook.castingCost()) || S.gems >= (hook.SCOUT_GEMS || 8);
    const starsUnlocked = (S.releases || 0) >= 2 || (S.totalFansEver || 0) >= 20;
    const researchUnlocked = hook.featureUnlocked ? hook.featureUnlocked("research") : (S.totalFansEver || 0) >= 120;
    let researchAfford = false;
    if (researchUnlocked && hook.researchCost && hook.trendGenre) {
      const trend = hook.trendGenre();
      const rc = hook.researchCost(trend);
      researchAfford = S.yen >= rc.cost && S.hype >= rc.hypeCost;
    }
    const marketUnlocked = hook.featureUnlocked ? hook.featureUnlocked("market") : (S.fans || 0) >= 50;
    const marketAfford = marketUnlocked && hook.CAMPAIGNS && hook.CAMPAIGNS.some((c) => S.yen >= c.cost);
    const freeGems = S.freeGemsDate !== today;
    const festPending = hook.festivalInvitePending && hook.festivalInvitePending();
    const dynastyAvail = hook.dynastyAvailable ? hook.dynastyAvailable() : 0;
    const badges = {
      produce: readySlot(S, hook) >= 0 || !!festPending,
      quests: claimable > 0 || loginPending,
      staff: !!hireAfford,
      stars: starsUnlocked && scoutAfford,
      market: !!marketAfford,
      research: researchAfford,
      studio: dynastyAvail >= 12 && (S.releases || 0) >= 10,
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
        if (k === "store" && freeGems) b.title = "Free daily gems ready to claim";
        tab.appendChild(b);
      }
      const lbl = tab.querySelector(".tab-lbl");
      if (lbl && k === "quests") {
        const note = claimable > 0 ? " — rewards ready" : loginPending ? " — login reward ready" : "";
        lbl.setAttribute("aria-label", (tab.getAttribute("aria-label") || "Quests") + note);
      }
      if (lbl && k === "store" && freeGems) {
        lbl.setAttribute("aria-label", (tab.getAttribute("aria-label") || "Store") + " — free gems ready");
      }
    });
  }

  let _lastHudTab = null;

  function pulseActiveTab(tabId) {
    if (!tabId || tabId === _lastHudTab) return;
    _lastHudTab = tabId;
    requestAnimationFrame(() => {
      document.querySelectorAll(".tab.tab-switch-bump").forEach((t) => t.classList.remove("tab-switch-bump"));
      const tab = document.querySelector(`.tab[data-tab="${tabId}"].active`);
      if (!tab) return;
      void tab.offsetWidth;
      tab.classList.add("tab-switch-bump");
      window.setTimeout(() => tab.classList.remove("tab-switch-bump"), 320);
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
    _renderMain = origRender;
    hook.render = function () {
      origRender();
      closeDrawer();
      organizeDrawerSlot();
      updateHud(hook.getState(), hook);
      updateTabUnlockRings(hook.getState(), hook);
      updateTabBadges(hook.getState(), hook);
      pulseActiveTab(hook.getState().tab);
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