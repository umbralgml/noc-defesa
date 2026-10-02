// Ponto de entrada: monta a tela de título, carrega as fases e liga os botões.
import { $, fmt } from './engine/util.js';
import { au, music, setMute, isMuted, MUS } from './engine/audio.js';
import { AV_ME, HX, sceneSVG, heroTo } from './engine/scene.js';
import { loadLevels } from './engine/levels.js';
import { show, modal, closeModal } from './engine/ui.js';
import { initGame, renderMap, askReset } from './engine/game.js';
import { progress } from './engine/state.js';
import { loadNews, markNewsSeen } from './engine/news.js';
import { initDaily, startDaily, dailyBoard, readChallenge } from './engine/daily.js';
import { loadRankConfig, openRanking, ensureProfile, profileForm, profile, anonName, titleRanking, hooks } from './engine/rank.js';
import { initPWA } from './engine/pwa.js';
import { initRoom } from './engine/room.js';
import { initZ3r0 } from './engine/z3r0.js';
import { initTrain } from './engine/train.js';
import { rankOf, RANKS } from './engine/career.js';
import { achHTML, achCount, ACH } from './engine/ach.js';
import { initDrop } from './engine/drop.js';
import { initWire } from './engine/wire.js';

$('mA').innerHTML = AV_ME;
$('tScene').innerHTML = sceneSVG('war', true) + `<div class="caption"><i></i>03:12 · ALERTA CRÍTICO NO NOC</div>`;
heroTo($('tScene'), HX.war, true); $('tScene').querySelector('.hero').classList.add('type');

$('sndT').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music(MUS.cur || 'menu'); };
$('sndM').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music('menu'); };
setMute(isMuted());
$('resetBtn').onclick = () => askReset(showProgress);

// Resumo na tela inicial, só para quem já concluiu alguma fase.
function showProgress() {
  const p = progress(), el = $('tProg');
  el.classList.toggle('on', p.done > 0);
  el.innerHTML = p.done ? `Seu plantão: <b>★ ${p.stars}/${p.max}</b> · ${p.done}/${p.max / 3} fases` : '';
}

initGame(); initDrop(); initWire(); initDaily(); initPWA(); initRoom(); initZ3r0(); initTrain();
loadRankConfig().then(on => { $('rkBox').hidden = !on; if (on) titleRanking(dailyBoard()); });
// Cargo e XP na tela inicial.
function showRank() {
  const r = rankOf();
  $('tRank').innerHTML = `<b>${r.name}</b> · ${fmt(r.v)} XP · 🏅 ${achCount()}/${ACH.length}<i class="xpbar"><i style="width:${r.pct}%"></i></i>${r.next ? `<small>Próximo cargo: ${r.nextName} em ${fmt(r.next - r.v)} XP</small>` : '<small>Cargo máximo!</small>'}`;
}
// Vitrine de conquistas e plano de carreira.
$('achBtn').onclick = () => {
  const r = rankOf();
  modal(`<div class="tag">CARREIRA E CONQUISTAS</div><h2>${r.name}</h2>
    <div class="trank">${fmt(r.v)} XP<i class="xpbar"><i style="width:${r.pct}%"></i></i></div>
    <div class="careers">${RANKS.map(([v, n], i) => `<span class="${i <= r.i ? 'on' : ''}">${n}<small>${fmt(v)} XP</small></span>`).join('')}</div>
    <div class="learn"><b>COMO GANHAR XP</b>Fase vencida: 20 + 15 por estrela (+50 na primeira vez). Desafio diário: 30 + 10 por acerto. Treino: 5 + 10 por acerto. Cada conquista: +50.</div>
    ${achHTML()}
    <div class="row"><button class="btn" id="mOk">FECHAR</button></div>`);
  $('mOk').onclick = closeModal;
};
// "Jogando como ..." na tela inicial; atualiza quando o perfil muda.
function showWho() {
  const p = profile(); $('tWho').hidden = !p;
  if (p) $('tWhoName').textContent = p.name || anonName();
}
hooks.profile = () => { showWho(); titleRanking(dailyBoard()); };
showWho();
$('tWhoEdit').onclick = () => profileForm();
// Mapa → tela inicial, com resumo e ranking atualizados.
$('homeBtn').onclick = () => { showProgress(); showWho(); showRank(); titleRanking(dailyBoard()); show('title'); };
document.querySelectorAll('.rankBtn').forEach(b => b.onclick = () => { au(); openRanking(dailyBoard()); });
loadNews().catch(e => { console.error(e); $('news').hidden = true; $('newsBtn').hidden = true; });

const go = $('goMap'), daily = $('dailyT');
go.disabled = daily.disabled = true;
try {
  await loadLevels();
  go.disabled = daily.disabled = false;
  daily.onclick = () => { au(); markNewsSeen(); ensureProfile(() => startDaily()); };
  // Link de duelo (?d=...): abre o desafio do colega direto.
  const ch = readChallenge(); if (ch) ensureProfile(() => startDaily(ch));
  showProgress(); showRank();
  go.onclick = () => { au(); markNewsSeen(); ensureProfile(() => { renderMap(); show('map'); music('menu'); }); };
} catch (e) {
  console.error(e);
  go.textContent = 'ERRO AO CARREGAR';
  $('title').querySelector('.story').insertAdjacentHTML('afterend', '<p class="story" style="color:var(--bad)">Não consegui carregar as fases. Rode o jogo por um servidor HTTP (ex.: <code>python3 -m http.server</code>), não abrindo o arquivo direto.</p>');
}
