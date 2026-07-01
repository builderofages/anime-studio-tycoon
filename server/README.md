# Server endpoints

## IAP receipt validator

Deploy `validate.js` via Vercel (`api/iap/validate.js`).

**Env vars (Vercel project settings):**

| Variable | Purpose |
|----------|---------|
| `APPLE_SHARED_SECRET` | App Store Connect shared secret |
| `GOOGLE_SA_JSON` | Google Play service account JSON |
| `GOOGLE_PACKAGE_NAME` | `com.trainyouragent.animestudiotycoon` |

Set `VALIDATOR_URL` in `iap.js` to your deployed URL (defaults to `/api/iap/validate` on same origin).

## Web purchase tokens

Production web no longer honors raw `?grant=` / `?unlock=` URLs.

1. Gumroad (or admin) POSTs to `/api/grant/mint` with `GRANT_MINT_SECRET`.
2. Response includes a one-time `pt` token.
3. Redirect buyer to `https://anime-studio-tycoon.vercel.app/?pt=<token>`.
4. Game calls `/api/grant/redeem?pt=` — server verifies and returns the entitlement.

**Env:** `GRANT_JWT_SECRET` (random 32+ chars), `GRANT_MINT_SECRET` (webhook/admin key).