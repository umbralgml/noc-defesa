// Voz tática do sistema (Web Speech API) para alertas e despachos do NOC.
// 100% nativo, sem bibliotecas externas, ativado junto com o áudio do jogo.
import { store } from './util.js';
import { isMuted, sfx } from './audio.js';
import { t, LANG } from './i18n.js';

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
    const translated = t(text);
    const u = new SpeechSynthesisUtterance(translated);
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = LANG === 'es' ? 'es' : LANG === 'en' ? 'en' : 'pt';
    const voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' }[LANG] || 'pt-BR';
    }
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
