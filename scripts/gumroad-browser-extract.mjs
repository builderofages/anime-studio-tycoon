#!/usr/bin/env node
/**
 * Paste into Gumroad dashboard browser console (logged-in tab):
 * Copies access token from page + lists product permalinks.
 */
const snippet = `
(async () => {
  const lines = [];
  try {
    const r = await fetch('/api/v2/products?access_token=' + (window.__GUMROAD_ACCESS_TOKEN || ''), { credentials: 'include' });
    lines.push('products API: ' + r.status);
  } catch (e) {}
  const links = [...document.querySelectorAll('a[href*="/l/"], a[href*="products/"]')]
    .map(a => ({ href: a.href, text: a.innerText?.trim()?.slice(0, 80) }))
    .filter(x => x.text || x.href.includes('/l/'));
  const payload = { at: new Date().toISOString(), url: location.href, links };
  const json = JSON.stringify(payload, null, 2);
  try { await navigator.clipboard.writeText(json); lines.push('Copied to clipboard'); } catch (_) {}
  console.log(json);
  return json;
})();
`.trim();

console.log('Run this in your logged-in Gumroad tab console (Chrome/Safari → DevTools → Console):\n');
console.log(snippet);
console.log('\nThen paste the JSON output here or save to launch/GUMROAD_BROWSER.json');