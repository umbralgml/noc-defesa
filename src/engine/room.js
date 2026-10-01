// Sala do NOC no topo do mapa: o analista anda pela sala (toque no chão ou setas do teclado)
// e, ao chegar num equipamento, abre os incidentes daquele local. A câmera acompanha o herói.
import { $, store } from './util.js';
import { sfx, au } from './audio.js';
import { ROOM_W, STATIONS, LOCNAME, roomSVG } from './scene.js';
import { S, LEVELS, K, unlocked } from './state.js';
import { flow, modal, closeModal } from './ui.js';
import { brief } from './game.js';

const SPEED = 240, MINX = 14, MAXX = ROOM_W - 14;   // unidades do SVG por segundo
let x = 0, dir = 1, walkT = null, stepT = null, svg, hero, rh;

const clampX = v => Math.max(MINX, Math.min(MAXX, v));
const stationAt = sx => STATIONS.find(t => sx >= t.x1 && sx <= t.x2);
const nearest = () => STATIONS.reduce((a, t) => Math.abs(t.stand - x) < Math.abs(a.stand - x) ? t : a);

// Câmera: desloca a sala para manter o herói no centro (sem passar das bordas).
function camera(dur) {
  const box = $('roomv'), scale = svg.getBoundingClientRect().height / 120, w = ROOM_W * scale;
  if (!box.clientWidth || !scale) return;   // mapa escondido: o ResizeObserver recalcula quando aparecer
  const off = Math.max(0, Math.min(w - box.clientWidth, x * scale - box.clientWidth / 2));
  svg.style.transition = dur ? `transform ${dur}s linear` : 'none';
  svg.style.transform = `translateX(${-off}px)`;
}

function place(nx, dur) {
  rh.style.transition = dur ? `transform ${dur}s linear` : 'none';
  rh.style.transform = `translate(${nx}px,106px)`;
  hero.style.transform = `scale(${dir},1)`;
  camera(dur);
}

// Anda até nx e, ao chegar, chama done().
function walk(nx, done) {
  nx = clampX(nx);
  clearTimeout(walkT); clearInterval(stepT);
  const dist = Math.abs(nx - x), dur = dist / SPEED;
  if (dist > 2) dir = nx < x ? -1 : 1;
  x = nx; store('noc_roomx', x);
  if (dist < 3) { place(x, 0); if (done) done(); return; }
  hero.classList.remove('idle', 'type'); hero.classList.add('walk');
  place(x, dur);
  stepT = setInterval(sfx.step, 260);
  walkT = setTimeout(() => {
    clearInterval(stepT); hero.classList.remove('walk'); hero.classList.add('idle');
    if (done) done();
  }, dur * 1000);
}

function goStation(t) { au(); walk(t.stand, () => { hero.classList.add('type'); openStation(t); }); }

// Incidentes do local: lista com estado e acesso ao briefing.
function openStation(t) {
  const list = LEVELS.map((L, i) => ({ L, i })).filter(o => o.L.loc === t.loc);
  const nextI = LEVELS.findIndex((L, i) => unlocked(i) && !S.prog[K(i)]);
  modal(`<div class="tag">${LOCNAME[t.loc]}</div><h2>${t.name}</h2>
    <div class="stlist">${list.map(({ L, i }) => {
      const st = S.prog[K(i)] || 0, lock = !unlocked(i);
      return `<button class="stl${lock ? ' lock' : ''}${i === nextI ? ' next' : ''}" data-i="${i}" ${lock ? 'disabled' : ''}>
        <span class="stln">${lock ? '🔒' : i + 1}</span><span class="stt">${L.title}<small>${L.tag}</small></span>
        <span class="sts">${i === nextI ? 'PRÓXIMO' : '★'.repeat(st) + '☆'.repeat(3 - st)}</span></button>`;
    }).join('')}</div>
    <div class="row"><button class="btn ghostb" id="mCancel">VOLTAR</button></div>`);
  $('mCancel').onclick = closeModal;
  $('mcard').querySelectorAll('.stl:not(.lock)').forEach(b => b.onclick = () => brief(+b.dataset.i));
}

// Placas: "!" piscando onde está o próximo incidente e contador de concluídas.
function badges() {
  if (!svg) return;
  const nextI = LEVELS.findIndex((L, i) => unlocked(i) && !S.prog[K(i)]);
  STATIONS.forEach(t => {
    const g = svg.querySelector(`.stn[data-loc="${t.loc}"]`), idx = LEVELS.map((L, i) => L.loc === t.loc ? i : -1).filter(i => i >= 0);
    const done = idx.filter(i => S.prog[K(i)]).length;
    g.querySelector('.stncnt').textContent = idx.length ? `${done}/${idx.length}` : '';
    g.classList.toggle('alert', idx.includes(nextI));
    g.setAttribute('aria-label', `${t.name}: ${done} de ${idx.length} incidentes concluídos${idx.includes(nextI) ? ', próximo incidente aqui' : ''}`);
  });
  requestAnimationFrame(() => camera(0));
}

export function initRoom() {
  $('roomv').innerHTML = roomSVG();
  svg = $('roomv').querySelector('svg'); rh = svg.querySelector('.rhero'); hero = rh.querySelector('.hero');
  hero.style.transition = 'none'; hero.classList.add('idle');
  x = clampX(store('noc_roomx') || STATIONS[0].stand + 40);
  place(x, 0);
  // Toque: equipamento → vai até ele; chão → anda até o ponto.
  svg.addEventListener('click', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const sx = p.matrixTransform(svg.getScreenCTM().inverse()).x, t = stationAt(sx);
    if (t && e.target.closest('.stn')) goStation(t); else { au(); walk(sx); }
  });
  svg.addEventListener('keydown', e => {
    const g = e.target.closest && e.target.closest('.stn');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); goStation(STATIONS.find(t => t.loc === g.dataset.loc)); }
  });
  // Teclado no mapa: setas andam, Enter abre o equipamento mais próximo.
  addEventListener('keydown', e => {
    if (!$('map').classList.contains('on') || $('modal').classList.contains('on') || e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); walk(x + (e.key === 'ArrowLeft' ? -90 : 90)); }
    else if (e.key === 'Enter' && !e.target.closest('button,.stn')) { const t = nearest(); if (Math.abs(t.stand - x) < 70) goStation(t); }
  });
  new ResizeObserver(() => camera(0)).observe($('roomv'));
  flow.room = badges;
}
