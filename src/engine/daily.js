// Desafio diário: 5 perguntas com cronômetro, iguais para todo mundo no mesmo dia
// (sorteio com a data como semente). Duas vêm dos quizzes das fases e três são geradas
// na hora (sub-rede, wildcard, endereço de rede, faixas de IP, portas), sempre com o porquê.
import { $, fmt, store } from './util.js';
import { S, LEVELS } from './state.js';
import { AV_Z } from './scene.js';
import { au } from './audio.js';
import { flow, modal, closeModal, reviewHTML, share } from './ui.js';
import { play, goMap } from './game.js';
import { rankOn, submit, profile, openRanking, hooks } from './rank.js';
import { addXP, xpHTML } from './career.js';
import { unlock } from './ach.js';
import { rng, sh, GEN } from './gen.js';

const START = '2026-10-01', N = 5, TIME = 20;

// Data no fuso de Brasília (sem horário de verão desde 2019: UTC-3 fixo).
export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const dayNum = d => Math.round((Date.parse(d) - Date.parse(START)) / 864e5) + 1;
const yesterday = d => new Date(Date.parse(d) - 864e5).toISOString().slice(0, 10);
const board = d => 'dia-' + d;

export function questions(d) {
  const r = rng('noc-' + d);
  // Perguntas das fases, menos as que os geradores já cobrem (evita duas de hosts no mesmo dia).
  // "dailyFrom" (AAAA-MM-DD) segura um quiz novo fora do sorteio até essa data, sem mudar o desafio do dia em curso.
  const pool = LEVELS.filter(L => L.type === 'quiz' && !(L.dailyFrom && d < L.dailyFrom)).flatMap(L => L.qs).filter(q => !/^(Quantos hosts úteis|Qual a wildcard)/.test(q.q));
  const gens = sh(r, Object.keys(GEN)).slice(0, N - 2).map(k => GEN[k](r));
  return sh(r, [...sh(r, pool).slice(0, 2), ...gens]);
}

// ---------- fluxo ----------
// ch = desafio de um colega ({ d, p, h, g, n }) ou nada (desafio do dia).
// Vale como resultado oficial do dia só se for de hoje e o jogador ainda não tiver jogado.
export function startDaily(ch) {
  const d = ch ? ch.d : today(), rec = store('noc_daily'), playedToday = rec && rec.d === today();
  if (!ch && playedToday) return result(rec);
  const official = d === today() && !playedToday;
  modal(`<div class="tag">${ch ? '⚔️ DESAFIO DE UM COLEGA' : 'DESAFIO DIÁRIO'} #${dayNum(d)}</div><h2>${ch ? 'Bate esse placar?' : 'Plantão relâmpago'}</h2>
    ${ch ? `<div class="vs"><b class="vsn"></b> fez <span class="dgrid sm">${grid({ log: ch.g })}</span> <b>${ch.h}/${N} · ${fmt(ch.p)} pts</b></div>` : ''}
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>Cinco perguntas, vinte segundos cada${ch ? ', as mesmas que o seu colega pegou' : ', um placar por dia'}. Quero ver se você é rápido.</div></div>
    <div class="lesson"><span class="lh">REGRAS</span><ul>
      <li>${ch ? `As mesmas <b>${N} perguntas</b> do desafio #${dayNum(d)}.` : `As mesmas <b>${N} perguntas</b> para todo mundo hoje.`}</li>
      <li><b>${TIME} segundos</b> por pergunta. O relógio para enquanto você lê a explicação.</li>
      <li>Acerto rápido vale <b>bônus</b>: 10 pontos por segundo que sobrou.</li>
      <li>${official ? 'Vale o primeiro resultado que você terminar no dia. Amanhã tem outro.' : 'Este é um duelo: não muda seu desafio do dia nem o ranking.'}</li></ul></div>
    <div class="row"><button class="btn ghostb" id="mCancel">VOLTAR</button><button class="btn" id="mGo">${ch ? 'ACEITAR' : 'COMEÇAR'}</button></div>`);
  if (ch) $('mcard').querySelector('.vsn').textContent = ch.n;
  $('mCancel').onclick = closeModal;
  $('mGo').onclick = () => {
    au(); closeModal();
    play({ title: 'Desafio diário', tag: 'DIÁRIO', type: 'quiz', loc: 'war', time: TIME, qs: questions(d),
      cap: `${ch ? 'Duelo' : 'Desafio diário'} #${dayNum(d)}: ${N} perguntas, ${TIME} segundos cada...`,
      tip: 'Leia a pergunta inteira antes de responder: o bônus de velocidade não compensa um erro. O relógio para enquanto você lê a explicação.',
      onWin: res => finish(d, res, ch, official) }, `${ch ? 'Duelo' : 'Desafio diário'} #${dayNum(d)}`);
  };
}

