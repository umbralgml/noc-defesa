// Motor "topo": topologia viva. O jogador dispara pings a partir de um ponto da rede, vê o pacote
// andar pelos enlaces e, depois de testar, aponta onde está a falha (equipamento ou cabo).
// Acertou: passa para as perguntas de diagnóstico (opcionais) e vence.
import { $, center } from './util.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { good, damage, explain, info, note, flow } from './ui.js';
import { bankAdd } from './bank.js';
import { runSteps } from './steps.js';
import { lid, path, reach } from './netlib.js';

const MIN_PINGS = 2, HOP = 380;
const ICO = { pc: '💻', sw: '🔀', rt: '🌐', fw: '🧱', srv: '🖥️', net: '☁️', ap: '📶' };
let L = null, mode = 'ping', pinged = new Set(), okSeen = new Set(), busy = false, timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const node = id => L.nodes.find(n => n.id === id);

export function resetTopo() { timers.forEach(clearTimeout); timers = []; busy = false; }

export function renderTopo(level) {
  L = level; resetTopo(); mode = 'ping'; pinged = new Set(); okSeen = new Set();
  const st = $('stage');
  let svg = `<svg class="topo" id="topo" viewBox="0 0 360 230" role="group" aria-label="Diagrama da rede">`;
  L.links.forEach(k => {
    const A = node(k.a), B = node(k.b), id = lid(k.a, k.b);
    svg += `<g class="tlink${k.off ? ' off' : ''}" data-id="${id}" tabindex="-1" role="button" aria-label="Cabo ${A.t} até ${B.t}">
      <line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="lw"/><line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="lv"/>
      ${k.t ? `<text x="${(A.x + B.x) / 2}" y="${(A.y + B.y) / 2 - 4}" text-anchor="middle"></text>` : ''}</g>`;
  });
  L.nodes.forEach(n => {
    svg += `<g class="tnode${n.id === L.from ? ' src' : ''}" data-id="${n.id}" tabindex="0" role="button" transform="translate(${n.x},${n.y})">
      <rect x="-30" y="-17" width="60" height="34" rx="8"/><text class="ti" y="-1" text-anchor="middle">${ICO[n.kind] || '•'}</text>
      <text class="tl" y="12" text-anchor="middle"></text><text class="tip" y="27" text-anchor="middle"></text></g>`;
  });
  svg += '<circle class="tpkt" id="tpkt" r="5" cx="-20" cy="-20"/></svg>';
  st.innerHTML = `${L.intro ? `<div class="task">${L.intro}</div>` : ''}
    <div class="tmode" id="tmode"></div>${svg}
    <div class="term tlogbox"><div class="tlog" id="tlog"></div></div><div class="tstep" id="tstep"></div>`;
  // textos do JSON vão por textContent
  L.nodes.forEach(n => { const g = st.querySelector(`.tnode[data-id="${n.id}"]`); g.setAttribute('aria-label', n.t + (n.ip ? ' ' + n.ip : '')); g.querySelector('.tl').textContent = n.t; g.querySelector('.tip').textContent = n.ip || ''; });
  L.links.forEach(k => { const t = st.querySelector(`.tlink[data-id="${lid(k.a, k.b)}"] text`); if (t) t.textContent = k.t; });
  st.querySelectorAll('.tnode, .tlink').forEach(g => {
    g.onclick = () => tap(g.dataset.id, g);
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(g.dataset.id, g); } };
  });
  print(`Origem dos testes: ${node(L.from).t}${node(L.from).ip ? ' (' + node(L.from).ip + ')' : ''}. Toque num equipamento para mandar um ping até ele.`, 'tsys');
  const bank = $('bank');
  bank.innerHTML = `<div class="bankh"><span>FERRAMENTAS</span><span id="bankCnt">0/${MIN_PINGS} PINGS</span></div>
    <button class="cmd tool on" id="tPing">📡 PING</button><button class="cmd tool" id="tBlame" disabled>🎯 APONTAR FALHA</button>`;
  bank.style.display = 'flex';
  $('tPing').onclick = () => setMode('ping'); $('tBlame').onclick = () => setMode('blame');
  setMode('ping');
}

function setMode(m) {
  if (S.busy) return;
  mode = m; sfx.sel();
  $('tPing').classList.toggle('on', m === 'ping'); $('tBlame').classList.toggle('on', m === 'blame');
  $('topo').classList.toggle('blame', m === 'blame');
  $('tmode').textContent = m === 'ping' ? '📡 MODO PING: toque num equipamento para testar se ele responde.' : '🎯 MODO FALHA: toque no equipamento ou no cabo que está com problema.';
  $('topo').querySelectorAll('.tlink').forEach(g => g.setAttribute('tabindex', m === 'blame' ? '0' : '-1'));
}

