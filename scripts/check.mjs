// Layout, type and chart checks. Run against a started app: `npm start`, then `node scripts/check.mjs`.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const base = process.env.BASE_URL || 'http://localhost:3000';
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ROUTES = ['/', '/portfolio', '/scorecard', '/procurement', '/drawings', '/dpr', '/contractors', '/actions', '/risks', '/delays'];
const SHOTS = new Set(['/', '/scorecard', '/risks']);
fs.mkdirSync('/tmp/shots', { recursive: true });

const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
let failed = 0;
const report = (ok, msg) => { if (!ok || process.env.VERBOSE) console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failed++; };

for (const [w, h] of [[1440, 900], [390, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const route of ROUTES) {
    await page.goto(base + route);
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.fonts.ready);
    const tag = `${w} ${route}`;
    const r = await page.evaluate(() => {
      const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 1 && b.height > 1 && !el.closest('.sr-only'); };
      const textEls = [...document.body.querySelectorAll('*')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && vis(el));
      const fam = (el) => getComputedStyle(el).fontFamily.replace(/["']/g, '');
      const ok = /^(Archivo|IBM Plex Sans)/;
      const title = document.querySelector('.title');
      const tile = document.querySelector('.tile');
      const page = document.querySelector('.page');
      const ps = getComputedStyle(page);
      const contentRight = page.getBoundingClientRect().right - parseFloat(ps.paddingRight);
      const cluster = document.querySelector('.header-cluster');
      const kpis = [...document.querySelectorAll('.kpi')].map((k) => { const b = k.getBoundingClientRect(); const n = k.querySelector('.numeral'); return { top: Math.round(b.top), h: b.height, nb: n ? n.getBoundingClientRect().bottom : null }; });
      const rows = {};
      kpis.forEach((k) => { (rows[k.top] ||= []).push(k); });
      const kpiBad = Object.values(rows).filter((g) => g.length > 1 && (Math.max(...g.map((k) => k.h)) - Math.min(...g.map((k) => k.h)) > 1 || (() => { const nb = g.map((k) => k.nb).filter((x) => x !== null); return nb.length > 1 && Math.max(...nb) - Math.min(...nb) > 1; })()));
      const small = textEls.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => `${el.tagName.toLowerCase()}.${el.className?.baseVal ?? el.className}:${el.textContent.trim().slice(0, 20)}`);
      const numCells = [...document.querySelectorAll('td.num')].filter(vis);
      const badNum = numCells.filter((td) => { const s = getComputedStyle(td); return s.textAlign !== 'right' || !s.fontVariantNumeric.includes('tabular-nums'); }).length;
      let clash = 0;
      for (const el of textEls) { const s = getComputedStyle(el); if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.color === s.backgroundColor) clash++; }
      return {
        titleFam: title ? fam(title) : '', bodyFam: fam(document.body),
        offenders: [...new Set(textEls.filter((el) => !ok.test(fam(el))).map((el) => `${el.tagName.toLowerCase()} (${fam(el).split(',')[0]})`))].slice(0, 5),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        titleLeft: title?.getBoundingClientRect().left, tileLeft: tile?.getBoundingClientRect().left,
        clusterRight: cluster?.getBoundingClientRect().right, contentRight,
        kpiRows: Object.keys(rows).length, kpiBad: kpiBad.length, small: small.slice(0, 5), smallCount: small.length,
        numCells: numCells.length, badNum, wrappers: [...document.querySelectorAll('.recharts-wrapper')].filter(vis).map((e) => Math.round(e.getBoundingClientRect().height)), clash,
      };
    });
    report(/^Archivo/.test(r.titleFam) && /^IBM Plex Sans/.test(r.bodyFam) && !r.offenders.length, `${tag} 1 fonts: title ${r.titleFam.split(',')[0]}, body ${r.bodyFam.split(',')[0]}${r.offenders.length ? `, offenders ${r.offenders.join(' | ')}` : ''}`);
    report(!r.overflow, `${tag} 2 no horizontal overflow`);
    report(r.tileLeft !== undefined && Math.abs(r.titleLeft - r.tileLeft) <= 1 && Math.abs(r.clusterRight - r.contentRight) <= 1, `${tag} 3 edges: title ${r.titleLeft?.toFixed(1)} / tile ${r.tileLeft?.toFixed(1)}, cluster ${r.clusterRight?.toFixed(1)} / content ${r.contentRight.toFixed(1)}`);
    report(r.kpiBad === 0, `${tag} 4 KPI rows aligned (${r.kpiRows} rows, ${r.kpiBad} misaligned)`);
    report(r.smallCount === 0, `${tag} 5 text at least 12px${r.smallCount ? `: ${r.small.join(' | ')}` : ''}`);
    report(r.badNum === 0, `${tag} 6 numeric cells right aligned and tabular (${r.numCells} cells, ${r.badNum} wrong)`);
    report(r.wrappers.every((x) => x > 100) && r.clash === 0, `${tag} 7 charts ${JSON.stringify(r.wrappers)}, colour clashes ${r.clash}`);
    if (SHOTS.has(route)) await page.screenshot({ path: `/tmp/shots/${route === '/' ? 'home' : route.slice(1)}-${w}.png`, fullPage: true });
  }
  report(errors.length === 0, `${w} page errors ${errors.slice(0, 2).join(' | ')}`);
  await page.close();
}
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
