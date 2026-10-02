// Motor "wire": ligar cada item da esquerda ao par certo da direita, arrastando o cabo
// pelo conector ou tocando nos dois lados. O par certo é o que tem o mesmo "id".
import { $, shuffle, center } from './util.js';
import { au, sfx } from './audio.js';
import { S } from './state.js';
import { MEDIA, icon } from './scene.js';
import { good, damage, flash, toast, explain, flow } from './ui.js';

let wsel = null, WD = null;

export function renderWire(L) {
  $('bank').style.display = 'none';
  const st = $('stage'), h = L.heads || ['ORIGEM', 'DESTINO'];
  st.innerHTML = `<div class="task">${L.goal}</div>
    <div class="stepper" id="stepper"><div class="num" id="stNum">1</div><div class="txt" id="stTxt"></div><div class="cnt"><b id="stCnt">0/${L.left.length}</b>LINKS UP</div></div>
    <div class="wire" id="wire"><div class="col" id="colL"><div class="colh">${h[0]}</div></div><div class="col" id="colR"><div class="colh">${h[1]}</div></div><svg class="wires" id="wsvg"></svg></div>`;
  if (L.legend) st.insertAdjacentHTML('beforeend', `<div class="legend">${Object.values(MEDIA).map(m => `<span><i style="background:${m.c}"></i>${m.n}</span>`).join('')}</div>`);
  S.need = L.left.length; S.placed = 0; S.pairs = [];
  const mk = (p, side) => {
    const d = document.createElement('div');
    const jc = side === 'L' ? (p.m ? MEDIA[p.m].c : '#00e0a8') : '#5b6b86';
    const ico = side === 'L' ? (p.m ? MEDIA[p.m].ico : '') : (p.ico || '');
    d.className = 'port ' + side; d.dataset.id = p.id; d.style.setProperty('--jc', jc); d._c = jc; d._t = p.t; d._p = p;
    d.innerHTML = `<span class="st"></span><div class="pic">${ico ? icon(ico, side === 'L' ? jc : null) : ''}<div class="t"></div></div>${p.s ? '<div class="s"></div>' : ''}<span class="up">LINK UP</span><span class="jack"></span>`;
    d.querySelector('.t').textContent = p.t; if (p.s) d.querySelector('.s').textContent = p.s;
    return d;
  };
  L.left.forEach(p => $('colL').append(mk(p, 'L')));
  shuffle(L.right).forEach(p => $('colR').append(mk(p, 'R')));
  // Tutorial: destaca o primeiro par até o jogador fazer a primeira ligação.
  if (L.tutorial) { const id = L.left[0].id; st.querySelectorAll(`.port[data-id="${id}"]`).forEach(p => p.classList.add('tut')); }
  setStep();
  requestAnimationFrame(() => drawWires());
}

