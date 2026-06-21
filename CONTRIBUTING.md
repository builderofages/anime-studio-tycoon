# Contributing / commit workflow

## Commit identity

All automated commits are authored as **`Claude <noreply@anthropic.com>`**.
Set this locally before committing:

```bash
git config user.email "noreply@anthropic.com"
git config user.name  "Claude"
```

## Why some past `main` commits show "Unverified"

PRs #2–#11 were merged with **Squash and merge**. GitHub creates the squash commit
itself, with `committer = noreply@github.com` (and `author =` the person who clicked
merge). That's why those commits carry an "Unverified" badge — it's a property of
squash‑merge, not of the underlying work, which is authored correctly on the branch.
We do **not** rewrite that shared `main` history to change a badge.

## Going forward: merge commits, not squash

To keep verified authorship on `main`, PRs are merged with **Create a merge commit**
(`merge_method: merge`). That preserves the branch's real commits verbatim
(committer `noreply@anthropic.com`) and only the small no‑content merge commit is
attributed to GitHub.

Repo‑owner settings that make this the default / stricter (optional):

- **Settings → General → Pull Requests:** keep *Allow merge commits* enabled
  (and, if desired, disable *Allow squash merging* so squash can't be picked).
- **Settings → Branches → branch protection for `main`:** optionally turn on
  *Require signed commits* once a signing key is configured for the bot.

## Verification before every push

```bash
node --check <extracted module>      # JS syntax
node /tmp/*.js                        # the boot/gameplay/management/monetization suites
```

The game is a single static page (`index.html` + `strings.js`); the test harness
boots it under a stubbed DOM and asserts the gameplay/economy invariants.
