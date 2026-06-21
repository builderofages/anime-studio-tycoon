# Anime Studio Tycoon — Expansion Roadmap (200 Improvements)

This is the product/engineering backlog for turning the game into a *truly endless*,
feature-complete idle tycoon. Items marked **✅ DONE** were implemented in the
"full audit / flaws" pass (engine fixes + first expansion wave). Everything else is
the prioritized backlog, grouped by system. Numbers are stable IDs, not priority order.

> Two player-reported bugs fixed this pass:
> - **Productions now count down on their own.** The game loop only ran after tapping the hidden
>   "Enter the Studio" gate, so `tick()` never advanced — only manual taps moved the bar.
>   The simulation now auto-resumes for returning players; tapping only *speeds it up*.
> - **Tapping a poster no longer pops a menu or shifts the screen.** Taps/ticks now update the
>   moving numbers in place instead of rebuilding `#main` (which reset scroll), and the
>   background DOM-shuffling "Status/Menu" layer that popped in every 900ms was removed.

---

## A. Core loop & the two reported bugs
1. ✅ Auto-run the simulation loop (no tap-to-start; productions always count down).
2. ✅ Tap-to-boost only *accelerates* a running production; never required to progress.
3. ✅ In-place live updates (progress/ETA/resources) — no `#main` rebuild, no scroll jump.
4. ✅ Remove the 900ms DOM-shuffling top-menu layer that popped in and shifted the view on tap.
5. ✅ De-duplicate the daily-quest panel off the Produce tab (it caused the layout shift).
6. Per-slot "boost charge" meter so holding/tapping has a visible, satisfying ceiling.
7. Auto-greenlight toggle per slot (pick genre+project once, keep re-producing).
8. "Smart greenlight" that auto-picks the best affordable project for the trending genre.
9. Long-press a poster to open a quick action sheet (Rush / Premiere Now / Cancel).
10. Cancel-production button that refunds part of the greenlight cost.
11. Pause/resume an individual production line.
12. Drag-to-reorder production slots.
13. Confirmation when spending gems on instant-premiere above a threshold.
14. Haptic feedback on tap (Capacitor Haptics) for native builds.
15. Visual "ka-ching" particle burst scaled to payout size.

## B. Production depth
16. Multi-stage productions (pre-production → animation → post → premiere) with per-stage staff.
17. Episode/cour system: shows run 12 episodes, each a mini-production.
18. Seasons & sequels: produce Season 2 of a hit for a quality/fan head-start.
19. Franchises: link related shows into a franchise with a stacking multiplier.
20. Production risk dial (safe/balanced/ambitious) trading cost vs payout variance.
21. Mid-production random events (budget overrun, viral leak, key animator sick).
22. Quality "polish" phase: spend extra time/yen post-completion to bump star rating.
23. Genre-blending: pick a primary+secondary genre for hybrid bonuses/penalties.
24. Source material: Original vs Manga vs Light-Novel adaptation, each with trade-offs.
25. Target demographic (kids/shonen/seinen/josei) affecting fan vs yen weighting.
26. Soundtrack/OST production as an optional add-on for a hype boost.
27. Theme-song tie-in with a guest musician (mini-gacha).
28. Dub/localization pass to unlock additional regional fan pools.
29. Animation style choice (2D/CGI/hybrid) gated by research.
30. Per-show review score history kept in a catalog/gallery.
31. "Troubled production" recovery minigame.
32. Crunch meter: pushing speed lowers staff morale (see Staff).
33. Production templates/presets the player can save and reuse.
34. Simulcast vs delayed release timing decision.
35. Box-office vs streaming revenue split per show.

## C. Staff & studio team
36. Staff XP and levels earned from completed productions.
37. Staff morale & burnout; rest days; morale affects output.
38. Staff specializations (e.g., action animator, romance writer).
39. Trainable skills / a small per-employee skill tree.
40. Hireable executives/managers granting passive studio-wide bonuses.
41. Staff traits (fast, perfectionist, cheap, diva) drawn on hire.
42. Department leads that buff everyone in their role.
43. Salary negotiation / contracts with terms and renewal.
44. Staff retirement and a "legacy hall" for long-tenured staff.
45. Studio culture stat influencing hire cost and retention.
46. Recruiting events / job fairs (limited-time better hires).
47. Overtime budget slider.
48. Per-role automation unlocks (auto-hire to keep ratios balanced).
49. Team chemistry: balanced role ratios give a multiplier.
50. Internship pipeline producing cheap junior staff over time.