function finish(d, res, ch, official) {
  const speed = S.left * 10;
  const rec = { d, n: dayNum(d), log: S.qlog.slice(), score: res.total, speed, total: res.total + speed, miss: S.miss.slice(0, 6) };
  const hits = rec.log.filter(Boolean).length, xr = addXP(30 + hits * 10);
  unlock('diario'); if (hits === N) unlock('diario5');
  if (ch && rec.total > ch.p) unlock('duelo');
  if (official) {
    store('noc_daily', rec);
    const st = store('noc_streak') || {};
    if (st.d !== d) store('noc_streak', { d, c: st.d === yesterday(d) ? st.c + 1 : 1 });
    const c = (store('noc_streak') || {}).c || 1; if (c >= 3) unlock('seq3'); if (c >= 7) unlock('seq7');
    sendToday();
  }
  result(rec, ch, !official, xr);
}

// Envia o resultado de hoje para o ranking (se o jogador entrou nele).
function sendToday() {
  const rec = store('noc_daily');
  if (!rankOn() || !profile() || !rec || rec.d !== today()) return;
  submit(board(rec.d), rec.total, rec.log.filter(Boolean).length).catch(console.error);
}

const hitsOf = rec => rec.log.filter(Boolean).length;
const grid = rec => rec.log.map(ok => ok ? '🟩' : '🟥').join('');
const url = () => location.origin + location.pathname;

// Link de duelo: mesma data (mesmas perguntas) e o placar de quem desafia.
function duelLink(rec) {
  const p = profile(), q = new URLSearchParams({ d: rec.d, p: rec.total, g: rec.log.map(Number).join('') });
  if (p && p.name) q.set('n', p.name);
  return `${url()}?${q}`;
}

// Lê um duelo da URL (?d=&p=&g=&n=), valida tudo e limpa a barra de endereço.
export function readChallenge() {
  const q = new URLSearchParams(location.search);
  if (!q.has('d')) return null;
  history.replaceState(null, '', url());
  const d = q.get('d'), p = +q.get('p'), g = q.get('g') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < START || d > today() || !/^[01]{5}$/.test(g) || !(p >= 0 && p <= 3000)) return null;
  const log = [...g].map(c => c === '1');
  return { d, p: Math.round(p), g: log, h: log.filter(Boolean).length, n: (q.get('n') || 'Um analista').replace(/\s+/g, ' ').trim().slice(0, 24) || 'Um analista' };
}

