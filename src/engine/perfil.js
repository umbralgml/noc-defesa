// Perfil do analista: um só painel com abas para o personagem, o crachá oficial,
// os dados do ranking e os ajustes (som, voz tática, acessibilidade e zerar progresso).
import { $ } from './util.js';
import { au, music, setMute, isMuted, MUS } from './audio.js';
import { lookModal, a11yModal } from './prefs.js';
import { profileForm } from './rank.js';
import { askReset } from './game.js';
import { modal, closeModal } from './ui.js';
import { badgeHTML, wireBadge } from './badge.js';
import { isRadioOn, setRadioOn, speakRadio } from './radio.js';
import { t } from './i18n.js';

const TABS = [['char', '🎨 Personagem'], ['badge', '🪪 Crachá'], ['data', '📋 Dados'], ['set', '⚙ Ajustes']];
const head = cur => `<div class="ptabs" role="tablist">${TABS.map(([k, n]) => `<button class="ptab${k === cur ? ' on' : ''}" role="tab" aria-selected="${k === cur}" data-p="${k}">${t(n)}</button>`).join('')}</div>`;
let after = null;   // atualiza a tela inicial quando algo muda
const wire = () => $('mcard').querySelectorAll('.ptab').forEach(b => b.onclick = () => openPerfil(b.dataset.p));

export function openPerfil(tab = 'char', done) {
  if (done) after = done;
  if (tab === 'badge') {
    modal(`${head('badge')}${badgeHTML()}<div class="row" style="margin-top:14px"><button class="btn ghostb" id="mOk">FECHAR</button></div>`);
    $('mOk').onclick = closeModal;
    wire();
    wireBadge();
    return;
  }
  if (tab === 'data') return profileForm(after, false, head('data'), wire);
  if (tab === 'set') {
    const extra = `<div class="lsec">${t('ÁUDIO E VOZ')}</div><button class="btn ghostb wideb" id="sndP">${isMuted() ? t('SOM GERAL: OFF') : t('SOM GERAL: ON')}</button>
      <button class="btn ghostb wideb" id="voiceP" style="margin-top:6px">${isRadioOn() ? t('VOZ TÁTICA DO NOC: LIGADA') : t('VOZ TÁTICA DO NOC: DESLIGADA')}</button>
      <div class="lsec">${t('PROGRESSO')}</div><button class="btn ghostb wideb danger" id="resetP">${t('ZERAR PROGRESSO')}</button>`;
    return a11yModal(head('set'), extra, () => {
      wire();
      $('sndP').onclick = () => {
        au(); setMute(!isMuted()); if (!isMuted()) music(MUS.cur || 'menu');
        $('sndP').textContent = isMuted() ? t('SOM GERAL: OFF') : t('SOM GERAL: ON');
      };
      $('voiceP').onclick = () => {
        setRadioOn(!isRadioOn());
        $('voiceP').textContent = isRadioOn() ? t('VOZ TÁTICA DO NOC: LIGADA') : t('VOZ TÁTICA DO NOC: DESLIGADA');
        if (isRadioOn()) speakRadio('Voz tática da central ativada.');
      };
      $('resetP').onclick = () => askReset(() => { after && after(); openPerfil('set'); });
    });
  }
  lookModal(after, head('char'), wire);
}
