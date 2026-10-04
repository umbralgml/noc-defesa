// Motor "pcap": análise de captura no estilo Wireshark. O jogador filtra os pacotes com
// filtros de exibição (chips prontos ou digitados) e classifica cada um como NORMAL ou SUSPEITO,
// um por vez ou todos os visíveis de uma vez. Filtro largo demais pega cliente legítimo junto.
import { $, center } from './util.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { good, damage, explain, info, note, setScore, flow } from './ui.js';
import { bankAdd } from './bank.js';
import { compile, L4 } from './netlib.js';

let L = null, done = {}, sel = -1, vis = [], used = new Set();

// ---------- tela ----------
export function renderPcap(level) {
  L = level; done = {}; sel = -1; used = new Set();
  S.need = L.packets.length; S.placed = 0;
  const st = $('stage');
  st.innerHTML = `${L.intro ? `<div class="task">${L.intro}</div>` : ''}
    <form class="pfilter" id="pform"><span>🔎</span><input id="pin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="filtro de exibição, ex.: tcp.flags.syn == 1" aria-label="Filtro de exibição"><button class="cmd">APLICAR</button></form>
    <div class="pchips" id="pchips"></div>
    <div class="pcap"><div class="prow ph"><span>Nº</span><span>Origem</span><span>Destino</span><span>Proto</span><span>Info</span></div><div id="prows"></div></div>
    <div class="pdet" id="pdet"><div class="tlock">Toque num pacote para ver os detalhes e classificar.</div></div>`;
  (L.filters || []).forEach(f => { const b = document.createElement('button'); b.className = 'cmd chip'; b.textContent = f.f; b.onclick = () => { $('pin').value = f.f; apply(f); }; $('pchips').append(b); });
  $('pform').onsubmit = e => { e.preventDefault(); apply(); };
  const bank = $('bank');
  bank.innerHTML = `<div class="bankh"><span>CLASSIFICAR OS VISÍVEIS</span><span id="bankCnt">0/${S.need}</span></div>
    <button class="cmd pbulk bad" id="pBad">⚠ TODOS SUSPEITOS</button><button class="cmd pbulk" id="pOk">✓ TODOS NORMAIS</button>`;
  bank.style.display = 'flex';
  $('pBad').onclick = e => bulk(true, e.currentTarget); $('pOk').onclick = e => bulk(false, e.currentTarget);
  vis = L.packets.map((_, i) => i); rows();
}

function apply(f) {
  if (S.busy) return;
  const src = $('pin').value.trim();
  let fn;
  try { fn = compile(src); } catch (e) { $('pform').classList.add('err'); sfx.bad(); info('FILTRO INVÁLIDO', `${e.message}. Exemplos: tcp.flags.syn == 1 && tcp.flags.ack == 0 · ip.src == 45.67.89.10 · udp.port == 53 · !dns`, 'FILTRO'); return; }
  $('pform').classList.remove('err'); sfx.sel();
  vis = L.packets.map((p, i) => i).filter(i => { try { return fn(L.packets[i]); } catch { return false; } });
  f = f || (L.filters || []).find(x => x.f === src);
  if (f && f.why && !used.has(f.f)) { used.add(f.f); info(f.f, f.why, 'FILTRO'); }
  rows();
}

function rows() {
  const box = $('prows'); box.innerHTML = '';
  if (!vis.length) box.innerHTML = '<div class="pnone">Nenhum pacote casa com esse filtro.</div>';
  vis.forEach(i => {
    const p = L.packets[i], r = document.createElement('button');
    r.className = 'prow' + (i === sel ? ' sel' : '') + (i in done ? (done[i] ? ' mbad' : ' mok') : '');
    [i + 1, p.src, p.dst, p.proto, p.info].forEach(v => { const s = document.createElement('span'); s.textContent = v; r.append(s); });
    r.onclick = () => pick(i); box.append(r);
  });
  const left = vis.filter(i => !(i in done)).length;
  $('pBad').textContent = `⚠ ${left} SUSPEITO${left === 1 ? '' : 'S'}`; $('pOk').textContent = `✓ ${left} NORMA${left === 1 ? 'L' : 'IS'}`;
  $('pBad').disabled = $('pOk').disabled = !left;
}

