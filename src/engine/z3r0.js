// Z3R0 ativo: eventos surpresa durante a fase, na medida da dificuldade do ato.
//   intermediário: 1 evento · avançado: 2 eventos · iniciante/básico, desafio diário e treino: nenhum.
// Eventos: glitch (só visual), embaralhar (fichas ou coluna da direita) e ataque relâmpago
// (faça N acertos em X segundos: bloqueou = +300 pontos; falhou = -5% de integridade).
import { $, store, shuffle } from './util.js';
import { S, diffOf } from './state.js';
import { flow, toast, setScore, setHP, floatTxt, vignette } from './ui.js';
import { sfx } from './audio.js';
import { unlock } from './ach.js';
import { drawWires } from './wire.js';

let timers = [], rush = null;
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const active = () => S.lv && !S.busy && $('game').classList.contains('on');

export function stopZ3r0() {
  timers.forEach(clearTimeout); timers = [];
  if (rush) { clearInterval(rush.iv); rush = null; }
  const b = $('rush'); if (b) b.remove();
  $('stage').classList.remove('glitchy');
}

export function startZ3r0(L) {
  stopZ3r0();
  if (L.onWin || L.tutorial || L.type === 'defense' || store('noc_teste')) return;   // defesa já é tempo real
  const n = Math.max(0, diffOf(L) - 1) + (L.hard ? 1 : 0);   // intermediário 1, avançado 2 (+1 no modo difícil)
  let t = 9000 + Math.random() * 6000;
  for (let k = 0; k < n; k++) { later(() => fire(L), t); t += 16000 + Math.random() * 10000; }
}

function fire(L) {
  if (!active()) return;
  const kinds = L.type === 'topo' ? ['glitch'] : ['glitch', 'rush'];   // na topologia não há acerto rápido para fazer
  if (L.type === 'drop' || L.type === 'wire') kinds.push('shuffle');
  const k = kinds[Math.random() * kinds.length | 0];
  if (k === 'glitch') glitch(); else if (k === 'shuffle') scramble(L); else startRush(L);
}

function glitch() {
  sfx.zap(); toast('Glitch no seu painel! Hahaha!', false);
  $('stage').classList.add('glitchy');
  later(() => $('stage').classList.remove('glitchy'), 2600);
}

function scramble(L) {
  sfx.whoosh(); toast('Embaralhei tudo. Boa sorte!', false);
  if (L.type === 'drop') { const bank = $('bank'), chips = [...bank.querySelectorAll('.chip')]; shuffle(chips).forEach(c => bank.append(c)); }
  else { const col = $('colR'); if (!col) return; shuffle([...col.querySelectorAll('.port')]).forEach(p => col.append(p)); drawWires(); }
}

function startRush(L) {
  const quick = ['quiz', 'term', 'pcap'].includes(L.type);
  const need = quick ? 1 : 2, secs = quick ? 20 : 12;
  rush = { need, got: 0, left: secs };
  sfx.siren();
  const b = document.createElement('div'); b.id = 'rush'; b.className = 'rush';
  $('game').append(b);
  const paint = () => { b.innerHTML = `<b>⚠ ATAQUE RELÂMPAGO</b><span>Faça ${rush.need - rush.got} acerto${rush.need - rush.got > 1 ? 's' : ''} em <i>${rush.left}s</i> para bloquear</span>`; };
  paint();
  rush.iv = setInterval(() => {
    if (!rush) return;
    if (!active()) { stopRush(); return; }
    rush.left--; paint(); if (rush.left <= 3) sfx.tick();
    // Falhar custa integridade, mas não conta como erro de jogada (não tira estrela).
    if (rush.left <= 0) { stopRush(); sfx.bad(); vignette('bad'); toast('O ataque passou! -5% de integridade.', false); if (S.hp > 5) { S.hp -= 5; setHP(); } }
  }, 1000);
  rush.paint = paint;
}
function stopRush() { if (!rush) return; clearInterval(rush.iv); rush = null; const b = $('rush'); if (b) b.remove(); }

// Chamado a cada acerto (gancho em ui.good).
function onGood(at) {
  if (!rush) return;
  rush.got++;
  if (rush.got < rush.need) { rush.paint(); return; }
  stopRush();
  S.score += 300; setScore(); sfx.win();
  toast('Ataque bloqueado! +300', true);
  if (at) floatTxt(at.x, at.y - 30, 'BLOQUEADO +300', '#ffd166');
  unlock('relampago');
}

export function initZ3r0() { flow.good = onGood; }
