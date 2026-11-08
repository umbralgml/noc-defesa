// Fluxo do jogo: mapa, briefing, intro animada da fase, vitória, derrota e dica.
import { $, fmt, center, buzz, store, siteURL } from './util.js';
import { t as tr } from './i18n.js';
import { au, sfx, music, stopMusic, setMute, isMuted } from './audio.js';
import { AV_ME, AV_Z, AV_CHEFE, HX, LOCNAME, GOTO, sceneSVG, heroTo } from './scene.js';
import { S, LEVELS, ACTS, TRAILS, DIFFS, diffOf, K, num, unlocked, save, resetProgress, progress } from './state.js';
import { reportBtn } from './report.js';
import { flow, initScrollHints, linkGloss, show, modal, closeModal, burst, setHP, setScore, stars, hideCoach, lessonHTML, reviewHTML, share } from './ui.js';
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
import { worldMapHTML } from './worldmap.js';
import { cardsHTML, initCards } from './study.js';
import { metric } from './rank.js';
import { cyberConfetti } from './particles.js';
import { speakRadio } from './radio.js';

const ENGINES = { wire: renderWire, drop: renderDrop, quiz: renderQuiz, term: renderTerm, defense: renderDefense, topo: renderTopo, pcap: renderPcap };

// ---------- map ----------
// Trilha aberta no mapa (localStorage noc_trail). Trilha sem fases aparece como "em breve".
const curTrail = () => { const id = store('noc_trail'), t = TRAILS.findIndex(x => x.id === id && x.acts.length); return t < 0 ? 0 : t; };
function trailsHTML(ct) {
  if (TRAILS.length < 2) return '';
  return `<div class="trails" role="tablist" aria-label="Trilhas de treinamento">${TRAILS.map((t, ti) => {
    const lv = LEVELS.filter(L => L.trail === ti), st = lv.reduce((s, L) => s + (S.prog[L.key || L.title] || 0), 0), soon = !lv.length;
    return `<button class="trail${ti === ct ? ' on' : ''}${soon ? ' soon' : ''}" role="tab" aria-selected="${ti === ct}" data-t="${ti}"${soon ? ' aria-disabled="true"' : ''}>
      <span class="ti">${t.icon}</span><b>${t.name}</b><small>${soon ? 'EM BREVE' : `${lv.length} fases · ★ ${st}/${lv.length * 3}`}</small></button>`;
  }).join('')}</div><div class="traild">${TRAILS[ct].desc}</div>`;
}

