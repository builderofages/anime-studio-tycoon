# Launch env checklist

Generate secrets:

```bash
node scripts/gen-env-secrets.mjs
```

## Vercel (required for web purchases)

- [x] `GRANT_JWT_SECRET` *(set on production)*
- [x] `GRANT_MINT_SECRET` *(set on production)*
- [x] `GRANT_REDIRECT_BASE` *(set on production)*
- [ ] `GUMROAD_ACCESS_TOKEN`
- [ ] `GUMROAD_SELLER_ID`

Re-generate locally: `npm run gen-env-secrets` (only if rotating secrets)

## Vercel (required for native IAP)

- [ ] `APPLE_SHARED_SECRET`
- [ ] `GOOGLE_SA_JSON`
- [ ] `GOOGLE_PACKAGE_NAME` = `com.trainyouragent.animestudiotycoon`

## Gumroad products to create

6 live · 7 to create on [trainagent.gumroad.com](https://trainagent.gumroad.com):

| SKU | Suggested slug | Price |
|-----|----------------|-------|
| bundle_legend | `astlegend` | $7.99 |
| bundle_mogul | `astmogul` | $19.99 |
| star_aurora | `astaurora` | $3.99 |
| star_phoenix | `astphoenix` | $3.99 |
| star_shogun | `astshogun` | $4.99 |
| items_pack | `astitems` | $2.99 |
| noads | `astnoads` | $2.99 |

Each product: enable license keys + redirect URL from `GUMROAD_SETUP.md`.

## Codemagic

See `CODEMAGIC.md` — groups `app_store_connect`, `google_play`, `keystore_credentials`.