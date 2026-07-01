# Store listing copy — Anime Studio Tycoon v8

Assets: `launch/store/` (app-icon, steam-capsule, screenshots)

---

## App Store / Google Play

**Name:** Anime Studio Tycoon

**Subtitle:** Build your anime empire

**Description:**

Run the hottest anime studio on the planet. Hire animators, writers, and directors. Scout legendary voice talent. Greenlight original hits — or adapt manga and light novels. Match the trending genre, survive chaos events, and premiere to millions of fans.

**Features:**
- Name your own anime and build franchises
- Scout stars with gacha-style casting (pity system included)
- War room crises, bidding wars, and market share battles
- OST commissions, streaming deals, and Influence perks
- Season pass, daily quests, and 50+ achievements
- Cozy sakura aesthetic — fun for all ages

**Category:** Games > Simulation

**Age rating:** 4+ / Everyone

**Keywords:** anime, tycoon, idle, studio, simulation, gacha, management

**Privacy:** No account required. Progress saved locally. See privacy.html.

---

## Steam

**Short description:** Greenlight anime hits, scout star talent, and become the #1 studio in the world.

**About:**

Anime Studio Tycoon is a cozy idle management game with deep systems: production pipelines, named staff with traits, 10× premium scouts, spark shop, genre blending, cour modes, chaos insurance, troubled-production recovery minigames, and a second prestige currency (Influence).

**Tags:** Simulation, Casual, Indie, Anime, Management, Singleplayer, Free to Play

**Capsule:** `launch/store/steam-capsule.jpg`  
**Screenshots:** `screenshot-produce.png`, `screenshot-stars.png`

---

## Gumroad web checkout (signed grants)

Production web no longer accepts raw `?grant=` URLs. After a sale:

```bash
curl -X POST https://anime-studio-tycoon.vercel.app/api/grant/mint \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_GRANT_MINT_SECRET","kind":"pass"}'
```

Redirect the buyer to the `redirect` URL in the response.

Set Vercel env: `GRANT_JWT_SECRET`, `GRANT_MINT_SECRET`, `GRANT_REDIRECT_BASE`.