export function renderMap() {
  const ct = curTrail();
  const viewMode = store('noc_map_view') || 'map';
  let html = '', tot = 0, pts = 0, gold = store('noc_gold') || [], nextI = LEVELS.findIndex((L, i) => L.trail === ct && unlocked(i) && !S.prog[K(i)]);
  LEVELS.forEach((L, i) => { tot += S.prog[K(i)] || 0; pts += S.best[K(i)] || 0; });

  const viewToggleHTML = `
    <div class="trail-view-bar">
      <div class="trail-view-sw">
        <button class="tv-btn${viewMode === 'map' ? ' on' : ''}" data-view="map" type="button"><span>🗺️</span> ${tr('MUNDO RPG 3D')}</button>
        <button class="tv-btn${viewMode === 'list' ? ' on' : ''}" data-view="list" type="button"><span>📋</span> ${tr('LISTA CLÁSSICA')}</button>
      </div>
      ${viewMode === 'map' ? `<button class="tv-jump" id="tvJump" type="button"><span>🎯</span> ${tr('IR AO PLANTÃO')}</button>` : ''}
    </div>
  `;

  if (viewMode === 'map') {
    html = viewToggleHTML + worldMapHTML({ ct, LEVELS, ACTS, S, gold, nextI, DIFFS });
  } else {
    ACTS.forEach((a, ai) => {
      if (a[4] !== ct) return;
      const done = LEVELS.every((L, i) => L.act !== ai || S.prog[K(i)]);
      html += `<div class="acth"><span>${a[0]}</span>${a[5] ? '<i class="diff nivel">NIVELAMENTO</i>' : a[2] ? `<i class="diff d-${DIFFS.indexOf(a[2])}">${tr(a[2].toUpperCase())}</i>` : ''}${done ? `<button class="certb" data-a="${ai}">📜 CERTIFICADO</button>` : ''}<b>${a[1]}</b></div>`
        + (a[5] ? `<div class="nivn">Para quem está começando. ${LEVELS.some(L => L.act > ai && L.trail === ct) ? 'Já trabalha com isso? O próximo ato já está liberado.' : 'O plantão desta trilha chega nos próximos lotes.'}</div>` : '') + '<div class="path">';
      LEVELS.forEach((L, i) => {
        if (L.act !== ai) return;
        const st = S.prog[K(i)] || 0;
        const lock = !unlocked(i), next = i === nextI;
        const cls = ['node', lock ? 'lock' : '', st ? 'done' : '', next ? 'next' : '', L.boss || L.miniboss ? 'boss' : ''].join(' ');
        html += `<button class="${cls}" data-i="${i}"><span class="dot">${lock ? '×' : st ? '✓' : num(i)}</span>
          <span class="info"><span class="tx"><b>${L.title}${next ? '<span class="tag">PRÓXIMO</span>' : L.novo && !st ? '<span class="tag nova">NOVA</span>' : ''}</b><small>${L.tag}</small></span>
          ${lock ? '' : `<span class="res"><span class="st${gold.includes(L.key || L.title) ? ' gold' : ''}">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>${S.best[K(i)] ? `<small>${fmt(S.best[K(i)])} pts</small>` : ''}</span>`}</span></button>`;
      });
      html += '</div>';
    });
    html = viewToggleHTML + html;
  }
  html += '<button class="mapReset" id="mapReset">ZERAR PROGRESSO</button>';
  // Trilhas no topo; desafio, arcade, treino, academia e sala de estudo num bloco compacto logo abaixo.
  $('mapList').innerHTML = trailsHTML(ct) + '<div class="hub"><div id="dailyBox"></div><div id="arcadeBox"></div><div id="trainBox"></div><div id="acadBox"></div><div id="studyBox"></div></div>' + html;
  flow.map(); flow.room(); flow.train(); flow.acad(); flow.study(); if (flow.arcade) flow.arcade();
  $('mapReset').onclick = () => askReset(renderMap);
  $('starsTot').innerHTML = `★ ${tot}/${LEVELS.length * 3}${gold.length ? ` <i class="gold">★${gold.length}</i>` : ''}<small>${fmt(pts)} PTS</small>`;
  const st = store('noc_streak') || { c: 1 };
  const strkEl = $('mapStreak');
  if (strkEl) {
    strkEl.textContent = `🔥 ${st.c}d`;
    strkEl.onclick = () => { au(); $('dailyT')?.click(); };
  }
  const p = profile(), r = rankOf();
  $('mapWho').textContent = p && p.name ? p.name.toUpperCase() : 'ANALISTA DE PLANTÃO';
  $('mapRank').textContent = `${r.name} · ${fmt(r.v)} XP`;

  if (viewMode === 'map') {
    requestAnimationFrame(() => {
      const nextEl = $('mapList').querySelector('.node.next');
      if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

// Confirma antes de apagar. Permite escolher entre a trilha atual ou tudo. "after" atualiza a tela que chamou.
export function askReset(after) {
  const ct = curTrail();
  const trail = TRAILS[ct];
  const trailLevels = LEVELS.filter(L => L.trail === ct);
  let trailStars = 0, trailPts = 0, trailDone = 0;
  trailLevels.forEach(L => {
    const k = L.key || L.title;
    const st = S.prog[k] || 0;
    trailStars += st;
    trailPts += S.best[k] || 0;
    if (st) trailDone++;
  });
  const p = progress();

  modal(`
    <div class="reset-modal">
      <div class="tag">${tr('GERENCIAR PROGRESSO')}</div>
      <h2>${tr('Zerar Progresso')}</h2>
      
      <p class="learn">${tr('Escolha se deseja resetar apenas a trilha em que você está jogando ou limpar completamente todo o histórico do jogo.')}</p>

      <div class="reset-choices">
        <div class="reset-card">
          <div class="reset-card-head">
            <span>📍 ${tr('ESTA TRILHA')}: <b>${trail ? trail.name : ''}</b></span>
            <span class="rch-tag">★ ${trailStars} · ${trailDone}/${trailLevels.length}</span>
          </div>
          <p>${tr('Zera apenas as fases e estrelas desta trilha. As demais trilhas continuam intactas.')}</p>
          <button class="btn reset-btn-trail" id="mResetTrail" type="button">
            🗑️ ${tr('ZERAR APENAS')} ${trail ? trail.name.toUpperCase() : ''}
          </button>
        </div>

        <div class="reset-card">
          <div class="reset-card-head">
            <span>⚠️ ${tr('TODAS AS TRILHAS')}</span>
            <span class="rch-tag">★ ${p.stars}/${p.max} · ${p.done} ${tr('fases')}</span>
          </div>
          <p>${tr('Limpa absolutamente todo o progresso de todas as trilhas. Não dá para desfazer.')}</p>
          <button class="btn reset-btn-all" id="mResetAll" type="button">
            💥 ${tr('ZERAR TUDO (TODAS AS TRILHAS)')}
          </button>
        </div>
      </div>

      <div class="row">
        <button class="btn ghostb" id="mNo">${tr('CANCELAR')}</button>
      </div>
    </div>
  `);

  $('mNo').onclick = closeModal;
  $('mResetTrail').onclick = () => {
    resetProgress(ct);
    closeModal();
    if (after) after();
  };
  $('mResetAll').onclick = () => {
    resetProgress();
    closeModal();
    if (after) after();
  };
}

// História do ato: aparece uma vez, antes da primeira fase do ato.
const AVS = { z: [AV_Z, 'Z3R0', 'z'], me: [AV_ME, 'VOCÊ', 'me'], chefe: [AV_CHEFE, 'CHEFE DO NOC', 'chefe'] };
function story(L, next) {
  const a = ACTS[L.act], seen = store('noc_story') || [];
  if (!a || !a[3] || seen.includes(a[1]) || LEVELS.findIndex(x => x.act === L.act) !== LEVELS.indexOf(L)) return next();
  modal(`<div class="tag">${a[0]}${a[2] ? ' · ' + tr(a[2].toUpperCase()) : ''}</div><h2>${a[1]}</h2>
    ${a[3].map(s => { const [av, who, cls] = AVS[s.who] || AVS.chefe; return `<div class="dlg"><div class="av">${av}</div><div class="bubble ${cls}"><span class="who">${who}</span>${s.t}</div></div>`; }).join('')}
    <div class="row"><button class="btn" id="mStory">BORA</button></div>`);
  $('mStory').onclick = () => { store('noc_story', [...seen, a[1]]); next(); };
}

// Briefing (precedido da história do ato, na primeira vez).
export function brief(i) { story(LEVELS[i], () => showBrief(i)); }

// Diálogo, aula rápida e missão.
function showBrief(i) {
  const L = LEVELS[i];
  modal(`<div class="tag">${ACTS[L.act][0]} · ${tr(LOCNAME[L.loc])}</div><h2>${num(i)}. ${L.title}</h2>
    ${L.tr === false ? '<div class="trnote">Esta fase ainda não foi traduzida e aparece em português. Os comandos e as saídas são os mesmos.</div>' : ''}
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>${L.z}</div></div>
    <div class="dlg"><div class="av">${AV_ME}</div><div class="bubble me"><span class="who">VOCÊ</span>${L.me}</div></div>
    ${cardsHTML(L)}
    <div class="goal"><b>Missão:</b> ${L.goal}</div>
    ${diffOf(L) <= 1 && !L.tutorial ? '<button class="btn ghostb wideb pracb" id="mPrac">🛟 TREINO SEM PRESSÃO<small>Errar não tira integridade e a dica fica à mão. Não vale estrela: é para aprender antes de jogar valendo.</small></button>' : ''}
    ${S.prog[K(i)] === 3 && !L.tutorial ? `<button class="btn ghostb wideb hardb" id="mHard">☠ MODO DIFÍCIL${(store('noc_gold') || []).includes(L.key || L.title) ? ' · ★ OURO' : ''}<small>Dano em dobro e o Z3R0 mais agressivo. Vença sem errar para ganhar a estrela de ouro.</small></button>` : ''}
    <div class="row"><button class="btn ghostb" id="mCancel">VOLTAR</button><button class="btn" id="mGo">IR PARA ${GOTO[L.loc]}</button></div>`);
  $('mCancel').onclick = closeModal;
  $('mGo').onclick = () => { closeModal(); startLevel(i); };
  if ($('mHard')) $('mHard').onclick = () => { closeModal(); startLevel(i, true); };
  if ($('mPrac')) $('mPrac').onclick = () => { closeModal(); startLevel(i, false, true); };
  initCards(L);
}

// ---------- game core ----------
function cleanup() {
  clearInterval(S.timer); S.timer = null; S.intro.forEach(clearTimeout); S.intro = [];
  resetDrop(); resetWire(); resetDefense(); resetTopo(); stopZ3r0();
  const st = $('stage'); if (st) st.classList.remove('overdrive');
  document.querySelectorAll('.ghost').forEach(g => g.remove());
}
function startLevel(i, hard, practice) { play(LEVELS[i], num(i) + '. ' + LEVELS[i].title + (hard ? ' ☠' : practice ? ' 🛟' : ''), { hard, practice }); }

// Roda qualquer fase. Fases fora do mapa (S.cur = -1) não salvam estrelas e
// podem trazer L.onWin(res) para tratar o fim do jeito delas.
export function play(L, name, opt = {}) {
  cleanup();
  Object.assign(S, { lv: L, cur: LEVELS.indexOf(L), hp: 100, err: 0, placed: 0, busy: true, pairs: [], score: 0, streak: 0, miss: [], hard: !!opt.hard, practice: !!opt.practice, t0: Date.now() });
  $('lvName').textContent = name || L.title;
  setHP(); setScore(); hideCoach(); lessonBar(L);
  $('stage').innerHTML = ''; $('bank').style.display = 'none';
  $('stage').classList.add('veil'); $('bank').classList.add('veil');
  show('game');
  const sc = $('scene');
  sc.innerHTML = sceneSVG(L.loc, L.boss || L.miniboss, L.loose) + `<div class="caption"><i></i><span id="capTxt" data-notr></span></div><div class="skip">TOQUE PARA PULAR</div>`;
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
  $('lbb').innerHTML = `<ul>${L.lesson.map(x => `<li>${x}</li>`).join('')}</ul>`; linkGloss($('lbb'));
  setLesson(store('noc_lesson') !== false);
}
function setLesson(open) {
  $('lbar').classList.toggle('shut', !open);
  $('lbh').setAttribute('aria-expanded', open);
  $('lbi').textContent = open ? 'ESCONDER ▴' : 'MOSTRAR ▾';
  $('lbb').scrollTop = 0;
}

function typeCap(t) {
  t = tr(t);   // texto de tela vindo dos motores (ex.: Academia); o da fase já chega traduzido
  const el = $('capTxt'); let i = 0; el.textContent = '';
  const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); el.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(iv); }, 28);
}
function finishIntro() {
  S.intro.forEach(clearTimeout); S.intro = [];
  const L = S.lv, sc = $('scene'), hero = sc.querySelector('.hero');
  heroTo(sc, HX[L.loc], true); hero.classList.remove('walk'); hero.classList.add('type');
  $('capTxt').textContent = tr(LOCNAME[L.loc] + (L.boss || L.miniboss ? ' · Z3R0 AO VIVO' : ''));
  sc.classList.remove('big');
  // Celular: cena baixa durante a jogada; a cena inteira cabe em miniatura à direita.
  if (matchMedia('(max-width:600px),(max-height:760px)').matches) sc.querySelector('svg').setAttribute('preserveAspectRatio', 'xMaxYMax meet');
  S.busy = false;
  if (L.boss || L.miniboss) speakRadio('Alerta crítico: Invasão do Z3R0 na rede.');
  else if (L.type === 'defense') speakRadio('Alerta de tráfego: configure o firewall.');
  else if (Math.random() < 0.4) speakRadio('Bora pra cima! Turno ativo!');
  ENGINES[L.type](L);
  linkGloss($('stage').querySelector('.task'));
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
  // Treino sem pressão: não salva estrela nem pontos; convida a jogar valendo.
  if (S.practice) {
    sfx.win(); if (hero) { hero.classList.remove('type'); hero.classList.add('idle'); }
    const xr = addXP(10);
    setTimeout(() => {
      modal(`<div class="tag">TREINO CONCLUÍDO</div><h2>${L.title}</h2>
        <div class="pts"><span>Erros no treino</span><b>${S.err}</b></div>
        ${xpHTML(xr)}
        <div class="learn"><b>O QUE VOCÊ PRATICOU</b>${L.learn}</div>
        ${reviewHTML()}
        <div class="learn"><b>E AGORA?</b>${S.err ? 'Releia a revisão acima e jogue valendo: as estrelas só contam no jogo normal.' : 'Treino sem erros! Hora de jogar valendo e garantir as 3 estrelas.'}</div>
        <div class="row"><button class="btn ghostb" id="mMap">MAPA</button><button class="btn" id="mReal">JOGAR VALENDO</button></div>`); addReport();
      $('mMap').onclick = () => { closeModal(); goMap(); };
      $('mReal').onclick = () => { closeModal(); startLevel(S.cur); };
    }, 650);
    return;
  }
  // XP: base + estrelas, com bônus na primeira vez que a fase é concluída.
  const first = !S.prog[K(S.cur)];
  S.prog[K(S.cur)] = Math.max(S.prog[K(S.cur)] || 0, st);
  S.best[K(S.cur)] = Math.max(S.best[K(S.cur)] || 0, total); save();
  store('noc_walk_from', S.cur);
  submitCampaign();
  // Modo difícil sem erro: estrela de ouro (uma por fase) e XP extra.
  const gold = S.hard && S.err === 0, gl = store('noc_gold') || [], newGold = gold && !gl.includes(L.key || L.title);
  if (newGold) { store('noc_gold', [...gl, L.key || L.title]); unlock('ouro'); }
  const xr = addXP(20 + st * 15 + (first ? 50 : 0) + (gold ? 40 : 0));
  onLevelWin(L, st); metric('win');
  // O chefe fecha a história; se houver fases depois dele (temporada 2), o botão segue para a próxima.
  const last = !!L.boss, more = S.cur < LEVELS.length - 1 && LEVELS[S.cur + 1].trail === L.trail;   // a seguinte, só dentro da mesma trilha
  const nextL = more ? LEVELS[S.cur + 1] : null;
  const isActEnd = !!(nextL && nextL.act !== L.act && nextL.trail === L.trail);
  let delay = 650;
  if (L.boss || L.miniboss) {
    delay = 3600; stopMusic();
    const sc = $('scene'); sc.classList.add('big', 'defeat'); $('stage').classList.add('veil');
    if (hero) { hero.classList.remove('type'); }
    const cap = $('capTxt'); if (cap) cap.textContent = L.boss ? 'C2 DESCONECTADO · Z3R0 OFFLINE' : 'ATAQUE CONTIDO · Z3R0 RECUOU';
    sfx.zap(); setTimeout(sfx.boom, 250); buzz([100, 50, 200]);
    cyberConfetti({ count: 70 });
    speakRadio(L.boss ? 'Demais! Z3R0 neutralizado! Bom trabalho analista, siga em frente!' : 'Ataque contido! Bom trabalho analista, siga em frente!', { force: true });
    setTimeout(() => { const c = center(sc); for (let k = 0; k < 5; k++) setTimeout(() => burst(c.x + (k - 2) * 60, c.y - 20, ['#ff2e63', '#ffd166', '#00e0a8', '#4dd2ff', '#ff7ad9'][k], 18), k * 120); }, 700);
    setTimeout(() => { if (hero) hero.classList.add('cheer'); sfx.win(); }, 1300);
    setTimeout(() => music('menu'), 3000);
  } else {
    sfx.win(); buzz([40, 60, 40]);
    cyberConfetti({ count: 45 });
    speakRadio('Bom trabalho analista, siga em frente!', { force: true });
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
      <div class="phase-transit-strip">
        <div class="pts-node done">
          <span class="pts-icon">✓</span>
          <span class="pts-txt">${num(S.cur)}. ${L.title}</span>
        </div>
        <div class="pts-line"><div class="pts-dot"></div></div>
        <div class="pts-node next">
          <span class="pts-icon">${more ? '➔' : '★'}</span>
          <span class="pts-txt">${more ? `${num(S.cur + 1)}. ${nextL.title}` : tr('SETOR 100% LIMPO')}</span>
        </div>
      </div>
      ${last ? `<div class="dlg"><div class="av">${AV_ME}</div><div class="bubble me"><span class="who">VOCÊ</span>Turno encerrado. Pode ir dormir, Z3R0. Eu fico de olho.</div></div>` : ''}
      ${last ? '<button class="btn ghostb wideb" id="mShare">COMPARTILHAR RESULTADO</button>' : ''}
      <div class="row"><button class="btn ghostb" id="mMap">MAPA</button>${more ? `<button class="btn" id="mNext">${last ? 'TEMPORADA 2' : 'PRÓXIMA'}</button>` : `<button class="btn" id="mAgain">JOGAR DE NOVO</button>`}</div>`); addReport();
    $('mMap').onclick = () => { closeModal(); goMap(); };
    if (last) $('mShare').onclick = e => { const p = progress(); share(`${tr('Derrotei o Z3R0 no NOC: Última Linha de Defesa 🛡️')}\n★ ${p.stars}/${p.max} ${tr('estrelas')} · ${fmt(p.pts)} pts\n${tr('Você segura a rede?')} ${siteURL()}`, e.currentTarget); };
    if (more) $('mNext').onclick = () => {
      closeModal();
      if (isActEnd) {
        showActTransition(L.act, nextL.act, () => brief(S.cur + 1));
      } else {
        brief(S.cur + 1);
      }
    };
    else $('mAgain').onclick = () => { closeModal(); startLevel(S.cur, S.hard); };
  }, delay);
}
// Botão de reportar erro no fim da fase, acima dos botões do modal.
function addReport() {
  const rows = $('mcard').querySelectorAll('.row'), r = rows[rows.length - 1]; if (!r) return;
  const b = reportBtn({ item: 'Fase inteira (aula, enunciado ou jogadas)' }, '⚑ REPORTAR ERRO NESTA FASE'); b.classList.add('repend');
  r.before(b);
}

export function showActTransition(prevActIdx, nextActIdx, onDone) {
  const fromAct = ACTS[prevActIdx] || ['ATO ?', 'Setor Atual'];
  const toAct = ACTS[nextActIdx] || ['ATO ?', 'Próximo Setor'];
  sfx.win();
  try { sfx.whoosh(); } catch (e) {}
  cyberConfetti({ count: 60 });
  modal(`
    <div class="act-warp-modal">
      <div class="tag">⚡ ${tr('TRANSIÇÃO DE ATO · SALTO DE SETOR')}</div>
      <h2>${tr('Setor 100% Defendido!')}</h2>
      
      <div class="aw-vis">
        <div class="aw-side">
          <span class="aw-act">${fromAct[0]}</span>
          <b>${fromAct[1]}</b>
          <span class="aw-status done">✓ ${tr('CONCLUÍDO')}</span>
        </div>
        <div class="aw-pipe">
          <div class="aw-pipe-packet">📦</div>
        </div>
        <div class="aw-side">
          <span class="aw-act">${toAct[0]}</span>
          <b>${toAct[1]}</b>
          <span class="aw-status unlock">🔓 ${tr('DESBLOQUEADO')}</span>
        </div>
      </div>

      <div class="learn">
        <b>${tr('ENLACE METROPOLITANO ESTABELECIDO')}</b>
        ${tr('Todos os incidentes deste setor foram neutralizados. A topologia foi expandida e novos sistemas estão sob monitoramento ativo.')}
      </div>

      <div class="row">
        <button class="btn ghostb" id="warpMap">${tr('VER NO MAPA 3D')}</button>
        <button class="btn" id="warpNext">${tr('ENTRAR NO PRÓXIMO ATO')} ➔</button>
      </div>
    </div>
  `);
  $('warpMap').onclick = () => { closeModal(); goMap(); };
  $('warpNext').onclick = () => { closeModal(); if (onDone) onDone(); };
}

function fail(msg) {
  metric('fail'); cleanup(); sfx.lose(); stopMusic(); setTimeout(() => music('menu'), 2500);
  modal(`<div class="tag">FALHA NA DEFESA</div><h2>Rede comprometida</h2>
    <div class="dlg"><div class="av">${AV_Z}</div><div class="bubble z"><span class="who">Z3R0</span>${msg} Hahaha!</div></div>
    <div class="learn"><b>DICA</b>${S.lv.tip}</div>
    ${reviewHTML()}
    <div class="row"><button class="btn ghostb" id="mMap">MAPA</button><button class="btn" id="mRetry">TENTAR DE NOVO</button></div>`); addReport();
  $('mMap').onclick = () => { closeModal(); goMap(); };
  $('mRetry').onclick = () => { closeModal(); if (S.cur >= 0) startLevel(S.cur, S.hard); else goMap(); };
}
export function goMap() { cleanup(); renderMap(); show('map'); music('menu'); }

export function initGame() {
  initScrollHints();
  flow.win = win; flow.fail = fail;
  $('mapList').addEventListener('click', e => {
    const gw = e.target.closest('.rpg-act-gateway');
    if (gw && gw.dataset.nextAct) {
      au();
      const targetRealm = $('mapList').querySelector(`.rpg-realm[data-act="${gw.dataset.nextAct}"]`);
      if (targetRealm) targetRealm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const vb = e.target.closest('.tv-btn');
    if (vb && vb.dataset.view) {
      au();
      store('noc_map_view', vb.dataset.view);
      renderMap();
      return;
    }
    const j = e.target.closest('#tvJump');
    if (j) {
      au();
      const target = $('mapList').querySelector('.node.next');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const c = e.target.closest('.certb'); if (c) { au(); certModal(+c.dataset.a); return; }
    const t = e.target.closest('.trail');
    if (t) { if (t.classList.contains('soon')) { buzz(30); return; } au(); store('noc_trail', TRAILS[+t.dataset.t].id); renderMap(); return; }
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
