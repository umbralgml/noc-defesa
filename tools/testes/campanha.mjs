#!/usr/bin/env node
// Teste de ponta a ponta (opcional): joga a campanha inteira num Chromium de verdade.
// Sobe um servidor estático próprio, passa por todas as fases (com arrastes reais e
// erros de propósito) e sai com código 1 se alguma travar ou se aparecer erro no console.
//
// Uso:  node tools/testes/campanha.mjs            (precisa do Playwright: npm i -g playwright)
//       node tools/testes/campanha.mjs --visivel  (abre o navegador na tela)
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matches, path, reach, compile } from '../../src/engine/netlib.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LV = join(ROOT, 'src/levels/');
const read = f => JSON.parse(readFileSync(LV + f, 'utf8'));
const levels = read('index.json').acts.flatMap(f => read(f).levels);
const txt = x => typeof x === 'string' ? x : x.t, val = x => typeof x === 'string' ? x : (x.v ?? x.t);

// Playwright local ou global, sem exigir package.json no projeto.
async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  try { return createRequire(join(execSync('npm root -g').toString().trim(), 'x'))('playwright'); }
  catch { console.error('Playwright não encontrado. Instale com: npm i -g playwright && npx playwright install chromium'); process.exit(2); }
}

// Servidor estático mínimo (o jogo usa ES modules e fetch, então precisa de HTTP).
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serve() {
  const srv = createServer((req, res) => {
    let p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    let f = join(ROOT, p); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

const { chromium } = await loadPlaywright();
const srv = await serve(), URL0 = `http://127.0.0.1:${srv.address().port}/`;
const b = await chromium.launch({ headless: !process.argv.includes('--visivel') });
const ctx = await b.newContext({ viewport: { width: 400, height: 800 }, serviceWorkers: 'block' });
// Ranking real fica de fora do teste: o Supabase responde vazio.
await ctx.route(/supabase\.co/, r => r.request().method() === 'GET' ? r.fulfill({ json: [] }) : r.fulfill({ status: 201, body: '' }));
const p = await ctx.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_CERT|ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push(m.text()); });

const firstWire = levels.findIndex(L => L.type === 'wire'), firstSlots = levels.findIndex(L => L.mode === 'slots');
let falhas = 0;
try {
  await p.goto(URL0); await p.waitForSelector('#goMap:not([disabled])');   // carga inicial completa antes de recarregar
  await p.evaluate(() => { localStorage.noc_lesson = 'false'; localStorage.noc_teste = '1'; localStorage.noc_profile = JSON.stringify({ name: '', linkedin: '', consent: false }); });
  await p.reload(); await p.waitForSelector('#goMap:not([disabled])');
  await p.click('#goMap'); await p.waitForSelector('#map.on');
  await p.click('.node[data-i="0"]');
  for (let i = 0; i < levels.length; i++) {
    const L = levels[i], mistake = i % 3 === 1 || (['defense', 'pcap'].includes(L.type) && i === levels.findIndex(x => x.type === L.type));
    if (await p.waitForSelector('#mStory, #mGo').then(e => e.getAttribute('id')) === 'mStory') await p.click('#mStory');
    await p.waitForSelector('#mGo');
    await p.click('#mGo'); await p.waitForTimeout(300); await p.click('#scene'); await p.waitForTimeout(700);
    if (L.type === 'wire') {
      if (mistake) { await p.click(`#colL .port[data-id="${L.left[0].id}"]`); await p.click(`#colR .port[data-id="${L.left[1].id}"]`); }
      for (const [k, it] of L.left.entries()) {
        if (k === 0 && i === firstWire) { // arrasto real do cabo pelo conector
          const ra = await (await p.$(`#colL .port[data-id="${it.id}"] .jack`)).boundingBox(), rb = await (await p.$(`#colR .port[data-id="${it.id}"]`)).boundingBox();
          await p.mouse.move(ra.x + 5, ra.y + 5); await p.mouse.down(); await p.mouse.move(ra.x + 40, ra.y + 20, { steps: 5 }); await p.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2, { steps: 8 }); await p.mouse.up();
        } else { await p.click(`#colL .port[data-id="${it.id}"]`); await p.click(`#colR .port[data-id="${it.id}"]`); }
      }
    } else if (L.type === 'drop') {
      const tap = t => p.evaluate(t => { const c = [...document.querySelectorAll('.chip:not(.used)')].find(c => c.textContent === t); c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })); dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 })); }, t);
      const place = async (t, sel) => { await tap(t); await p.click(sel); };
      if (L.mode === 'slots') {
        const used = new Set(), plan = [];
        for (const [z, acc] of Object.entries(L.zones)) { const c = L.chips.find(c => acc.includes(val(c)) && !used.has(txt(c))); used.add(txt(c)); plan.push([txt(c), `.zone[data-z="${z}"]`]); }
        if (mistake) { const z0 = Object.keys(L.zones)[0]; await place(txt(L.chips.find(c => !L.zones[z0].includes(val(c)))), `.zone[data-z="${z0}"]`); }
        for (const [k, [t, s]] of plan.entries()) {
          if (k === 0 && i === firstSlots) { // arrasto real da ficha, corrigindo a mira se a área rolar
            const c = await p.evaluateHandle(t => [...document.querySelectorAll('.chip:not(.used)')].find(c => c.textContent === t), t);
            await p.$eval(s, z => z.scrollIntoView({ block: 'center' })); await c.evaluate(e => e.scrollIntoView({ block: 'nearest' })); await p.waitForTimeout(200);
            const rc = await c.boundingBox(), rz = await (await p.$(s)).boundingBox();
            await p.mouse.move(rc.x + 5, rc.y + 5); await p.mouse.down(); await p.mouse.move(rc.x + 30, rc.y - 20, { steps: 4 }); await p.mouse.move(rz.x + rz.width / 2, rz.y + rz.height / 2, { steps: 8 }); await p.waitForTimeout(150);
            const rz2 = await (await p.$(s)).boundingBox(); await p.mouse.move(rz2.x + rz2.width / 2, rz2.y + rz2.height / 2, { steps: 3 }); await p.mouse.up();
          } else await place(t, s);
        }
      } else {
        if (mistake) await place(txt(L.buckets[0].a[0]), '.zone[data-b="1"]');
        for (const [bi, bk] of L.buckets.entries()) for (const it of bk.a) await place(txt(it), `.zone[data-b="${bi}"]`);
      }
    } else if (L.type === 'term') {
      await p.click('.cmd >> nth=0'); await p.click('.cmd >> nth=1');
      for (const [k, q] of L.steps.entries()) {
        await p.waitForSelector('#tstep .opt:not([disabled])');
        if (mistake && k === 0) await p.evaluate(t => [...document.querySelectorAll('#tstep .opt')].find(b => b.textContent !== t).click(), txt(q.o[q.a]));
        await p.evaluate(t => [...document.querySelectorAll('#tstep .opt')].find(b => b.textContent === t).click(), txt(q.o[q.a]));
        await p.waitForTimeout(1000);
      }
    } else if (L.type === 'quiz') {
      for (let q = 0; q < L.qs.length; q++) {
        await p.waitForSelector('.opt:not([disabled])');
        await p.evaluate(w => [...document.querySelectorAll('.opt')].find(b => w ? !b._ok : b._ok).click(), mistake && q === 0);
        const label = await p.textContent('#qNext'); await p.click('#qNext');
        if (label !== 'CONTINUAR') break;
      }
    } else if (L.type === 'defense') {
      // liga as regras boas; com erro de propósito, deixa passar o primeiro ataque antes de ligar a que o barraria
      const good = L.rules.filter(r => r.good), first = L.waves[0].packets.find(x => x.bad);
      const late = mistake ? good.find(r => matches(r.match, first)) : null;
      const tog = t => p.evaluate(t => [...document.querySelectorAll('.rule')].find(b => b.textContent === t).click(), t);
      for (const r of good) if (r !== late) await tog(r.t);
      if (late) { await p.waitForFunction(() => +document.getElementById('dDone').textContent >= 1, null, { timeout: 15000 }); await tog(late.t); }
    } else if (L.type === 'topo') {
      const tapN = id => p.evaluate(id => document.querySelector(`#topo [data-id="${id}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), id);
      const res = L.nodes.filter(n => n.id !== L.from).map(n => { const q = path(L, n.id); return [n.id, reach(L, q) === q.length - 1]; });
      for (const id of [res.find(r => r[1])[0], res.find(r => !r[1])[0]]) { await tapN(id); await p.waitForTimeout(2600); }
      await p.click('#tBlame:not([disabled])');
      if (mistake) await tapN(L.nodes.find(n => !(L.accept || [L.fault]).includes(n.id)).id);
      await tapN(L.fault);
      for (const [k, q] of (L.steps || []).entries()) {
        await p.waitForSelector('#tstep .opt:not([disabled])');
        await p.evaluate(t => [...document.querySelectorAll('#tstep .opt')].find(b => b.textContent === t).click(), txt(q.o[q.a]));
        await p.waitForTimeout(1000);
      }
    } else if (L.type === 'pcap') {
      // um filtro que isola só ataques é marcado em lote; o resto, um por um (com um erro de propósito)
      const exact = (L.filters || []).find(f => { const v = L.packets.filter(compile(f.f)); return v.length > 1 && v.every(x => x.bad); });
      const done = new Set(); let erred = !mistake;
      if (exact) { await p.click(`.chip >> text="${exact.f}"`); await p.click('#pBad'); L.packets.forEach((x, k) => { if (compile(exact.f)(x)) done.add(k); }); await p.fill('#pin', ''); await p.click('#pform .cmd'); }
      const row = k => p.evaluate(k => [...document.querySelectorAll('#prows .prow')].find(r => r.firstChild.textContent === String(k)).click(), k + 1);
      for (const [k, x] of L.packets.entries()) {
        if (done.has(k)) continue;
        const wrong = !erred && !x.bad; if (wrong) erred = true;
        await row(k); await p.click(wrong || x.bad ? '#pS' : '#pN');
        done.add(k);
      }
    } else throw new Error(`tipo sem roteiro de teste: ${L.type}`);
    const ok = await p.waitForSelector('#mMap', { timeout: L.type === 'defense' ? 45000 : 9000 }).then(() => true, () => false);
    if (!ok) { falhas++; await p.screenshot({ path: join(ROOT, 'teste-falha.png') }); console.log(`✗ ${i + 1}. ${L.title} travou (print em teste-falha.png)`); break; }
    console.log(`✓ ${String(i + 1).padStart(2)}. ${L.title.padEnd(26)} ${(L.type + (L.mode ? '/' + L.mode : '')).padEnd(13)} ${await p.$eval('.bigstars', e => e.textContent)}${mistake ? '  (com erro de propósito)' : ''}`);
    if (i < levels.length - 1) await p.click('#mNext');
  }
} catch (e) { falhas++; console.log('✗ erro no teste:', e.message); }
if (errs.length) { falhas++; console.log('✗ erros no console:', errs); }
console.log(falhas ? `\nFALHOU (${falhas})` : `\nOK: ${levels.length} fases jogadas sem erro`);
await b.close(); srv.close();
process.exit(falhas ? 1 : 0);
