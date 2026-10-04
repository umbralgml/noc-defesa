// Fluxo do jogo: mapa, briefing, intro animada da fase, vitória, derrota e dica.
import { $, fmt, center, buzz, store } from './util.js';
import { au, sfx, music, stopMusic, setMute, isMuted } from './audio.js';
import { AV_ME, AV_Z, AV_CHEFE, HX, LOCNAME, GOTO, sceneSVG, heroTo } from './scene.js';
import { S, LEVELS, ACTS, DIFFS, K, unlocked, save, resetProgress, progress } from './state.js';
import { flow, initScrollHints, show, modal, closeModal, burst, setHP, setScore, stars, hideCoach, lessonHTML, reviewHTML, share } from './ui.js';
import { submitCampaign, profile } from './rank.js';
import { renderWire, resetWire, drawWires } from './wire.js';
import { renderDrop, resetDrop } from './drop.js';
import { renderQuiz } from './quiz.js';
import { renderTerm } from './term.js';
import { renderDefense, resetDefense } from './defense.js';
import { renderTopo, resetTopo } from './topo.js';
import { renderPcap } from './pcap.js';
import { startZ3r0, stopZ3r0 } from './z3r0.js';
import { addXP, xpHTML, rankOf } from './career.js';
import { onLevelWin, unlock } from './ach.js';
import { certModal } from './cert.js';
import { metric } from './rank.js';

const ENGINES = { wire: renderWire, drop: renderDrop, quiz: renderQuiz, term: renderTerm, defense: renderDefense, topo: renderTopo, pcap: renderPcap };

// ---------- map ----------
export function renderMap() {
  let html = '', tot = 0, pts = 0, gold = store('noc_gold') || [], nextI = LEVELS.findIndex((L, i) => unlocked(i) && !S.prog[K(i)]);
  ACTS.forEach((a, ai) => {
    const done = LEVELS.every((L, i) => L.act !== ai || S.prog[K(i)]);
    html += `<div class="acth"><span>${a[0]}</span>${a[2] ? `<i class="diff d-${DIFFS.indexOf(a[2])}">${a[2].toUpperCase()}</i>` : ''}${done ? `<button class="certb" data-a="${ai}">📜 CERTIFICADO</button>` : ''}<b>${a[1]}</b></div><div class="path">`;
    LEVELS.forEach((L, i) => {
      if (L.act !== ai) return;
      const st = S.prog[K(i)] || 0; tot += st; pts += S.best[K(i)] || 0;
      const lock = !unlocked(i), next = i === nextI;
      const cls = ['node', lock ? 'lock' : '', st ? 'done' : '', next ? 'next' : '', L.boss || L.miniboss ? 'boss' : ''].join(' ');
      html += `<button class="${cls}" data-i="${i}"><span class="dot">${lock ? '×' : st ? '✓' : i + 1}</span>
        <span class="info"><span class="tx"><b>${L.title}${next ? '<span class="tag">PRÓXIMO</span>' : L.novo && !st ? '<span class="tag nova">NOVA</span>' : ''}</b><small>${LOCNAME[L.loc]} · ${L.tag}</small></span>
        ${lock ? '' : `<span class="res"><span class="st${gold.includes(L.title) ? ' gold' : ''}">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>${S.best[K(i)] ? `<small>${fmt(S.best[K(i)])} pts</small>` : ''}</span>`}</span></button>`;
    });
    html += '</div>';
  });
  html += '<button class="mapReset" id="mapReset">ZERAR PROGRESSO</button>';
  $('mapList').innerHTML = '<div id="dailyBox"></div><div id="trainBox"></div>' + html;
  flow.map(); flow.room(); flow.train();
  $('mapReset').onclick = () => askReset(renderMap);
  $('starsTot').innerHTML = `★ ${tot}/${LEVELS.length * 3}${gold.length ? ` <i class="gold">★${gold.length}</i>` : ''}<small>${fmt(pts)} PTS</small>`;
  const p = profile(), r = rankOf();
  $('mapWho').textContent = p && p.name ? p.name.toUpperCase() : 'ANALISTA DE PLANTÃO';
  $('mapRank').textContent = `${r.name} · ${fmt(r.v)} XP`;
}