## D. Stars, gacha & collection
51. ✅ Expand the star roster (14 new talents across all rarities).
52. **Publish gacha odds numerically** (per-rarity %), required for store compliance.
53. Pity counter: guaranteed Epic+ after N scouts without one.
54. Rate-up banners (rotating featured star, limited time).
55. Star synergy sets (e.g., "Studio Ghibli-style trio" bonus when 3 specific stars owned).
56. Star bond/affinity that grows as a star works on shows.
57. Star-specific signature abilities (genre crit, no-flop insurance, viral hook).
58. Star awakening/ascension using duplicates + materials.
59. Star retirement & a Hall of Fame.
60. Limited collab/seasonal stars.
61. Star scouting "scout report" preview before committing gems.
62. Star equipment/accessories that modify their stats.
63. Collection book with completion rewards.
64. Star trade-in: convert unwanted dupes into currency.
65. Voice-actor casting per show that affects the "voice" dimension specifically.
66. Star "drama"/scandal events with risk/reward.

## E. Economy, idle & offline
67. ✅ Back-catalog royalties: permanent passive Yen/sec from every premiere.
68. ✅ Royalties accrue offline as well as online.
69. ✅ Royalties surfaced on the dashboard (¥/s KPI).
70. Merchandising lines (figures, apparel) as separate passive income streams.
71. Licensing deals: recurring income contracts with streaming platforms.
72. Investment/bank system: park yen for interest, or take loans.
73. Multiple currencies UI cleanup (yen/hype/gems/legacy) with tooltips.
74. Soft + hard currency sinks tuned across the whole curve.
75. Inflation-proof number formatting verified past 1e30 (scientific fallback).
76. Offline summary screen upgrades (per-stream breakdown).
77. Bonus offline time tokens (earn/buy extra offline cap).
78. "Catch-up" mechanic so lapsed players aren't hopelessly behind.
79. Daily budget/expense report panel.
80. Tax/expense events for high earners (optional difficulty).

## F. Progression, prestige & meta
81. ✅ Legacy Perk Tree (income/speed/fans/offline) — permanent, survives reboot.
82. ✅ Perks persist correctly through prestige; legacy points tracked & spent.
83. Multiple prestige layers (Studio Reboot → Industry Reboot → Era Reboot).
84. Prestige currency variety (Legacy + a deeper "Influence" currency).
85. Respec option for perks (with a cost).
86. Bigger perk tree (10+ nodes, branching, prerequisites).
87. Prestige milestones with one-time permanent unlocks.
88. "New Game+" modifiers chosen at reboot.
89. Ascension challenges (restricted runs for special rewards).
90. Studio levels beyond the current curve with named tiers.
91. Mastery rework: per-genre mastery tree, not just a single level.
92. Permanent unlock ledger ("what carries over") shown before prestige.
93. Prestige preview calculator ("reboot now for +X").
94. Era/age system that reskins the world as you advance decades.

## G. Endless scaling & content
95. ✅ Endless goal/milestone ladder (procedural, never "finished").
96. ✅ Endless marketing campaign tiers (procedural beyond Viral).
97. ✅ Procedural project tiers already extend past Blockbuster — verified intact.
98. Procedural star generation for an infinite roster at high prestige.
99. Procedural genre sub-types unlocked late game.
100. Scaling boss "rival blockbusters" you must out-produce.
101. Infinite research tree with diminishing, never-zero returns.
102. Dynamic difficulty so the curve never flatlines.
103. Procedural award categories at awards nights.
104. Endless achievement tiers (auto-generated "release N" / "fans N").
105. Prestige-scaled event rewards.

## H. Events, live-ops & seasons
106. ✅ Studio Awards Night every 50 premieres (gems + 3× income window).
107. ✅ More interactive studio decisions (poaching, collab, slump, awards, fan mail).
108. Seasonal themes (spring sakura, summer festival, winter) reskinning UI + bonuses.
109. Real-calendar holidays with special banners.
110. Weekend rush events (limited-time multipliers).
111. Anime convention event (booth, panels, fan growth minigame).
112. Tournament/ranked event vs rival studios.
113. Community goals (shared global target — needs backend) or local stand-in.
114. Login-calendar rework with milestone chests.
115. Timed "production marathon" challenges.
116. Mystery box / daily spin wheel.
117. Limited-time genre crazes (huge trend bonus for one genre).
118. Event currency + event shop.
119. Story-driven campaign chapters with cutscene cards.
120. Boss "deadline" events with a countdown.

## I. Rivals, world & social
121. Rival studios with names, market share, and a visible leaderboard.
122. Local "industry rankings" you climb as studio value grows.
123. Poaching/being-poached interactions with rivals (hooks D + C).
124. Bidding wars over hot source material.
125. Studio reputation stat affecting deals and hires.
126. Critics vs Audience dual scores per show.
127. Fan demographics dashboard (regions, age, genre affinity).
128. Shareable "studio card" image (canvas-rendered) for real virality.
129. Async ghost leaderboard (compare to a snapshot, no server) + optional online board.
130. In-game social feed of fictional fan reactions to your premieres.