function result(rec, ch, duel, xr) {
  const h = hitsOf(rec), st = store('noc_streak') || { c: 1 };
  const win = ch && (rec.total > ch.p ? 1 : rec.total < ch.p ? -1 : 0);
  modal(`<div class="tag">${duel ? 'DUELO' : 'DESAFIO DIÁRIO'} #${rec.n}</div><h2>${ch ? (win > 0 ? '🏆 Você venceu!' : win < 0 ? 'Não foi dessa vez.' : 'Empate técnico!') : h === N ? 'Plantão perfeito!' : h >= 3 ? 'Rede de pé.' : 'O Z3R0 passou perto.'}</h2>
    ${ch ? `<div class="vsbox"><div><small>VOCÊ</small><span class="dgrid sm">${grid(rec)}</span><b>${fmt(rec.total)} pts</b></div><i>×</i><div><small class="vsn"></small><span class="dgrid sm">${grid({ log: ch.g })}</span><b>${fmt(ch.p)} pts</b></div></div>` : `<div class="dgrid">${grid(rec)}</div>`}
    <div class="pts"><span>Acertos</span><b>${h}/${N}</b></div>
    <div class="pts"><span>Pontos + integridade</span><b>${fmt(rec.score)}</b></div>
    <div class="pts"><span>Bônus de velocidade</span><b>+${fmt(rec.speed)}</b></div>
    <div class="pts" style="color:var(--warn)"><span>TOTAL</span><b style="color:var(--warn)">${fmt(rec.total)} pts</b></div>
    ${duel ? '<div class="dnext">Duelo não conta para o desafio do dia nem para o ranking.</div>' : `<div class="dstreak">🔥 ${st.c} ${st.c > 1 ? 'dias seguidos' : 'dia seguido'}</div>`}
    ${xr ? xpHTML(xr) : ''}
    ${reviewHTML(rec.miss || [])}
    ${rec.d === today() && !duel ? '<div class="dnext">Próximo desafio em <b id="dNext"></b></div>' : ''}
    <button class="btn wideb" id="dDuel">⚔️ ${ch ? 'DEVOLVER O DESAFIO' : 'DESAFIAR UM COLEGA'}</button>
    <button class="btn ghostb wideb" id="dShare">COMPARTILHAR RESULTADO</button>
    <div class="row">${rankOn() && !duel ? '<button class="btn ghostb" id="dRank">RANKING</button>' : ''}<button class="btn ghostb" id="mOk">VOLTAR</button></div>`);
  if (ch) $('mcard').querySelector('.vsn').textContent = ch.n.toUpperCase();
  tick();
  $('dDuel').onclick = e => share(`⚔️ Te desafio no NOC: Última Linha de Defesa!\nDesafio #${rec.n}: ${grid(rec)} ${h}/${N} · ${fmt(rec.total)} pts\nBate isso? ${duelLink(rec)}`, e.currentTarget);
  $('dShare').onclick = e => share(`NOC: Última Linha de Defesa · Desafio #${rec.n}\n${grid(rec)} ${h}/${N} · ${fmt(rec.total)} pts${duel ? '' : ' · 🔥 ' + st.c}\n${url()}`, e.currentTarget);
  if ($('dRank')) $('dRank').onclick = () => openRanking(board(rec.d), 1);
  $('mOk').onclick = () => { if ($('game').classList.contains('on')) goMap(); closeModal(); };
}

// Contagem regressiva até a meia-noite de Brasília.
function tick() {
  const el = $('dNext'); if (!el) return;
  const ms = Date.parse(today() + 'T00:00:00-03:00') + 864e5 - Date.now(), s = Math.max(0, ms / 1000 | 0);
  el.textContent = `${s / 3600 | 0}h ${String((s % 3600) / 60 | 0).padStart(2, '0')}min ${String(s % 60).padStart(2, '0')}s`;
  setTimeout(tick, 1000);
}

// Cartão do desafio no topo do mapa.
function banner() {
  const box = $('dailyBox'); if (!box) return;
  const d = today(), rec = store('noc_daily'), done = rec && rec.d === d;
  box.innerHTML = `<button class="daily${done ? ' done' : ''}" id="dailyBtn"><span class="di">${done ? '✓' : '⚡'}</span>
    <span class="dt"><b>Desafio diário #${dayNum(d)}</b><small>${done ? `Feito hoje: ${hitsOf(rec)}/${N} · ${fmt(rec.total)} pts` : `${N} perguntas · ${TIME} s cada · 1 por dia`}</small></span>
    <span class="dg">${done ? 'VER' : 'JOGAR'}</span></button>`;
  $('dailyBtn').onclick = () => startDaily();
}

export function initDaily() {
  flow.map = banner;
  hooks.joined = sendToday;
}
export const dailyBoard = () => board(today());
