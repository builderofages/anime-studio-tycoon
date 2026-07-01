/** Gumroad permalink slug → entitlement (live products on trainagent.gumroad.com) */
export const PERMALINK_GRANTS = {
  xmwvvi: { kind: "pass" },
  xjpwv: { kind: "bundle" },
  jbclqp: { kind: "gems", amount: 120 },
  legvhu: { kind: "gems", amount: 350 },
  gtdyn: { kind: "gems", amount: 800 },
  kttuab: { kind: "gems", amount: 2000 },
  // Create these on Gumroad, then add slug here + MONETIZATION.checkout in index.html:
  astlegend: { kind: "bundle_legend" },
  astmogul: { kind: "bundle_mogul" },
  astaurora: { kind: "star", sku: "star_aurora", id: "x_aurora" },
  astphoenix: { kind: "star", sku: "star_phoenix", id: "x_phoenix" },
  astshogun: { kind: "star", sku: "star_shogun", id: "x_shogun" },
  astitems: { kind: "items_pack" },
  astnoads: { kind: "noads" },
};

/** Internal SKU → grant (license redeem by sku when permalink unknown) */
export const SKU_GRANTS = {
  pass: { kind: "pass" },
  bundle: { kind: "bundle" },
  bundle_legend: { kind: "bundle_legend" },
  bundle_mogul: { kind: "bundle_mogul" },
  gems_s: { kind: "gems", amount: 120 },
  gems_m: { kind: "gems", amount: 350 },
  gems_l: { kind: "gems", amount: 800 },
  gems_mega: { kind: "gems", amount: 2000 },
  star_aurora: { kind: "star", sku: "star_aurora", id: "x_aurora" },
  star_phoenix: { kind: "star", sku: "star_phoenix", id: "x_phoenix" },
  star_shogun: { kind: "star", sku: "star_shogun", id: "x_shogun" },
  items_pack: { kind: "items_pack" },
  noads: { kind: "noads" },
};

/** SKU → suggested Gumroad permalink (update when products are created) */
export const SKU_PERMALINKS = {
  pass: "xmwvvi",
  bundle: "xjpwv",
  gems_s: "jbclqp",
  gems_m: "legvhu",
  gems_l: "gtdyn",
  gems_mega: "kttuab",
  bundle_legend: "astlegend",
  bundle_mogul: "astmogul",
  star_aurora: "astaurora",
  star_phoenix: "astphoenix",
  star_shogun: "astshogun",
  items_pack: "astitems",
  noads: "astnoads",
};

export function grantFromPermalink(permalink) {
  if (!permalink) return null;
  const slug = String(permalink).toLowerCase().replace(/^.*\//, "").split("?")[0];
  return PERMALINK_GRANTS[slug] || null;
}

export function grantFromSku(sku) {
  if (!sku) return null;
  return SKU_GRANTS[String(sku).toLowerCase()] || null;
}

export function permalinkForSku(sku) {
  return SKU_PERMALINKS[sku] || null;
}