// Confirma antes de apagar. "after" atualiza a tela que chamou.
export function askReset(after) {
  const p = progress();
  modal(`<div class="tag">RECOMEÇAR O PLANTÃO</div><h2>Zerar progresso?</h2>
    <div class="learn">${p.done ? `Você vai perder <b style="display:inline;font:inherit;color:var(--warn)">${p.stars} estrelas</b>, ${fmt(p.pts)} pontos e ${p.done} de ${LEVELS.length} fases concluídas.` : 'Você ainda não concluiu nenhuma fase.'} Só a fase 1 fica liberada. Não dá para desfazer.</div>
    <div class="row"><button class="btn ghostb" id="mNo">CANCELAR</button><button class="btn" id="mYes" style="background:linear-gradient(135deg,#ff4d6d,#d93655);color:#fff">ZERAR</button></div>`);
  $('mNo').onclick = closeModal;
  $('mYes').onclick = () => { resetProgress(); closeModal(); if (after) after(); };
}

// História do ato: aparece uma vez, antes da primeira fase do ato.
const AVS = { z: [AV_Z, 'Z3R0', 'z'], me: [AV_ME, 'VOCÊ', 'me'], chefe: [AV_CHEFE, 'CHEFE DO NOC', 'chefe'] };
function story(L, next) {
  const a = ACTS[L.act], seen = store('noc_story') || [];
  if (!a || !a[3] || seen.includes(a[1]) || LEVELS.findIndex(x => x.act === L.act) !== LEVELS.indexOf(L)) return next();
  modal(`<div class="tag">${a[0]}${a[2] ? ' · ' + a[2].toUpperCase() : ''}</div><h2>${a[1]}</h2>
    ${a[3].map(s => { const [av, who, cls] = AVS[s.who] || AVS.chefe; return `<div class="dlg"><div class="av">${av}</div><div class="bubble ${cls}"><span class="who">${who}</span>${s.t}</div></div>`; }).join('')}
    <div class="row"><button class="btn" id="mStory">BORA</button></div>`);
  $('mStory').onclick = () => { store('noc_story', [...seen, a[1]]); next(); };
}

// Briefing (precedido da história do ato, na primeira vez).
export function brief(i) { story(LEVELS[i], () => showBrief(i)); }

// Diálogo, aula rápida e missão.
function showBrief(i) {
  const L = LEVELS[i];
  modal(`<div class="tag">${ACTS[L.act][0]} · ${LOCNAME[L.loc]}</div><h2>${i + 1}. ${L.title}</h2>
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>${L.z}</div></div>
    <div class="dlg"><div class="av">${AV_ME}</div><div class="bubble me"><span class="who">VOCÊ</span>${L.me}</div></div>
    ${lessonHTML(L)}
    <div class="goal"><b>Missão:</b> ${L.goal}</div>
    ${S.prog[K(i)] === 3 && !L.tutorial ? `<button class="btn ghostb wideb hardb" id="mHard">☠ MODO DIFÍCIL${(store('noc_gold') || []).includes(L.title) ? ' · ★ OURO' : ''}<small>Dano em dobro e o Z3R0 mais agressivo. Vença sem errar para ganhar a estrela de ouro.</small></button>` : ''}
    <div class="row"><button class="btn ghostb" id="mCancel">VOLTAR</button><button class="btn" id="mGo">IR PARA ${GOTO[L.loc]}</button></div>`);
  $('mCancel').onclick = closeModal;
  $('mGo').onclick = () => { closeModal(); startLevel(i); };
  if ($('mHard')) $('mHard').onclick = () => { closeModal(); startLevel(i, true); };
}

