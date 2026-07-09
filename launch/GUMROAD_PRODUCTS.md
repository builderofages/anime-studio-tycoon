# Gumroad products — copy-paste specs

Create at [gumroad.com/products/new](https://gumroad.com/products/new).  
**Each product:** Digital product → enable **Generate license key** → set redirect URL below.

Redirect template (replace `SLUG`):

```
https://anime-studio-tycoon.vercel.app/api/grant/finish?permalink=SLUG&license_key={license_key}
```

---

## 1. Legend Bundle — `astlegend` — $7.99

**Name:** Anime Studio Tycoon — Legend Bundle  
**Price:** $7.99  
**Description:**

Producer Pass (+50% Yen forever, auto-release, 2× offline) + 400 Gems + exclusive Legendary star **Aurora Vesper**. One-time purchase. Play at anime-studio-tycoon.vercel.app

**URL slug:** `astlegend`

---

## 2. Mogul Bundle — `astmogul` — $19.99

**Name:** Anime Studio Tycoon — Mogul Bundle  
**Price:** $19.99  
**Description:**

The ultimate bundle: Producer Pass + 1,500 Gems + exclusive Legendary stars Phoenix Kogane & Kaiser Shogun + Remove Ads. Best value for serious studio builders.

**URL slug:** `astmogul`

---

## 3. Aurora Vesper — `astaurora` — $3.99

**Name:** Anime Studio Tycoon — Aurora Vesper (Exclusive Star)  
**Price:** $3.99  
**Description:**

Unlock **Aurora Vesper**, a permanent Legendary Director exclusive — never available in the free scout pool. Duplicate purchases level her up.

**URL slug:** `astaurora`

---

## 4. Phoenix Kogane — `astphoenix` — $3.99

**Name:** Anime Studio Tycoon — Phoenix Kogane (Exclusive Star)  
**Price:** $3.99  
**Description:**

Unlock **Phoenix Kogane**, a permanent Legendary Animator exclusive. Not in gacha. Duplicates increase star level.

**URL slug:** `astphoenix`

---

## 5. Kaiser Shogun — `astshogun` — $4.99

**Name:** Anime Studio Tycoon — Kaiser Shogun (Exclusive Star)  
**Price:** $4.99  
**Description:**

Unlock **Kaiser Shogun**, a permanent Legendary Voice star exclusive to paid supporters.

**URL slug:** `astshogun`

---

## 6. Power Items Pack — `astitems` — $2.99

**Name:** Anime Studio Tycoon — Power Items Pack  
**Price:** $2.99  
**Description:**

5 premium consumable items (Megaphone, Power Gauntlet, Time Pendant, Stardust, Espresso) + 50 bonus Gems. Instant delivery in-game.

**URL slug:** `astitems`

---

## 7. Remove Ads — `astnoads` — $2.99

**Name:** Anime Studio Tycoon — Remove Ads  
**Price:** $2.99  
**Description:**

Removes optional ad prompts on web. All free rewards (daily gems, 2× boost) remain available without watching ads.

**URL slug:** `astnoads`

---

## After creating all 7

1. `gumroad auth login` → `gumroad auth token` → Vercel `GUMROAD_ACCESS_TOKEN` (see `GUMROAD_SETUP.md §0`)
2. Copy **Seller ID** → Vercel `GUMROAD_SELLER_ID`
3. Set Ping URL: `https://anime-studio-tycoon.vercel.app/api/grant/gumroad`
4. Run `npm run launch-preflight`