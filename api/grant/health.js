import { ledgerConfigured } from "./_ledger.js";
/** GET — non-secret launch health (env presence only). */
export default async function handler(_req, res) {
  return res.status(200).json({
    ok: true,
    grant_jwt: !!process.env.GRANT_JWT_SECRET,
    grant_mint: !!process.env.GRANT_MINT_SECRET,
    gumroad_token: !!process.env.GUMROAD_ACCESS_TOKEN,
    gumroad_seller: !!process.env.GUMROAD_SELLER_ID,
    gumroad_product_ids: !!process.env.GUMROAD_PRODUCT_IDS_JSON,
    purchase_storage: ledgerConfigured(),
    apple_shared_secret: !!process.env.APPLE_SHARED_SECRET,
    google_play: !!(process.env.GOOGLE_SA_JSON || process.env.GOOGLE_PACKAGE_NAME),
  });
}