// ---------- game core ----------
function cleanup() {
  clearInterval(S.timer); S.timer = null; S.intro.forEach(clearTimeout); S.intro = [];
  resetDrop(); resetWire(); resetDefense(); resetTopo(); stopZ3r0();
  document.querySelectorAll('.ghost').forEach(g => g.remove());
}
function startLevel(i, hard) { play(LEVELS[i], (i + 1) + '. ' + LEVELS[i].title + (hard ? ' ☠' : ''), { hard }); }

// Roda qualquer fase. Fases fora do mapa (S.cur = -1) não salvam estrelas e
// podem trazer L.onWin(res) para tratar o fim do jeito delas.
export function play(L, name, opt = {}) {
  cleanup();
  Object.assign(S, { lv: L, cur: LEVELS.indexOf(L), hp: 100, err: 0, placed: 0, busy: true, pairs: [], score: 0, streak: 0, miss: [], hard: !!opt.hard, t0: Date.now() });
  $('lvName').textContent = name || L.title;
  setHP(); setScore(); hideCoach(); lessonBar(L);
  $('stage').innerHTML = ''; $('bank').style.display = 'none';
  $('stage').classList.add('veil'); $('bank').classList.add('veil');
  show('game');
  const sc = $('scene');
  sc.innerHTML = sceneSVG(L.loc, L.boss || L.miniboss, L.loose) + `<div class="caption"><i></i><span id="capTxt"></span></div><div class="skip">TOQUE PARA PULAR</div>`;
  sc.classList.remove('defeat'); sc.classList.add('big');
  heroTo(sc, 150, true);
  const hero = sc.querySelector('.hero'); hero.classList.add('walk');
  requestAnimationFrame(() => requestAnimationFrame(() => heroTo(sc, HX[L.loc])));
  typeCap(L.cap);
  music(L.boss || L.miniboss ? 'boss' : 'play'); sfx.whoosh();
  for (let k = 0; k < 8; k++) S.intro.push(setTimeout(sfx.step, k * 170));
  for (let k = 0; k < 7; k++) S.intro.push(setTimeout(sfx.key, 1500 + k * 90 + Math.random() * 40));
  if (L.boss || L.miniboss) S.intro.push(setTimeout(sfx.siren, 300), setTimeout(sfx.siren, 1100));
  S.intro.push(setTimeout(() => { hero.classList.remove('walk'); hero.classList.add('type'); }, 1420));
  S.intro.push(setTimeout(finishIntro, 2300));
  sc.onclick = () => { if (S.intro.length) finishIntro(); };
}
// Aula fixa durante a fase: aberta ou fechada conforme a última escolha do jogador.
function lessonBar(L) {
  const bar = $('lbar');
  bar.hidden = !L.lesson;
  if (!L.lesson) return;
  $('lbb').innerHTML = `<ul>${L.lesson.map(x => `<li>${x}</li>`).join('')}</ul>`;
  setLesson(store('noc_lesson') !== false);
}
function setLesson(open) {
  $('lbar').classList.toggle('shut', !open);
  $('lbh').setAttribute('aria-expanded', open);
  $('lbi').textContent = open ? 'ESCONDER ▴' : 'MOSTRAR ▾';
  $('lbb').scrollTop = 0;
}

function typeCap(t) {
  const el = $('capTxt'); let i = 0; el.textContent = '';
  const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); el.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(iv); }, 28);
}
function finishIntro() {
  S.intro.forEach(clearTimeout); S.intro = [];
  const L = S.lv, sc = $('scene'), hero = sc.querySelector('.hero');
  heroTo(sc, HX[L.loc], true); hero.classList.remove('walk'); hero.classList.add('type');
  $('capTxt').textContent = LOCNAME[L.loc] + (L.boss || L.miniboss ? ' · Z3R0 AO VIVO' : '');
  sc.classList.remove('big');
  // Celular: cena baixa durante a jogada; a cena inteira cabe em miniatura à direita.
  if (matchMedia('(max-width:600px),(max-height:760px)').matches) sc.querySelector('svg').setAttribute('preserveAspectRatio', 'xMaxYMax meet');
  S.busy = false;
  ENGINES[L.type](L);
  startZ3r0(L);
  requestAnimationFrame(() => { $('stage').classList.remove('veil'); $('bank').classList.remove('veil'); });
  setTimeout(() => { if ($('wire')) drawWires(); }, 520);
}

