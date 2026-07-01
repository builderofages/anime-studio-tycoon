import { grantFromPermalink } from "./_sku-map.js";
import { parseGumroadBody } from "./_gumroad.js";

/**
 * Gumroad Ping webhook — sale notifications (audit + 200 OK).
 * Configure in Gumroad → Settings → Advanced → Ping endpoint:
 *   https://anime-studio-tycoon.vercel.app/api/grant/gumroad
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const sellerId = process.env.GUMROAD_SELLER_ID;
  const body = parseGumroadBody(req);

  if (sellerId && body.seller_id && body.seller_id !== sellerId) {
    return res.status(401).json({ ok: false, error: "seller mismatch" });
  }

  if (body.refunded === "true" || body.chargedback === "true") {
    return res.status(200).json({ ok: true, ignored: "refunded" });
  }

  const permalink = body.short_product_id || body.product_permalink || body.permalink;
  const grant = grantFromPermalink(permalink);

  console.log("[gumroad-ping]", {
    sale_id: body.sale_id,
    email: body.email,
    permalink,
    grant: grant?.kind || "unknown",
    price: body.price,
  });

  return res.status(200).json({ ok: true, sale_id: body.sale_id, mapped: !!grant });
}