function print(text, cls) {
  const log = $('tlog'); if (!log) return;
  const d = document.createElement('div'); d.className = cls || 'tout'; d.textContent = text;
  log.append(d); log.scrollTop = log.scrollHeight;
}

function tap(id, g) {
  if (S.busy || busy) return;
  if (mode === 'ping') { if (node(id) && id !== L.from) ping(id); return; }
  blame(id, g);
}

function ping(to) {
  const p = path(L, to), n = node(to);
  print(`$ ping -c 3 ${n.ip || n.t}`, 'tcmd'); sfx.key();
  if (!p) { print('connect: Network is unreachable', 'terr'); return; }
  const r = reach(L, p), ok = r === p.length - 1;
  busy = true;
  // anima o pacote salto a salto; se parar antes, fica piscando onde morreu
  const pk = $('tpkt'); pk.classList.remove('dead'); pk.classList.add('on');
  const go = (i) => { const a = node(p[i]); pk.setAttribute('cx', a.x); pk.setAttribute('cy', a.y); };
  go(0);
  for (let i = 1; i <= r; i++) later(() => { go(i); sfx.tick(); }, i * HOP);
  later(() => {
    if (ok) {
      for (let i = r - 1; i >= 0; i--) later(() => go(i), (r - i) * HOP / 2);
      later(() => pk.classList.remove('on'), r * HOP / 2 + 100);
      print(`3 packets transmitted, 3 received, 0% packet loss`, 'tok'); sfx.sel();
      p.forEach((x, i) => { okSeen.add(x); if (i) okSeen.add(lid(p[i - 1], x)); });
    } else {
      pk.classList.add('dead'); later(() => pk.classList.remove('on', 'dead'), 1200);
      print(`3 packets transmitted, 0 received, 100% packet loss`, 'terr');
      // trace mostra até onde chegou (fases mais difíceis podem desligar com "trace": false)
      if (L.trace !== false) print('traceroute: ' + trace(p, r), 'tsys');
    }
    if (!pinged.has(to)) {
      pinged.add(to);
      if (n.why) info(n.t, n.why, 'EQUIPAMENTO');
      $('bankCnt').textContent = `${Math.min(pinged.size, MIN_PINGS)}/${MIN_PINGS} PINGS`;
      if (pinged.size === MIN_PINGS) { $('tBlame').disabled = false; info('PRONTO PARA DIAGNOSTICAR', 'Compare os pings que voltaram com os que morreram. A falha está entre o último ponto que responde e o primeiro que não responde. Use 🎯 APONTAR FALHA quando tiver certeza.', 'DICA'); }
    }
    busy = false;
  }, r * HOP + 300);
}

// Só equipamentos de camada 3 aparecem no traceroute; switch e access point são invisíveis a ele.
function trace(p, r) {
  const out = []; let n = 0;
  for (let i = 1; i < p.length; i++) {
    const x = node(p[i]);
    if (i > r) { out.push(`${++n} * * *`); break; }
    if (!['sw', 'ap'].includes(x.kind) || i === p.length - 1) out.push(`${++n} ${x.t} ✓`);
  }
  return out.join('  ');
}

function blame(id, g) {
  const at = center(g), isNode = !!node(id);
  const name = isNode ? node(id).t : (() => { const [a, b] = id.split('-'); return `Cabo ${node(a).t} ↔ ${node(b).t}`; })();
  if ((L.accept || [L.fault]).includes(id)) {
    S.busy = true; g.classList.add('fault');
    const fe = $('topo').querySelector(`[data-id="${L.fault}"]`); if (fe) fe.classList.add('fault');
    explain(true, name, L.faultWhy); good(at);
    $('tBlame').disabled = true; $('tPing').disabled = true;
    if (!L.steps || !L.steps.length) { later(() => flow.win(), 1400); return; }
    later(() => { S.busy = false; runSteps($('tstep'), L, L.steps, q => { if (q.run) print(`$ ${q.run}`, 'tcmd'); if (q.out) print(q.out, 'tok'); },
      () => { S.busy = true; later(() => flow.win(), 1400); }); $('tstep').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 900);
    return;
  }
  // errou: a explicação vem do que os testes já mostraram
  const k = L.links.find(k => lid(k.a, k.b) === id) || {};
  const why = okSeen.has(id) ? `Um ping passou por ${isNode ? 'este equipamento' : 'este cabo'} e voltou, então ele funciona. A falha está em outro ponto.`
    : k.why || 'Nada nos testes aponta para cá. Mande pings para destinos diferentes e compare onde eles param.';
  g.classList.add('wrongt'); setTimeout(() => g.classList.remove('wrongt'), 700);
  explain(false, name, why);
  note(`${L.title}: ${name}`, `Não era aí. ${L.faultWhy}`);
  bankAdd(`${L.title}|falha`, { lv: L.title, q: `${L.title}: onde estava a falha?`, o: [L.faultName, { t: name, why }], a: 0, why: L.faultWhy });
  damage(15, at);
}