function win() {
  cleanup(); S.busy = true;
  const L = S.lv, st = stars(), bonus = S.hp * 5, total = S.score + bonus;
  const hero = $('scene').querySelector('.hero');
  if (L.onWin) {
    sfx.win(); buzz([40, 60, 40]);
    if (hero) { hero.classList.remove('type'); hero.classList.add('idle'); }
    setTimeout(() => L.onWin({ score: S.score, hp: S.hp, bonus, total }), 650);
    return;
  }
  // XP: base + estrelas, com bônus na primeira vez que a fase é concluída.
  const first = !S.prog[K(S.cur)];
  S.prog[K(S.cur)] = Math.max(S.prog[K(S.cur)] || 0, st);
  S.best[K(S.cur)] = Math.max(S.best[K(S.cur)] || 0, total); save();
  submitCampaign();
  // Modo difícil sem erro: estrela de ouro (uma por fase) e XP extra.
  const gold = S.hard && S.err === 0, gl = store('noc_gold') || [], newGold = gold && !gl.includes(L.title);
  if (newGold) { store('noc_gold', [...gl, L.title]); unlock('ouro'); }
  const xr = addXP(20 + st * 15 + (first ? 50 : 0) + (gold ? 40 : 0));
  onLevelWin(L, st); metric('win');
  // O chefe fecha a história; se houver fases depois dele (temporada 2), o botão segue para a próxima.
  const last = !!L.boss, more = S.cur < LEVELS.length - 1;
  let delay = 650;
  if (L.boss || L.miniboss) {
    delay = 3600; stopMusic();
    const sc = $('scene'); sc.classList.add('big', 'defeat'); $('stage').classList.add('veil');
    if (hero) { hero.classList.remove('type'); }
    const cap = $('capTxt'); if (cap) cap.textContent = L.boss ? 'C2 DESCONECTADO · Z3R0 OFFLINE' : 'ATAQUE CONTIDO · Z3R0 RECUOU';
    sfx.zap(); setTimeout(sfx.boom, 250); buzz([100, 50, 200]);
    setTimeout(() => { const c = center(sc); for (let k = 0; k < 5; k++) setTimeout(() => burst(c.x + (k - 2) * 60, c.y - 20, ['#ff2e63', '#ffd166', '#00e0a8', '#4dd2ff', '#ff7ad9'][k], 18), k * 120); }, 700);
    setTimeout(() => { if (hero) hero.classList.add('cheer'); sfx.win(); }, 1300);
    setTimeout(() => music('menu'), 3000);
  } else {
    sfx.win(); buzz([40, 60, 40]);
    if (hero) { hero.classList.remove('type'); hero.classList.add('idle'); }
    const c = center($('scene')); for (let k = 0; k < 3; k++) setTimeout(() => burst(c.x + (k - 1) * 80, c.y, ['#00e0a8', '#ffd166', '#4dd2ff'][k], 16), k * 150);
  }
  setTimeout(() => {
    modal(`<div class="tag">${last ? 'FIM DE TURNO' : 'INCIDENTE CONTIDO'}</div><h2>${last ? 'Z3R0 derrotado!' : L.title}</h2>
      <div class="bigstars${gold ? ' gold' : ''}">${[0, 1, 2].map(k => `<span>${k < st ? '★' : '☆'}</span>`).join('')}</div>
      ${gold ? `<div class="goldm">${newGold ? 'ESTRELA DE OURO CONQUISTADA!' : 'MODO DIFÍCIL SEM ERROS'}</div>` : S.hard ? '<div class="goldm off">Modo difícil vencido. Sem erros, a estrela vira ouro.</div>' : ''}
      <div class="pts"><span>Acertos</span><b>${fmt(S.score)}</b></div>
      <div class="pts"><span>Bônus integridade ${S.hp}%</span><b>+${fmt(bonus)}</b></div>
      <div class="pts" style="color:var(--warn)"><span>TOTAL</span><b style="color:var(--warn)">${fmt(total)} pts</b></div>
      ${xpHTML(xr)}
      <div class="learn"><b>${last ? 'RELATÓRIO FINAL' : 'O QUE VOCÊ DEFENDEU'}</b>${L.learn}</div>
      ${reviewHTML()}
      ${last ? `<div class="dlg"><div class="av">${AV_ME}</div><div class="bubble me"><span class="who">VOCÊ</span>Turno encerrado. Pode ir dormir, Z3R0. Eu fico de olho.</div></div>` : ''}
      ${last ? '<button class="btn ghostb wideb" id="mShare">COMPARTILHAR RESULTADO</button>' : ''}
      <div class="row"><button class="btn ghostb" id="mMap">MAPA</button>${more ? `<button class="btn" id="mNext">${last ? 'TEMPORADA 2' : 'PRÓXIMA'}</button>` : `<button class="btn" id="mAgain">JOGAR DE NOVO</button>`}</div>`);
    $('mMap').onclick = () => { closeModal(); goMap(); };
    if (last) $('mShare').onclick = e => { const p = progress(); share(`Derrotei o Z3R0 no NOC: Última Linha de Defesa 🛡️\n★ ${p.stars}/${p.max} estrelas · ${fmt(p.pts)} pts\nVocê segura a rede? ${location.origin + location.pathname}`, e.currentTarget); };
    if (more) $('mNext').onclick = () => { closeModal(); brief(S.cur + 1); };
    else $('mAgain').onclick = () => { closeModal(); startLevel(S.cur, S.hard); };
  }, delay);
}
function fail(msg) {
  metric('fail'); cleanup(); sfx.lose(); stopMusic(); setTimeout(() => music('menu'), 2500);
  modal(`<div class="tag">FALHA NA DEFESA</div><h2>Rede comprometida</h2>
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>${msg} Hahaha!</div></div>
    <div class="learn"><b>DICA</b>${S.lv.tip}</div>
    ${reviewHTML()}
    <div class="row"><button class="btn ghostb" id="mMap">MAPA</button><button class="btn" id="mRetry">TENTAR DE NOVO</button></div>`);
  $('mMap').onclick = () => { closeModal(); goMap(); };
  $('mRetry').onclick = () => { closeModal(); if (S.cur >= 0) startLevel(S.cur, S.hard); else goMap(); };
}
export function goMap() { cleanup(); renderMap(); show('map'); music('menu'); }

