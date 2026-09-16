# Anime Studio Tycoon repair status

Repair branch: `codex/production-grant-gating`.

## Fixed and tested locally

- Production query strings can no longer enable unsigned paid-item grants. Local development grants remain limited to localhost/127.0.0.1.
- Purchase minting always verifies the Gumroad license. The environment-variable verification bypass was removed.
- Dependency-audit command failures can no longer report a clean audit.
- Greenlight catalog prices now match the actual production charge. Revenue, fans and hype estimates use the existing premiere formula with the current team, bonuses and sequel season. Net revenue is explicitly before salaries; invented Studio EXP rewards were removed. Production costs and reward balance are unchanged.
- Regression suite: 993 passed, zero failed, in an isolated copy of this branch.
- Gameplay simulation suite: 357 passed, zero failed, including catalog display-versus-charge checks and current-state reward estimates.
- Local browser playtest verified hiring an animator and writer, starting production, a premiere yielding 719 yen and 7 fans, and preserving the QAStudio save after reopening. Browser recheck verified catalog cost 100 and current reward estimates, and started a second production. Returning to a saved game now releases the input lock after closing the return overlay.
- These changes have not been deployed.

## Verified live configuration

The existing public health endpoint reports web grant/JWT and Gumroad configuration present. Apple shared-secret and Google Play validation configuration are absent. Configuration presence does not prove that a purchase has been delivered successfully.

## Still required for release confidence

- Configure and deploy the implemented Gumroad ledger and reconcile historic sales; see `launch/PURCHASE_LEDGER.md`. Local Redis integration tests pass, including competing devices and restart persistence. Staging purchase/restore testing is still required. Server-owned consumable balances and account cloud saves remain separate work.
- Native receipt identity, cancellation/refund validation and real sandbox purchase/restore testing.
- Native/device playtesting and purchase-delivery verification; browser coverage so far is the local loop above.
- Review the remaining dependency findings in `DEPENDENCY_AUDIT.md`: lockfiles now exist, desktop has zero advisories, and the root mobile asset toolchain has two high-severity affected entries without an automatic compatible fix. The audit command reports them; its existing policy allows unfixable advisories, so exit success does not mean zero findings.

The old checkout in `~/Projects/anime-studio-tycoon` was not modified and is older than this fresh GitHub checkout.

## Publishing behavior

The repair replaces `.github/workflows/auto-ship.yml` with read-only branch/PR tests, local Redis integration tests and dependency checks. It contains no automatic merge, branch deletion or deployment. The previous main-branch version still auto-merges non-main pushes until this replacement is accepted; coordinate that transition before publishing a repair branch.

## Review checks versus release readiness

`ci.yml` runs locked, local game/purchase tests on main pushes and PRs. `auto-ship.yml` additionally tests the Redis ledger and dependencies on repair branches/PRs. Neither probes production readiness. GitHub PR checks passing therefore do not mean the game is ready for store submission.

Run the explicit `Release readiness - explicit live checks` workflow on the candidate revision, supplying its deployed URL. It builds actual Mac artifacts, checks the deployed web candidate and runs the existing launch preflight. Missing deployed Apple/payment configuration remains a failure; no prerequisites are skipped or replaced with placeholder artifacts. The invalid-token probe now uses the repaired API's POST contract. This workflow publishes nothing (`--publish never`). A successful packaging run does not establish Apple signing/notarization or actual sandbox purchase success; those remain separate release requirements.

The live readiness workflow was not executed during this pipeline repair; the previously observed missing Apple configuration is still unresolved.
