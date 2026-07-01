#!/usr/bin/env bash
# Generate App Store / Steam / marketing assets via Higgsfield CLI.
# Prereq: hf auth login  (or higgsfield auth login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/launch/generated"
mkdir -p "$OUT"

if ! command -v higgsfield >/dev/null 2>&1; then
  echo "Install: curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh"
  exit 1
fi

if ! higgsfield account status >/dev/null 2>&1; then
  echo "Run: hf auth login"
  exit 1
fi

echo "→ App icon (1024)..."
higgsfield generate create gpt_image_2 \
  --prompt "Mobile game app icon, anime studio tycoon, cute sakura pink and gold, film clapperboard and star, glossy iOS icon, no text, centered, kawaii professional" \
  --aspect_ratio 1:1 --resolution 2k --wait \
  | tee "$OUT/app-icon.log"

echo "→ Steam capsule hero (460x215 style)..."
higgsfield generate create gpt_image_2 \
  --prompt "Steam store capsule banner, anime studio management game, vibrant sakura sunset, studio lot with anime posters, cinematic wide banner, no small text" \
  --aspect_ratio 16:9 --resolution 2k --wait \
  | tee "$OUT/steam-capsule.log"

echo "→ Screenshot 1 — Produce tab..."
higgsfield generate create gpt_image_2 \
  --prompt "Mobile game UI mockup, anime studio tycoon produce screen, production slots with anime posters, yen and fans counters, sakura theme, clean game HUD" \
  --aspect_ratio 9:16 --resolution 2k --wait \
  | tee "$OUT/screenshot-produce.log"

echo "→ Screenshot 2 — Stars / gacha..."
higgsfield generate create gpt_image_2 \
  --prompt "Mobile game UI, anime star talent scouting screen, gacha reveal legendary character, sparkles, pink gold UI, studio tycoon" \
  --aspect_ratio 9:16 --resolution 2k --wait \
  | tee "$OUT/screenshot-stars.log"

echo "→ Trailer keyframe..."
higgsfield generate create gpt_image_2 \
  --prompt "Cinematic anime studio premiere night, red carpet, confetti, glowing marquee, celebration, sakura petals, wide 16:9 key art" \
  --aspect_ratio 16:9 --resolution 2k --wait \
  | tee "$OUT/trailer-keyframe.log"

KEYFRAME_URL=""
if [ -f "$OUT/trailer-keyframe.log" ]; then
  KEYFRAME_URL=$(grep -Eo 'https?://[^[:space:]"<>]+\.(png|jpe?g|webp)' "$OUT/trailer-keyframe.log" | tail -1 || true)
fi

if [ -n "$KEYFRAME_URL" ]; then
  echo "→ Optional 6s trailer clip (Seedance)..."
  higgsfield generate create seedance_2_0 \
    --prompt "Anime studio celebration, premiere night, camera push in on glowing studio logo, sakura petals, cinematic" \
    --start-image "$KEYFRAME_URL" \
    --duration 6 --wait 2>/dev/null | tee "$OUT/trailer-clip.log" || echo "(video skipped — re-run after keyframe succeeds)"
else
  echo "(skip trailer clip — no keyframe URL yet)"
fi

echo ""
echo "Done. Logs: $OUT"
echo "Download assets: node scripts/collect-higgsfield-urls.mjs"
echo "Upload launch/store/ to App Store Connect + Steam partner."