// Fluxo do jogo: mapa, briefing, intro animada da fase, vitória, derrota e dica.
import { $, fmt, center, buzz, store } from './util.js';
import { au, sfx, music, stopMusic, setMute, isMuted } from './audio.js';
import { AV_ME, AV_Z, HX, LOCNAME, GOTO, sceneSVG, heroTo } from './scene.js';
import { S, LEVELS, ACTS, K, unlocked, save, resetProgress, progress } from './state.js';
import { flow, show, modal, closeModal, burst, setHP, setScore, stars, hideCoach, lessonHTML, reviewHTML, share } from './ui.js';
import { submitCampaign } from './rank.js';
import { renderWire, resetWire, drawWires } from './wire.js';
import { renderDrop, resetDrop } from './drop.js';
import { renderQuiz } from './quiz.js';

const ENGINES = { wire: renderWire, drop: renderDrop, quiz: renderQuiz };

// ---------- map ----------
export function renderMap() {
  let html = '', tot = 0, pts = 0, nextI = LEVELS.findIndex((L, i) => unlocked(i) && !S.prog[K(i)]);
  ACTS.forEach((a, ai) => {
    html += `<div class="acth"><span>${a[0]}</span><b>${a[1]}</b></div><div class="path">`;
    LEVELS.forEach((L, i) => {
      if (L.act !== ai) return;
      const st = S.prog[K(i)] || 0; tot += st; pts += S.best[K(i)] || 0;
      const lock = !unlocked(i), next = i === nextI;
      const cls = ['node', lock ? 'lock' : '', st ? 'done' : '', next ? 'next' : '', L.boss ? 'boss' : ''].join(' ');
      html += `<button class="${cls}" data-i="${i}"><span class="dot">${lock ? '×' : st ? '✓' : i + 1}</span>
        <span class="info"><span class="tx"><b>${L.title}${next ? '<span class="tag">PRÓXIMO</span>' : ''}</b><small>${LOCNAME[L.loc]} · ${L.tag}</small></span>
        ${lock ? '' : `<span class="res"><span class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>${S.best[K(i)] ? `<small>${fmt(S.best[K(i)])} pts</small>` : ''}</span>`}</span></button>`;
    });
    html += '</div>';
  });
  html += '<button class="mapReset" id="mapReset">ZERAR PROGRESSO</button>';
  $('mapList').innerHTML = '<div id="dailyBox"></div>' + html;
  flow.map();
  $('mapReset').onclick = () => askReset(renderMap);
  $('starsTot').innerHTML = `★ ${tot}/${LEVELS.length * 3}<small>${fmt(pts)} PTS</small>`;
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

// Briefing: diálogo, aula rápida e missão.
function brief(i) {
  const L = LEVELS[i];
  modal(`<div class="tag">${ACTS[L.act][0]} · ${LOCNAME[L.loc]}</div><h2>${i + 1}. ${L.title}</h2>
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>${L.z}</div></div>
    <div class="dlg"><div class="av">${AV_ME}</div><div class="bubble me"><span class="who">VOCÊ</span>${L.me}</div></div>
    ${lessonHTML(L)}
    <div class="goal"><b>Missão:</b> ${L.goal}</div>
    <div class="row"><button class="btn ghostb" id="mCancel">VOLTAR</button><button class="btn" id="mGo">IR PARA ${GOTO[L.loc]}</button></div>`);
  $('mCancel').onclick = closeModal;
  $('mGo').onclick = () => { closeModal(); startLevel(i); };
}

// ---------- game core ----------
function cleanup() {
  clearInterval(S.timer); S.timer = null; S.intro.forEach(clearTimeout); S.intro = [];
  resetDrop(); resetWire();
  document.querySelectorAll('.ghost').forEach(g => g.remove());
}
function startLevel(i) { play(LEVELS[i], (i + 1) + '. ' + LEVELS[i].title); }

// Roda qualquer fase. Fases fora do mapa (S.cur = -1) não salvam estrelas e
// podem trazer L.onWin(res) para tratar o fim do jeito delas.
export function play(L, name) {
  cleanup();
  Object.assign(S, { lv: L, cur: LEVELS.indexOf(L), hp: 100, err: 0, placed: 0, busy: true, pairs: [], score: 0, streak: 0, miss: [] });
  $('lvName').textContent = name || L.title;
  setHP(); setScore(); hideCoach(); lessonBar(L);
  $('stage').innerHTML = ''; $('bank').style.display = 'none';
  $('stage').classList.add('veil'); $('bank').classList.add('veil');
  show('game');
  const sc = $('scene');
  sc.innerHTML = sceneSVG(L.loc, L.boss, L.loose) + `<div class="caption"><i></i><span id="capTxt"></span></div><div class="skip">TOQUE PARA PULAR</div>`;
  sc.classList.remove('defeat'); sc.classList.add('big');
  heroTo(sc, 150, true);
  const hero = sc.querySelector('.hero'); hero.classList.add('walk');
  requestAnimationFrame(() => requestAnimationFrame(() => heroTo(sc, HX[L.loc])));
  typeCap(L.cap);
  music(L.boss ? 'boss' : 'play'); sfx.whoosh();
  for (let k = 0; k < 8; k++) S.intro.push(setTimeout(sfx.step, k * 170));
  for (let k = 0; k < 7; k++) S.intro.push(setTimeout(sfx.key, 1500 + k * 90 + Math.random() * 40));
  if (L.boss) S.intro.push(setTimeout(sfx.siren, 300), setTimeout(sfx.siren, 1100));
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
  $('capTxt').textContent = LOCNAME[L.loc] + (L.boss ? ' · Z3R0 AO VIVO' : '');
  sc.classList.remove('big');
  S.busy = false;
  ENGINES[L.type](L);
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
  S.prog[K(S.cur)] = Math.max(S.prog[K(S.cur)] || 0, st);
  S.best[K(S.cur)] = Math.max(S.best[K(S.cur)] || 0, total); save();
  submitCampaign();
  const last = S.cur === LEVELS.length - 1;
  let delay = 650;
  if (L.boss) {
    delay = 3600; stopMusic();
    const sc = $('scene'); sc.classList.add('big', 'defeat'); $('stage').classList.add('veil');
    if (hero) { hero.classList.remove('type'); }
    const cap = $('capTxt'); if (cap) cap.textContent = 'C2 DESCONECTADO · Z3R0 OFFLINE';
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
      <div class="bigstars">${[0, 1, 2].map(k => `<span>${k < st ? '★' : '☆'}</span>`).join('')}</div>
      <div class="pts"><span>Acertos</span><b>${fmt(S.score)}</b></div>
      <div class="pts"><span>Bônus integridade ${S.hp}%</span><b>+${fmt(bonus)}</b></div>
      <div class="pts" style="color:var(--warn)"><span>TOTAL</span><b style="color:var(--warn)">${fmt(total)} pts</b></div>
      <div class="learn"><b>${last ? 'RELATÓRIO FINAL' : 'O QUE VOCÊ DEFENDEU'}</b>${L.learn}</div>
      ${reviewHTML()}
      ${last ? `<div class="dlg"><div class="av">${AV_ME}</div><div class="bubble me"><span class="who">VOCÊ</span>Turno encerrado. Pode ir dormir, Z3R0. Eu fico de olho.</div></div>` : ''}
      ${last ? '<button class="btn ghostb wideb" id="mShare">COMPARTILHAR RESULTADO</button>' : ''}
      <div class="row"><button class="btn ghostb" id="mMap">MAPA</button>${last ? `<button class="btn" id="mAgain">JOGAR DE NOVO</button>` : `<button class="btn" id="mNext">PRÓXIMA</button>`}</div>`);
    $('mMap').onclick = () => { closeModal(); goMap(); };
    if (last) $('mShare').onclick = e => { const p = progress(); share(`Derrotei o Z3R0 no NOC: Última Linha de Defesa 🛡️\n★ ${p.stars}/${p.max} estrelas · ${fmt(p.pts)} pts\nVocê segura a rede? ${location.origin + location.pathname}`, e.currentTarget); };
    if (last) $('mAgain').onclick = () => { closeModal(); startLevel(S.cur); };
    else $('mNext').onclick = () => { closeModal(); brief(S.cur + 1); };
  }, delay);
}
function fail(msg) {
  cleanup(); sfx.lose(); stopMusic(); setTimeout(() => music('menu'), 2500);
  modal(`<div class="tag">FALHA NA DEFESA</div><h2>Rede comprometida</h2>
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>${msg} Hahaha!</div></div>
    <div class="learn"><b>DICA</b>${S.lv.tip}</div>
    ${reviewHTML()}
    <div class="row"><button class="btn ghostb" id="mMap">MAPA</button><button class="btn" id="mRetry">TENTAR DE NOVO</button></div>`);
  $('mMap').onclick = () => { closeModal(); goMap(); };
  $('mRetry').onclick = () => { closeModal(); if (S.cur >= 0) startLevel(S.cur); else goMap(); };
}
export function goMap() { cleanup(); renderMap(); show('map'); music('menu'); }

export function initGame() {
  flow.win = win; flow.fail = fail;
  $('mapList').addEventListener('click', e => {
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
    $('sndG').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music(S.lv.boss ? 'boss' : 'play'); };
  };
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal' && $('mcard').querySelector('#mCancel,#mOk,#mNo')) closeModal(); });
}
