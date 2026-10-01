// Ponto de entrada: monta a tela de título, carrega as fases e liga os botões.
import { $ } from './engine/util.js';
import { au, music, setMute, isMuted, MUS } from './engine/audio.js';
import { AV_ME, HX, sceneSVG, heroTo } from './engine/scene.js';
import { loadLevels } from './engine/levels.js';
import { show } from './engine/ui.js';
import { initGame, renderMap, askReset } from './engine/game.js';
import { progress } from './engine/state.js';
import { loadNews, markNewsSeen } from './engine/news.js';
import { initDaily, startDaily, dailyBoard } from './engine/daily.js';
import { loadRankConfig, openRanking, ensureProfile, profileForm, profile, anonName, titleRanking, hooks } from './engine/rank.js';
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

initGame(); initDrop(); initWire(); initDaily();
loadRankConfig().then(on => { $('rkBox').hidden = !on; if (on) titleRanking(dailyBoard()); });
// "Jogando como ..." na tela inicial; atualiza quando o perfil muda.
function showWho() {
  const p = profile(); $('tWho').hidden = !p;
  if (p) $('tWhoName').textContent = p.name || anonName();
}
hooks.profile = () => { showWho(); titleRanking(dailyBoard()); };
showWho();
$('tWhoEdit').onclick = () => profileForm();
document.querySelectorAll('.rankBtn').forEach(b => b.onclick = () => { au(); openRanking(dailyBoard()); });
loadNews().catch(e => { console.error(e); $('news').hidden = true; $('newsBtn').hidden = true; });

const go = $('goMap'), daily = $('dailyT');
go.disabled = daily.disabled = true;
try {
  await loadLevels();
  go.disabled = daily.disabled = false;
  daily.onclick = () => { au(); markNewsSeen(); ensureProfile(startDaily); };
  showProgress();
  go.onclick = () => { au(); markNewsSeen(); ensureProfile(() => { renderMap(); show('map'); music('menu'); }); };
} catch (e) {
  console.error(e);
  go.textContent = 'ERRO AO CARREGAR';
  $('title').querySelector('.story').insertAdjacentHTML('afterend', '<p class="story" style="color:var(--bad)">Não consegui carregar as fases. Rode o jogo por um servidor HTTP (ex.: <code>python3 -m http.server</code>), não abrindo o arquivo direto.</p>');
}
