// Voz animada do NOC (Web Speech API) para despachos, incentivos e comemorações.
// 100% nativo, sem bibliotecas externas, ativado junto com o áudio do jogo.
// Configurado para uma locução masculina animada, enérgica e vibrante (estilo Ace Ventura).
import { store } from './util.js';
import { isMuted, sfx } from './audio.js';
import { t, LANG } from './i18n.js';

let radioEnabled = true;
let lastSpeakTime = 0;

try {
  const saved = store('noc_voice');
  if (saved !== null && saved !== undefined) radioEnabled = !!saved;
} catch (e) {}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      try { window.speechSynthesis.getVoices(); } catch (e) {}
    };
  }
}

export const isRadioOn = () => radioEnabled;
export function setRadioOn(v) {
  radioEnabled = !!v;
  store('noc_voice', radioEnabled);
  if (!radioEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speakRadio(text, { force = false } = {}) {
  if (!radioEnabled || isMuted()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  if (document.documentElement.classList.contains('calm')) return;

  const now = Date.now();
  // Evita spam de falas muito próximas, a menos que seja forçado (ex: fim de fase ou combo importante)
  if (!force && now - lastSpeakTime < 1400) return;
  lastSpeakTime = now;

  try {
    window.speechSynthesis.cancel();
    const translated = t(text);
    const u = new SpeechSynthesisUtterance(translated);
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = LANG === 'es' ? 'es' : LANG === 'en' ? 'en' : 'pt';
    const langVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));

    // Nomes masculinos comuns em sintetizadores de fala por idioma
    const maleNames = [
      'daniel', 'felipe', 'ricardo', 'jorge', 'carlos', 'diego', 'enrique', 'pablo', 'miguel',
      'david', 'mark', 'george', 'alex', 'fred', 'male', 'guy', 'luciano'
    ];
    const femaleNames = [
      'maria', 'helena', 'luciana', 'francisca', 'yelda', 'fernanda', 'vitória', 'vitoria',
      'camila', 'raquel', 'zira', 'samantha', 'victoria', 'karen', 'monica', 'paulina', 'laura', 'female'
    ];

    let voice = langVoices.find(v => {
      const n = (v.name || '').toLowerCase();
      return maleNames.some(m => n.includes(m)) && !femaleNames.some(f => n.includes(f));
    });

    if (!voice) {
      voice = langVoices.find(v => {
        const n = (v.name || '').toLowerCase();
        return !femaleNames.some(f => n.includes(f));
      });
    }
    if (!voice && langVoices.length) voice = langVoices[0];

    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' }[LANG] || 'pt-BR';
    }

    // Parâmetros para voz animada, rápida e empolgada (estilo Ace Ventura)
    u.pitch = 1.18;  // tom mais alto, vibrante e expressivo
    u.rate = 1.16;   // ritmo acelerado, enérgico e empolgante
    u.volume = 0.95;

    // Bip sutil de rádio tático
    try { sfx.sel(); } catch (e) {}

    window.speechSynthesis.speak(u);
  } catch (e) {
    // Web Speech silencioso em navegadores sem suporte
  }
}
