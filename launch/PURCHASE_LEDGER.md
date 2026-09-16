# Durable Gumroad purchase delivery

Implemented in this branch, not deployed or tested against paid purchases.

## Required server-only configuration

- `GRANT_JWT_SECRET`: stable private signing and ownership pseudonym key. Do not rotate without migrating ledger owner hashes.
- `GUMROAD_ACCESS_TOKEN`: seller API token.
- `GUMROAD_SELLER_ID`: exact seller ID that verification must match.
- `GUMROAD_PRODUCT_IDS_JSON`: JSON object mapping each configured product permalink to its real Gumroad product ID, for example `{"jbclqp":"actual-product-id"}`. Never use example IDs in production.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: dedicated persistent Redis REST database with EVAL support. Use HTTPS. Keep credentials server-only. Configure backups and no eviction; purchase records have no expiration.
- Optional `GRANT_REDIRECT_BASE`: deployed game URL.

Gumroad's [license verification documentation](https://gumroad.com/help/article/76-license-keys) requires product IDs for newer products. This integration verifies seller, product, refund/chargeback/dispute state and sale identity before recording a purchase. Health reports configuration presence only. Missing storage fails closed with 503; there is no process-memory fallback.

## Delivery and recovery

A verified sale is registered atomically under a hashed sale ID. The client claims it with a persistent random delivery ID, saves its grant and redemption marker, then acknowledges delivery. A different browser cannot take over pending consumables; it can restore permanent benefits immediately without claiming their bundled currency. Retrying on the original browser resumes safely using its saved marker. After acknowledgement, reentering the license on another device restores permanent pass, no-ad and character benefits; it never reissues gems, items or bundle welcome bonuses. Consumable balances are not synchronized across devices.

If the original browser loses storage while delivery is pending, support must reconcile the purchase manually; there is deliberately no automatic timeout reassignment that could duplicate rewards. Redis backups must preserve completed records. No automatic refund webhook is implemented: minting rechecks refunds, but previously restored offline benefits cannot yet be remotely revoked. Manual admin minting is disabled until it has a durable issuance record.

This is purchase-delivery deduplication, not an authoritative economy: saves, consumable spending and local state remain client-side. A modified client can still cheat. Complete account-based cloud saves and a server-owned wallet are separate work.

## Existing customers and rollout

Old signed links require license verification again. Existing local grant IDs are preserved so an intact old save is acknowledged without receiving the same grant again. Before production rollout, reconcile historic Gumroad sales and delivery records: an old customer who already consumed a purchase and erased their save has no reliable server history to migrate automatically. Do not claim historical replay prevention without that reconciliation.

Set up staging storage, configure all seller/product mappings, import reconciled history, then test an actual sandbox purchase, failed delivery/retry, second-device restoration and refund handling before enabling production checkout. This branch has not made a real payment or deployed storage.

## Local verification

`node scripts/grant-mint-test.mjs` intercepts provider/storage requests using fake credentials. `node scripts/playtest-sim.mjs` tests client delivery ordering and restoration. `node scripts/purchase-ledger-test.mjs` requires Redis server and CLI; it creates an isolated temporary Redis instance and local REST adapter, then tests actual Lua concurrency, identity checks, acknowledgement, persistence after restart and missing configuration. It does not contact Gumroad or Upstash.
