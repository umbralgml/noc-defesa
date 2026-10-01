// Ponto de entrada: monta a tela de título, carrega as fases e liga os botões.
import { $ } from './engine/util.js';
import { au, music, setMute, isMuted, MUS } from './engine/audio.js';
import { AV_ME, HX, sceneSVG, heroTo } from './engine/scene.js';
import { loadLevels } from './engine/levels.js';
import { show } from './engine/ui.js';
import { initGame, renderMap, askReset, progress } from './engine/game.js';
import { loadNews, markNewsSeen } from './engine/news.js';
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

initGame(); initDrop(); initWire();
loadNews().catch(e => { console.error(e); $('news').hidden = true; $('newsBtn').style.display = 'none'; });

const go = $('goMap');
go.disabled = true;
try {
  await loadLevels();
  go.disabled = false;
  showProgress();
  go.onclick = () => { au(); markNewsSeen(); renderMap(); show('map'); music('menu'); };
} catch (e) {
  console.error(e);
  go.textContent = 'ERRO AO CARREGAR';
  $('title').querySelector('.story').insertAdjacentHTML('afterend', '<p class="story" style="color:var(--bad)">Não consegui carregar as fases. Rode o jogo por um servidor HTTP (ex.: <code>python3 -m http.server</code>), não abrindo o arquivo direto.</p>');
}