function setStep() {
  const sp = $('stepper'); if (!sp) return;
  const two = !!(wsel || WD && WD.moved);
  const src = wsel || (WD && WD.p);
  sp.classList.toggle('two', two);
  $('stNum').textContent = two ? '2' : '1';
  $('stTxt').innerHTML = two
    ? `Agora toque (ou solte o cabo) na porta de destino de <b></b>`
    : `Toque num item da <b>esquerda</b> ou arraste o cabo pelo conector até a direita.`;
  if (two) $('stTxt').querySelector('b').textContent = src._t;
  $('stCnt').textContent = S.placed + '/' + S.need;
  $('wire').classList.toggle('picking', two);
}
function jackPos(port) {
  const w = $('wire').getBoundingClientRect(), j = port.querySelector('.jack').getBoundingClientRect();
  return { x: j.left + j.width / 2 - w.left, y: j.top + j.height / 2 - w.top };
}
function pathD(a, b) {
  const dx = Math.max(24, Math.abs(b.x - a.x) * .55) * (b.x >= a.x ? 1 : -1);
  return `M${a.x} ${a.y} C${a.x + dx} ${a.y + 6} ${b.x - dx} ${b.y + 6} ${b.x} ${b.y}`;
}
export function drawWires(temp, animIdx) {
  const svg = $('wsvg'); if (!svg) return;
  let s = '';
  S.pairs.forEach((p, i) => {
    const d = pathD(jackPos(p.l), jackPos(p.r)), cls = i === animIdx ? ' class="wn"' : '';
    s += `<path${cls} d="${d}" stroke="rgba(0,0,0,.55)" stroke-width="8" fill="none" stroke-linecap="round"/><path${cls} d="${d}" stroke="${p.c}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path${cls} d="${d}" stroke="rgba(255,255,255,.35)" stroke-width="1.2" fill="none" stroke-linecap="round" transform="translate(0,-1.2)"/>`;
  });
  if (temp) s += `<path d="${pathD(temp.a, temp.b)}" stroke="${temp.c}" stroke-width="4.5" fill="none" stroke-linecap="round" ${temp.bad ? '' : 'stroke-dasharray="8 6"'}/><circle cx="${temp.b.x}" cy="${temp.b.y}" r="8" fill="${temp.c}" stroke="#0b1220" stroke-width="3"/>`;
  svg.innerHTML = s;
  if (animIdx !== undefined) svg.querySelectorAll('.wn').forEach(p => {
    const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset .45s ease-out'; p.style.strokeDashoffset = 0;
  });
}
function connect(l, r) {
  if (S.busy || !l || !r || !l.classList.contains('L') || !r.classList.contains('R')) return;
  if (l.classList.contains('done') || r.classList.contains('done')) return;
  const at = center(r), label = `${l._t} → ${r._t}`;
  if (l.dataset.id === r.dataset.id) {
    l.classList.add('done'); r.classList.add('done'); r.style.setProperty('--jc', l._c);
    document.querySelectorAll('.port.tut').forEach(p => p.classList.remove('tut'));   // tutorial cumprido
    S.pairs.push({ l, r, c: l._c }); S.placed++;
    explain(true, label, l._p.why);
    drawWires(null, S.pairs.length - 1); sfx.plug(); good(at, l._c);
    if (S.placed >= S.need) { S.busy = true; setTimeout(() => flow.win(), 800); }
  } else {
    explain(false, label, r._p.why);
    drawWires({ a: jackPos(l), b: jackPos(r), c: '#ff4d6d', bad: true });
    setTimeout(() => drawWires(), 450);
    flash(l); flash(r); damage(15, at);
  }
  setStep();
}
function select(p) {
  if (wsel) wsel.classList.remove('sel');
  wsel = p; if (p) { p.classList.add('sel'); sfx.sel(); }
  setStep();
}

export function resetWire() { wsel = null; WD = null; }

export function initWire() {
  $('stage').addEventListener('pointerdown', e => {
    const p = e.target.closest('.port');
    if (!p || p.classList.contains('done') || S.busy) return;
    au();
    WD = { p, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!WD || e.pointerId !== WD.id || !WD.p.classList.contains('L')) return;
    if (!WD.moved) {
      if (Math.hypot(e.clientX - WD.sx, e.clientY - WD.sy) < 7) return;
      WD.moved = true; if (wsel && wsel !== WD.p) wsel.classList.remove('sel');
      wsel = null; WD.p.classList.add('sel'); setStep();
    }
    const w = $('wire').getBoundingClientRect();
    drawWires({ a: jackPos(WD.p), b: { x: e.clientX - w.left, y: e.clientY - w.top }, c: WD.p._c });
    document.querySelectorAll('.port.tgt').forEach(x => x.classList.remove('tgt'));
    const el = document.elementFromPoint(e.clientX, e.clientY), t = el && el.closest('.port.R:not(.done)');
    if (t) t.classList.add('tgt');
    const r = $('stage').getBoundingClientRect();
    WD.as = e.clientY < r.top + 50 ? -1 : e.clientY > r.bottom - 50 ? 1 : 0;
  });
  const end = (e, cancel) => {
    if (!WD || e.pointerId !== WD.id) return;
    const w = WD; WD = null;
    document.querySelectorAll('.port.tgt').forEach(x => x.classList.remove('tgt'));
    if (w.moved) {
      w.p.classList.remove('sel'); drawWires();
      if (!cancel) { const el = document.elementFromPoint(e.clientX, e.clientY), t = el && el.closest('.port'); if (t) connect(w.p, t); }
      setStep();
    } else if (!cancel) {
      const isL = w.p.classList.contains('L');
      if (isL) { if (wsel === w.p) select(null); else select(w.p); }
      else if (wsel) { const a = wsel; wsel.classList.remove('sel'); wsel = null; connect(a, w.p); }
      else toast('Comece pelo item da esquerda.', true);
    }
  };
  addEventListener('pointerup', e => end(e, false));
  addEventListener('pointercancel', e => end(e, true));
  (function autoScroll() {
    if (WD && WD.moved && WD.as) $('stage').scrollTop += WD.as * 7;
    requestAnimationFrame(autoScroll);
  })();
  addEventListener('resize', () => { if ($('wire')) drawWires(); });
}
