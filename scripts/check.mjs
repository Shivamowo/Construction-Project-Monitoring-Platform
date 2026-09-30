import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const base = process.env.BASE_URL || 'http://localhost:3000';
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
fs.mkdirSync('/tmp/shots', { recursive: true });

const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
let failed = 0;
const report = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failed++; };

for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const route of ['/', '/scorecard', '/actions']) {
    await page.goto(base + route);
    await page.waitForTimeout(1600);
    const tag = `${w} ${route}`;
    const r = await page.evaluate(() => {
      const cs = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el) : null; };
      const tile = cs('.tile'), dark = cs('.dark-panel'), cap = cs('.capsule'), title = cs('.title');
      const wrappers = [...document.querySelectorAll('.recharts-wrapper')].map((e) => e.getBoundingClientRect().height);
      let clash = 0;
      for (const el of document.body.querySelectorAll('*')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const s = getComputedStyle(el);
        if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.color === s.backgroundColor) clash++;
      }
      return {
        tile: tile?.backgroundColor, dark: dark?.backgroundColor, cap: cap?.backgroundColor,
        titleSize: title ? parseFloat(title.fontSize) : 0, titleFont: title?.fontFamily ?? '', titleWeight: title?.fontWeight,
        condLoaded: document.fonts.check('300 40px "Barlow Condensed"'), wrappers, clash,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    report(r.tile && r.tile !== 'rgba(0, 0, 0, 0)', `${tag} .tile background ${r.tile}`);
    if (route !== '/scorecard' || true) report(r.dark === 'rgb(46, 46, 56)', `${tag} .dark-panel background ${r.dark}`);
    report(r.cap === 'rgb(46, 46, 56)', `${tag} .capsule background ${r.cap}`);
    report(r.titleSize >= 36 && r.titleFont.includes('Barlow Condensed') && r.titleWeight === '300', `${tag} .title ${r.titleSize}px ${r.titleWeight} ${r.titleFont.slice(0, 40)}`);
    report(r.condLoaded, `${tag} Barlow Condensed 300 loaded`);
    report(r.wrappers.every((x) => x > 100), `${tag} recharts wrappers ${JSON.stringify(r.wrappers.map(Math.round))}`);
    report(r.clash === 0, `${tag} text/background clashes ${r.clash}`);
    report(!r.overflow, `${tag} no horizontal overflow`);
    await page.screenshot({ path: `/tmp/shots/${route === '/' ? 'home' : route.slice(1)}-${w}.png`, fullPage: true });
  }
  report(errors.length === 0, `${w} page errors ${errors.slice(0, 2).join(' | ')}`);
  await page.close();
}
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
