// Perfil do analista: um só painel com abas para o personagem, os dados do ranking e os ajustes
// (som, acessibilidade e zerar progresso). Abre pelo botão Perfil da tela inicial e pelo "trocar".
import { $ } from './util.js';
import { au, music, setMute, isMuted, MUS } from './audio.js';
import { lookModal, a11yModal } from './prefs.js';
import { profileForm } from './rank.js';
import { askReset } from './game.js';

const TABS = [['char', '🎨 Personagem'], ['data', '🪪 Dados'], ['set', '⚙ Ajustes']];
const head = cur => `<div class="ptabs" role="tablist">${TABS.map(([k, n]) => `<button class="ptab${k === cur ? ' on' : ''}" role="tab" aria-selected="${k === cur}" data-p="${k}">${n}</button>`).join('')}</div>`;
let after = null;   // atualiza a tela inicial quando algo muda
const wire = () => $('mcard').querySelectorAll('.ptab').forEach(b => b.onclick = () => openPerfil(b.dataset.p));

export function openPerfil(tab = 'char', done) {
  if (done) after = done;
  if (tab === 'data') return profileForm(after, false, head('data'), wire);
  if (tab === 'set') {
    const extra = `<div class="lsec">SOM</div><button class="btn ghostb wideb" id="sndP">SOM: ${isMuted() ? 'OFF' : 'ON'}</button>
      <div class="lsec">PROGRESSO</div><button class="btn ghostb wideb danger" id="resetP">ZERAR PROGRESSO</button>`;
    return a11yModal(head('set'), extra, () => {
      wire();
      $('sndP').onclick = () => { au(); setMute(!isMuted()); if (!isMuted()) music(MUS.cur || 'menu'); };
      $('resetP').onclick = () => askReset(() => { after && after(); openPerfil('set'); });
    });
  }
  lookModal(after, head('char'), wire);
}
