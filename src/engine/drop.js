// Motor "drop": fichas no banco de baixo que o jogador arrasta (ou toca e escolhe o destino).
//   mode "buckets": soltar cada ficha na categoria certa.
//   mode "slots":   preencher lacunas [id] de um template HTML.
import { $, shuffle, center } from './util.js';
import { au, sfx } from './audio.js';
import { S } from './state.js';
import { good, damage, flash, explain, flow } from './ui.js';
import { bankAdd, bankWhy } from './bank.js';

// Ficha no JSON pode ser "texto" ou { "t": texto, "v": valor, "why": explicação }.
const norm = c => typeof c === 'string' ? { t: c, v: c } : { t: c.t, v: c.v ?? c.t, why: c.why };

let L = null, bucketVals = [], sel = null, D = null;

export function renderDrop(level) {
  L = level;
  const st = $('stage'); st.innerHTML = '';
  if (L.intro) st.insertAdjacentHTML('beforeend', `<div class="task">${L.intro}</div>`);
  let chips;
  if (L.mode === 'slots') {
    const html = L.html.replace(/\[(\w+)\]/g, (m, id) => `<span class="zone slot${L.wide ? ' wide' : ''}" data-z="${id}" tabindex="0" role="button" aria-label="Lacuna">${L.wide ? 'solte aqui' : '?'}</span>`);
    st.insertAdjacentHTML('beforeend', `<div class="tpl">${html}</div>`);
    S.need = Object.keys(L.zones).length;
    chips = L.chips.map(norm);
  } else {
    const w = document.createElement('div'); w.className = 'buckets';
    L.buckets.forEach((b, bi) => w.insertAdjacentHTML('beforeend', `<div class="zone bucket" data-b="${bi}" style="--bc:${b.c}" tabindex="0" role="button"><div class="bh">${b.label}</div><div class="bl"></div></div>`));
    st.append(w);
    bucketVals = L.buckets.map(b => b.a.map(x => norm(x).v));
    chips = L.buckets.flatMap(b => b.a.map(norm));
    S.need = chips.length;
  }
  const bank = $('bank'); bank.innerHTML = `<div class="bankh"><span>ARRASTE OU TOQUE E ESCOLHA O DESTINO</span><span id="bankCnt">0/${S.need}</span></div>`; bank.style.display = 'flex';
  shuffle(chips).forEach(c => { const d = document.createElement('div'); d.className = 'chip'; d.textContent = c.t; d._c = c; d.tabIndex = 0; d.setAttribute('role', 'button'); bank.append(d); });
}

function zoneAt(x, y) {
  const el = document.elementFromPoint(x, y), z = el && el.closest('.zone');
  if (!z || (z.classList.contains('ok') && z.classList.contains('slot'))) return null;
  return z;
}
function clearSel() { if (sel) sel.classList.remove('sel'); sel = null; }

function tryPlace(chip, zone) {
  if (S.busy || !chip || chip.classList.contains('used')) return;
  const c = chip._c, at = center(zone);
  let ok, why;
  if (zone.dataset.z !== undefined) {
    if (zone.classList.contains('ok')) return;
    ok = L.zones[zone.dataset.z].includes(c.v);
    why = ok ? (L.explain && L.explain[zone.dataset.z]) || c.why : c.why;
    if (ok) { zone.textContent = c.t; zone.classList.add('ok'); }
  } else {
    ok = bucketVals[+zone.dataset.b].includes(c.v);
    why = c.why;
    if (ok) { const m = document.createElement('div'); m.className = 'mini'; m.textContent = c.t; zone.querySelector('.bl').append(m); }
  }
  clearSel();
  explain(ok, c.t, why);
  if (ok) {
    chip.classList.add('used'); S.placed++; sfx.drop(); good(at, zone.dataset.b !== undefined ? L.buckets[+zone.dataset.b].c : null);
    const bc = $('bankCnt'); if (bc) bc.textContent = S.placed + '/' + S.need;
    zone.classList.add('pop'); setTimeout(() => zone.classList.remove('pop'), 320);
    if (S.placed >= S.need) { S.busy = true; setTimeout(() => flow.win(), 600); }
  } else { flash(zone); flash(chip); toBank(c); damage(15, at); }
}

