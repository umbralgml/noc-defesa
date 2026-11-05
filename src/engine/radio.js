// Voz tática do sistema (Web Speech API) para alertas e despachos do NOC.
// 100% nativo, sem bibliotecas externas, ativado junto com o áudio do jogo.
import { store } from './util.js';
import { isMuted, sfx } from './audio.js';

let radioEnabled = true;
try {
  const saved = store('noc_voice');
  if (saved !== null && saved !== undefined) radioEnabled = !!saved;
} catch (e) {}

export const isRadioOn = () => radioEnabled;
export function setRadioOn(v) {
  radioEnabled = !!v;
  store('noc_voice', radioEnabled);
  if (!radioEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speakRadio(text) {
  if (!radioEnabled || isMuted()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  if (document.documentElement.classList.contains('calm')) return;

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const pt = voices.find(v => v.lang && (v.lang.startsWith('pt-BR') || v.lang.startsWith('pt')));
    if (pt) u.voice = pt;
    u.pitch = 0.86;  // tom tático mais grave / robótico
    u.rate = 1.05;   // ritmo direto e objetivo
    u.volume = 0.75;
    
    // Pequeno bip de acionamento do rádio
    try { sfx.sel(); } catch (e) {}

    window.speechSynthesis.speak(u);
  } catch (e) {
    // Web Speech silencioso em navegadores sem suporte
  }
}
