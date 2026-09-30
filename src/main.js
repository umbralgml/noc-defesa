// Ponto de entrada: monta a tela de título, carrega as fases e liga os botões.
import { $ } from './engine/util.js';
import { au, music, setMute, isMuted, MUS } from './engine/audio.js';
import { AV_ME, HX, sceneSVG, heroTo } from './engine/scene.js';
import { resetProgress } from './engine/state.js';
import { loadLevels } from './engine/levels.js';
import { show, modal, closeModal } from './engine/ui.js';
import { initGame, renderMap } from './engine/game.js';
import { initDrop } from './engine/drop.js';
import { initWire } from './engine/wire.js';

$('mA').innerHTML = AV_ME;
$('tScene').innerHTML = sceneSVG('war', true) + `<div class="caption"><i></i>03:12 · ALERTA CRÍTICO NO NOC</div>`;
heroTo($('tScene'), HX.war, true); $('tScene').querySelector('.hero').classList.add('type');

$('sndT').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music(MUS.cur || 'menu'); };
$('sndM').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music('menu'); };
setMute(isMuted());
$('resetBtn').onclick = () => {
  modal(`<h2>Zerar progresso?</h2><div class="learn">Todas as estrelas, pontos e fases desbloqueadas serão apagados.</div><div class="row"><button class="btn ghostb" id="mNo">CANCELAR</button><button class="btn" id="mYes">ZERAR</button></div>`);
  $('mNo').onclick = closeModal;
  $('mYes').onclick = () => { resetProgress(); closeModal(); };
};

initGame(); initDrop(); initWire();

const go = $('goMap');
go.disabled = true;
try {
  await loadLevels();
  go.disabled = false;
  go.onclick = () => { au(); renderMap(); show('map'); music('menu'); };
} catch (e) {
  console.error(e);
  go.textContent = 'ERRO AO CARREGAR';
  $('title').querySelector('.story').insertAdjacentHTML('afterend', '<p class="story" style="color:var(--bad)">Não consegui carregar as fases. Rode o jogo por um servidor HTTP (ex.: <code>python3 -m http.server</code>), não abrindo o arquivo direto.</p>');
}
