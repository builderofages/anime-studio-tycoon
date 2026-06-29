/* Server-side IAP receipt validator (closes the GLM-5.2 CRITICAL findings).
   Deploy this as an HTTPS endpoint and set VALIDATOR_URL in iap.js to its URL.
   Works as a Vercel/Netlify/Express-style handler: export default (req,res).

   Required env vars (set in your host, NEVER commit):
     APPLE_SHARED_SECRET         - App Store Connect > App > App-Specific Shared Secret
     GOOGLE_SA_JSON              - Google service-account JSON (Play Developer API)
     GOOGLE_PACKAGE_NAME         - com.trainyouragent.animestudiotycoon
*/
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"POST only" });
  try {
    const { platform, receipt, productId, token } = req.body || {};
    if (!platform || !productId) return res.status(400).json({ ok:false, error:"missing fields" });

    if (platform === "apple") {
      // Verify with Apple. Use production first, fall back to sandbox (status 21007).
      const body = { "receipt-data": receipt, password: process.env.APPLE_SHARED_SECRET, "exclude-old-transactions": true };
      let r = await fetch("https://buy.itunes.apple.com/verifyReceipt", { method:"POST", body: JSON.stringify(body) });
      let j = await r.json();
      if (j.status === 21007) {
        r = await fetch("https://sandbox.itunes.apple.com/verifyReceipt", { method:"POST", body: JSON.stringify(body) });
        j = await r.json();
      }
      if (j.status !== 0) return res.status(400).json({ ok:false, error:"apple status "+j.status });
      const owns = (j.receipt?.in_app || []).some(p => p.product_id === productId);
      return res.json({ ok: owns, productId });
    }

    if (platform === "google") {
      // Verify purchase token with Google Play Developer API (productPurchases.get).
      const accessToken = await googleAccessToken(JSON.parse(process.env.GOOGLE_SA_JSON || "{}"));
      const pkg = process.env.GOOGLE_PACKAGE_NAME;
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/products/${productId}/tokens/${token}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const j = await r.json();
      // purchaseState 0 = purchased
      return res.json({ ok: j.purchaseState === 0, productId });
    }

    return res.status(400).json({ ok:false, error:"unknown platform" });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e && e.message || e) });
  }
}

// Minimal JWT -> OAuth token exchange for the Google service account.
async function googleAccessToken(sa) {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now()/1000);
  const claim = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher",
                  aud: "https://oauth2.googleapis.com/token", iat: now, exp: now+3600 };
  const header = { alg:"RS256", typ:"JWT" };
  const crypto = await import("crypto");
  const signingInput = enc(header)+"."+enc(claim);
  const sig = crypto.createSign("RSA-SHA256").update(signingInput).sign(sa.private_key, "base64url");
  const jwt = signingInput+"."+sig;
  const r = await fetch("https://oauth2.googleapis.com/token", { method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  return (await r.json()).access_token;
}