## J. UX / UI / onboarding
131. Fix the committed file being a serialized DOM snapshot (ship clean source).
132. Stable, scroll-preserving renders across *all* tabs (not just Produce).
133. Number-abbreviation tooltips (hover/long-press to see exact value).
134. First-session guided tutorial with highlighted steps.
135. Contextual tips when a new system unlocks.
136. Settings panel (audio sliders, reduced motion, number format, language).
137. Confirm dialogs styled in-theme (replace native `confirm`).
138. Empty-state art for each tab.
139. Search/sort/filter for stars and achievements.
140. Pinnable goals / quest tracker overlay.
141. Toast queue with de-duplication and priority.
142. Dark/light theme toggle.
143. Landscape/tablet layout.
144. Better disabled-button affordances ("need ¥X more").
145. Animated resource counters on change.
146. Persistent "what's new" changelog modal.
147. Offline/error banner when assets fail to load.

## K. Accessibility
148. Full keyboard navigation + visible focus rings.
149. ARIA labels/roles on interactive elements.
150. Screen-reader live regions for key events (premiere, level up).
151. Colorblind-safe rarity/quality palettes + icons (not color alone).
152. Respect `prefers-reduced-motion` everywhere (partially done for float gains).
153. Adjustable font scaling.
154. High-contrast mode.
155. Larger tap targets on small screens.

## L. Audio
156. Volume sliders (music/SFX separate) + persistence.
157. More SFX (greenlight, hire, upgrade, award, gacha pull by rarity).
158. Rarity-tiered gacha jingles.
159. Music ducking during big premiere moments.
160. Mute respects system silent switch on iOS.
161. Bundle audio as local assets (no CDN dependency).

## M. Performance & tech
162. Throttle live updates with `requestAnimationFrame` coalescing.
163. Avoid `innerHTML` rebuilds for list tabs; use targeted diffing.
164. Lazy-load off-screen images; preconnect to the CDN.
165. Cache DOM lookups (`$` results) for hot paths.
166. Web Worker for offline simulation of long absences.
167. Guard against `localStorage` quota errors with a fallback.
168. Save-versioning + migration framework (schema `v` field).
169. Debounced autosave + save-on-pagehide (partly present) unified.
170. Remove dead code (disabled ast46 helpers) once design is finalized.
171. Unit-test harness for economy math (the audit added a Node smoke test — formalize it).
172. Deterministic RNG option (seeded) for testing/replays.

## N. Localization & content
173. Translate *all* gameplay strings, not just chrome (quests, store, decisions, premieres).
174. Externalize every user-facing string into the i18n table.
175. Locale-aware number/date formatting.
176. RTL layout support.
177. More languages (zh, ko, it, ru, hi).
178. Localized store pricing display.
179. Per-locale anime title banks for authentic generated titles.

## O. Monetization (ethical) & compliance
180. Verify web purchase grants server-side or via signed tokens (remove trivial `?grant=` exploit).
181. Publish gacha odds (duplicate of #52 — compliance blocker).
182. Add a "Restore Purchases" path on web (license re-check) as well as native.
183. Wire the rewarded-ad copy to a real ad SDK, or change the copy (no fake "watch an ad").
184. "Name your own show" feature to match the store/marketing claim, or update the copy.
185. Family/kids compliance review (gacha + IAP + "all ages" positioning).
186. Spending limits / parental gate for purchases.
187. Clear "no real-world value" + odds disclosures near every purchase (partly present).
188. A/B-testable offer system instead of hard-coded starter bundle timing.
189. Receipt validation hardening in `iap.js` (platform-correct registration timing).
190. Single source of truth for build (stop building from a hard-coded CloudFront zip).

## P. Quality, polish & gaps found in audit
191. Unify date handling (UTC vs local) so daily/weekly/login resets & countdowns agree.
192. Make week boundary in `weekKeyStr` match `msToWeekReset`.
193. Fallback art for CSS background posters & audio (not just `<img>`).
194. Bundle game art/audio as app assets for native reliability.
195. Fix `package.json` scripts that reference missing `scripts/*.mjs`.
196. Gallery/"Hall of Fame" of your best (5★) premieres with their reviews.
197. Stats/records screen (lifetime earned, best combo, most-produced genre).
198. Cloud save / cross-device sync (optional account).
199. Daily/weekly streak insurance (one free miss).
200. End-to-end playtest pass to balance the full curve from minute 1 to prestige 10+.

---

### Implemented in this pass (summary)
Engine: auto-run loop, in-place live updates (no scroll jump), removed pop-in menu layer,
de-duped daily quests off Produce. Systems: back-catalog royalties (online+offline),
Studio Awards every 50 premieres, Legacy Perk Tree (4 perks, prestige-proof), endless
milestone ladder, endless marketing tiers. Content: +14 stars, +13 achievements,
+6 decisions, +3 daily quests, dashboard royalties/awards KPIs. All verified via a Node
smoke-test harness (boot + every tab render + gameplay/economy/prestige assertions).