function pick(i, quiet) {
  if (S.busy && !quiet) return;
  sel = i; if (!quiet) sfx.sel(); rows();
  const p = L.packets[i], d = $('pdet');
  const l4 = (L4[(p.proto || '').toLowerCase()] || (p.proto || '').toLowerCase()).toUpperCase();
  const arp = /^arp$/i.test(p.proto || '');
  const tree = [`Frame ${i + 1}: ${p.len || 60} bytes`, arp ? `Ethernet II, Src: ${p.src}, Dst: ${p.dst}` : `Internet Protocol, Src: ${p.src}, Dst: ${p.dst}`];
  if (p.sport || p.dport) tree.push(`${l4}, Src Port: ${p.sport}, Dst Port: ${p.dport}${p.flags ? `, Flags: [${p.flags}]` : ''}`);
  if (arp) tree.push(`Address Resolution Protocol: ${p.info}`);
  else if (p.proto && !['TCP', 'UDP', 'ICMP'].includes(p.proto.toUpperCase())) tree.push(`${p.proto}: ${p.info}`);
  d.innerHTML = `<div class="ptree"></div>${i in done ? '' : '<div class="row"><button class="opt pbtn" id="pN">✓ NORMAL</button><button class="opt pbtn bad" id="pS">⚠ SUSPEITO</button></div>'}`;
  d.querySelector('.ptree').textContent = tree.join('\n');
  if (!(i in done)) { $('pN').onclick = e => mark([i], false, e.currentTarget); $('pS').onclick = e => mark([i], true, e.currentTarget); }
}

function bulk(bad, btn) { if (!S.busy) mark(vis.filter(i => !(i in done)), bad, btn); }

// Marca pacotes. Cada acerto pontua; cada erro custa integridade e explica.
function mark(list, bad, btn) {
  if (S.busy || !list.length) return;
  const at = center(btn); let wrong = null, right = 0;
  list.forEach(i => {
    const p = L.packets[i]; done[i] = bad;
    if (!!p.bad === bad) { right++; S.placed++; return; }
    S.placed++; wrong = wrong || p;
    note(`Pacote ${i + 1}: ${p.info}`, `Era ${p.bad ? 'SUSPEITO' : 'NORMAL'}. ${p.why}`);
    bankAdd(`${L.title}|${i}`, { lv: L.title, q: `Na captura, o pacote "${p.src} → ${p.dst} ${p.proto} ${p.info}" é normal ou suspeito?`, o: [p.bad ? 'Suspeito' : 'Normal', { t: p.bad ? 'Normal' : 'Suspeito', why: p.why }], a: 0, why: p.why });
  });
  const errs = list.filter(i => !!L.packets[i].bad !== bad).length;
  if (list.length === 1) explain(!wrong, L.packets[list[0]].info, L.packets[list[0]].why);
  else if (wrong) explain(false, `${errs} de ${list.length} marcados errado`, `Seu filtro pegou pacote que não devia. Exemplo: ${wrong.info}. ${wrong.why}`);
  else explain(true, `${list.length} pacotes marcados como ${bad ? 'suspeitos' : 'normais'}`, bad ? 'Filtro certeiro: todos eram do ataque.' : 'Todos eram tráfego legítimo.');
  if (right) { good(at); S.score += (right - 1) * 50; }   // lote certeiro rende por pacote
  if (errs) { S.err += errs - 1; damage(10 * errs, at); }   // cada pacote errado conta para as estrelas
  else setScore();
  $('bankCnt').textContent = `${S.placed}/${S.need}`;
  rows(); if (sel >= 0) pick(sel, true);
  if (S.placed >= S.need && S.hp > 0) { S.busy = true; setTimeout(() => flow.win(), 1200); }
}
