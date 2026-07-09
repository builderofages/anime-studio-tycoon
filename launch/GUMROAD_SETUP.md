# Gumroad → signed purchase delivery

Production web **blocks** raw `?grant=` URLs. Buyers receive entitlements via signed `?pt=` tokens.

## 0. Get a token (2026 — no “Generate access token” in Settings)

Gumroad no longer shows a one-click access token. Use either method:

### A. CLI device login (fastest — ~30 seconds)

```bash
brew install antiwork/cli/gumroad   # already on this Mac
gumroad auth login                  # prints a URL + code — approve in browser
gumroad auth token                  # copy this string → GUMROAD_ACCESS_TOKEN
```

Then wire everything:

```bash
cd /Users/alexandermills/anime-studio
export GUMROAD_ACCESS_TOKEN=$(gumroad auth token)
npm run setup-distribution -- --set-vercel --create --publish
vercel --prod --yes
```

### B. OAuth application (if you need a long-lived token in the Gumroad UI)

1. [gumroad.com/settings/advanced](https://gumroad.com/settings/advanced)
2. **Create application** (not “Generate token” — that field is gone)
3. Name: `Anime Studio Tycoon`, Redirect URI: `https://anime-studio-tycoon.vercel.app/` (any HTTPS URL you control)
4. After create → copy **Application Secret** or complete OAuth → that value is `GUMROAD_ACCESS_TOKEN`

Help: [Create an application for the API](https://gumroad.com/help/article/280-create-application-api)

---

## 1. Vercel environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `GRANT_JWT_SECRET` | Yes | Random 32+ characters |
| `GRANT_MINT_SECRET` | Yes | Admin/webhook mint key |
| `GRANT_REDIRECT_BASE` | No | Default: `https://anime-studio-tycoon.vercel.app/` |
| `GUMROAD_ACCESS_TOKEN` | Yes | See **§0 Get a token** below (Gumroad removed the old “Generate token” button) |
| `GUMROAD_SELLER_ID` | Recommended | Your Gumroad seller ID (webhook validation) |
| `GUMROAD_SKIP_LICENSE_VERIFY` | Dev only | `true` skips license check (never in prod) |

## 2. Enable license keys (each paid product)

Gumroad product → **Settings** → enable **Generate a license key**.

## 3. Post-purchase redirect URL (per product)

Set **Redirect URL** on each product:

```
https://anime-studio-tycoon.vercel.app/api/grant/finish?permalink=SLUG&license_key={license_key}
```

| Product | SLUG (permalink) |
|---------|------------------|
| Producer Pass | `xmwvvi` |
| Starter Bundle | `xjpwv` |
| Gems 120 | `jbclqp` |
| Gems 350 | `legvhu` |
| Gems 800 | `gtdyn` |
| Gems 2000 | `kttuab` |
| Legend Bundle | `astlegend` *(create product)* |
| Mogul Bundle | `astmogul` *(create product)* |
| Aurora Vesper | `astaurora` *(create product)* |
| Phoenix Kogane | `astphoenix` *(create product)* |
| Kaiser Shogun | `astshogun` *(create product)* |
| Items Pack | `astitems` *(create product)* |
| Remove Ads | `astnoads` *(create product)* |

Buyer flow: pay → Gumroad redirects → `/api/grant/finish` verifies license → game opens with `?pt=` → entitlement applied automatically.

**Fallback:** Store tab → **Redeem Gumroad License** (paste key + pick product).

## 4. Ping webhook (optional audit)

Gumroad → Settings → Advanced → **Ping**:

```
https://anime-studio-tycoon.vercel.app/api/grant/gumroad
```

Logs sales to Vercel function logs. Does not deliver to buyer (redirect handles that).

## 5. Manual mint (support / testing)

```bash
curl -X POST https://anime-studio-tycoon.vercel.app/api/grant/mint \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_GRANT_MINT_SECRET","kind":"pass"}'
```

Send the `redirect` URL from the response to the buyer.