// Erro vira item do treino.
function toBank(c) {
  if (L.mode === 'buckets') {
    const a = bucketVals.findIndex(v => v.includes(c.v)), labels = L.buckets.map(b => b.label.replace(/<[^>]+>/g, ''));
    bankAdd(`${L.title}|${c.t}`, { lv: L.title, q: `${L.title}: em qual categoria fica "${c.t}"?`, a,
      o: labels.map((t, i) => i === a ? t : { t, why: `"${c.t}" não pertence a ${t}.` }), why: c.why || `"${c.t}" pertence a ${labels[a]}.` });
  } else bankWhy(L.title, c.t, c.why, L.chips.map(x => typeof x === 'string' ? '' : x.why));
}

export function resetDrop() { clearSel(); D = null; }

export function initDrop() {
  $('bank').addEventListener('pointerdown', e => {
    const c = e.target.closest('.chip');
    if (!c || c.classList.contains('used') || S.busy) return;
    au();
    D = { el: c, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, g: null, hz: null, as: 0 };
  });
  $('stage').addEventListener('click', e => {
    const z = e.target.closest('.zone');
    if (z && sel) tryPlace(sel, z);
  });
  // Teclado: Enter ou espaço escolhe a ficha e depois o destino.
  const key = e => e.key === 'Enter' || e.key === ' ';
  $('bank').addEventListener('keydown', e => {
    const c = e.target.closest('.chip'); if (!c || !key(e) || c.classList.contains('used') || S.busy) return;
    e.preventDefault(); au();
    if (sel === c) clearSel(); else { clearSel(); sel = c; c.classList.add('sel'); sfx.sel(); const z = $('stage').querySelector('.zone:not(.ok)'); if (z) z.focus(); }
  });
  $('stage').addEventListener('keydown', e => {
    const z = e.target.closest('.zone'); if (!z || !key(e)) return;
    e.preventDefault(); if (sel) { tryPlace(sel, z); const n = $('bank').querySelector('.chip:not(.used)'); if (n) n.focus(); }
  });
  addEventListener('pointermove', e => {
    if (!D || e.pointerId !== D.id) return;
    if (!D.moved) {
      if (Math.hypot(e.clientX - D.sx, e.clientY - D.sy) < 7) return;
      D.moved = true; clearSel();
      D.g = D.el.cloneNode(true); D.g.classList.add('ghost'); document.body.append(D.g);
      D.el.classList.add('dragging');
    }
    const gw = D.g.offsetWidth / 2 + 8; D.g.style.left = Math.min(innerWidth - gw, Math.max(gw, e.clientX)) + 'px'; D.g.style.top = e.clientY + 'px';
    const z = zoneAt(e.clientX, e.clientY);
    if (z !== D.hz) { if (D.hz) D.hz.classList.remove('hover'); if (z) z.classList.add('hover'); D.hz = z; }
    const r = $('stage').getBoundingClientRect();
    D.as = e.clientY < r.top + 60 ? -1 : (e.clientY > r.bottom - 60 && e.clientY < r.bottom + 30) ? 1 : 0;
  });
  const end = (e, cancel) => {
    if (!D || e.pointerId !== D.id) return;
    const d = D; D = null;
    if (d.moved) {
      d.g.remove(); d.el.classList.remove('dragging'); if (d.hz) d.hz.classList.remove('hover');
      if (!cancel) { const z = zoneAt(e.clientX, e.clientY); if (z) tryPlace(d.el, z); }
    } else if (!cancel) {
      if (sel === d.el) clearSel(); else { clearSel(); sel = d.el; d.el.classList.add('sel'); sfx.sel(); }
    }
  };
  addEventListener('pointerup', e => end(e, false));
  addEventListener('pointercancel', e => end(e, true));
  (function autoScroll() {
    if (D && D.moved && D.as) $('stage').scrollTop += D.as * 9;
    requestAnimationFrame(autoScroll);
  })();
}
