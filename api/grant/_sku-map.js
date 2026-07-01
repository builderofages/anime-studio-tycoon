/** Gumroad permalink slug → entitlement payload (matches MONETIZATION.checkout in index.html) */
export const PERMALINK_GRANTS = {
  xmwvvi: { kind: "pass" },
  xjpwv: { kind: "bundle" },
  jbclqp: { kind: "gems", amount: 120 },
  legvhu: { kind: "gems", amount: 350 },
  gtdyn: { kind: "gems", amount: 800 },
  kttuab: { kind: "gems", amount: 2000 },
};

export const GEMS_BY_KIND = {
  gems_s: 120,
  gems_m: 350,
  gems_l: 800,
  gems_mega: 2000,
};

export function grantFromPermalink(permalink) {
  if (!permalink) return null;
  const slug = String(permalink).toLowerCase().replace(/^.*\//, "").split("?")[0];
  return PERMALINK_GRANTS[slug] || null;
}