export function initGame() {
  initScrollHints();
  flow.win = win; flow.fail = fail;
  $('mapList').addEventListener('click', e => {
    const c = e.target.closest('.certb'); if (c) { au(); certModal(+c.dataset.a); return; }
    const b = e.target.closest('.node'); if (!b) return;
    const i = +b.dataset.i;
    if (!unlocked(i)) { buzz(30); return; }
    au(); brief(i);
  });
  $('backBtn').onclick = goMap;
  $('lbh').onclick = () => { const open = $('lbar').classList.contains('shut'); store('noc_lesson', open); setLesson(open); };
  // Dica durante a fase: repete a aula e mostra a dica técnica.
  $('tipBtn').onclick = () => {
    const L = S.lv;
    modal(`<div class="tag">DICA TÉCNICA</div><h2>${L.title}</h2><div class="learn">${L.tip}</div>${lessonHTML(L)}<div class="row"><button class="btn ghostb" id="sndG">SOM: ${isMuted() ? 'OFF' : 'ON'}</button><button class="btn" id="mOk">ENTENDI</button></div>`);
    $('mOk').onclick = closeModal;
    $('sndG').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music(S.lv.boss || S.lv.miniboss ? 'boss' : 'play'); };
  };
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal' && $('mcard').querySelector('#mCancel,#mOk,#mNo')) closeModal(); });
}
