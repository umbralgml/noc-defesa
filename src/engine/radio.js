// Voz Tática do NOC e Voz do Antagonista Z3R0 (Web Speech API).
// 100% nativo, sem bibliotecas externas, ativado junto com o áudio do jogo.
// Configurado com seleção rigorosa de timbres masculinos e pitches graves para máxima imponência e autoridade.

import { store } from './util.js';
import { isMuted, sfx } from './audio.js';
import { t, LANG } from './i18n.js';

let radioEnabled = true;
let lastSpeakTime = 0;
let cachedVoices = [];

try {
  const saved = store('noc_voice');
  if (saved !== null && saved !== undefined) radioEnabled = !!saved;
} catch (e) {}

function updateVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length) cachedVoices = list;
  } catch (e) {}
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
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

// Identificadores de vozes masculinas em diversos sistemas operacionais (Android, Windows, macOS, iOS, Linux)
const MALE_TERMS = [
  'male', 'homem', 'masculino', 'man', 'boy', 'guy',
  'daniel', 'felipe', 'ricardo', 'jorge', 'carlos', 'diego', 'enrique', 'pablo', 'miguel',
  'antonio', 'alvaro', 'rodrigo', 'fabio', 'guilherme', 'manuel', 'gonzalo', 'juan',
  'david', 'mark', 'george', 'alex', 'fred', 'ryan', 'oliver', 'luciano', 'tom',
  'ptd', 'ptb', 'esb', 'esd', 'sfg', 'neural2-d', 'neural2-j', 'standard-b', 'standard-d',
  'wavenet-b', 'wavenet-d', 'wavenet-j', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'
];

// Identificadores de vozes femininas para exclusão estrita
const FEMALE_TERMS = [
  'female', 'mulher', 'feminino', 'woman', 'girl',
  'maria', 'helena', 'luciana', 'francisca', 'yelda', 'fernanda', 'vitória', 'vitoria',
  'camila', 'raquel', 'zira', 'samantha', 'victoria', 'karen', 'monica', 'paulina', 'laura',
  'elena', 'elisa', 'sofia', 'carmen', 'conchita', 'mia', 'aria', 'jenny', 'ana', 'leticia',
  'joana', 'catarina', 'ines', 'inês', 'marta', 'teresa', 'clara',
  'afs', 'afn', 'pta', 'ptc', 'esa', 'esc', 'neural2-a', 'neural2-c', 'neural2-f',
  'standard-a', 'standard-c', 'standard-e', 'standard-f',
  'wavenet-a', 'wavenet-c', 'wavenet-e', 'wavenet-f',
  'f1', 'f2', 'f3', 'f4', 'f5'
];

function pickImposingVoice(langPrefix) {
  if (!cachedVoices.length) updateVoices();
  const all = cachedVoices.length ? cachedVoices : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
  if (!all || !all.length) return null;

  const targetVoices = all.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
  const pool = targetVoices.length ? targetVoices : all;

  // 1. Busca por voz estritamente masculina
  let best = pool.find(v => {
    const raw = `${v.name || ''} ${v.voiceURI || ''}`.toLowerCase();
    const isMale = MALE_TERMS.some(m => raw.includes(m));
    const isFemale = FEMALE_TERMS.some(f => raw.includes(f));
    return isMale && !isFemale;
  });

  // 2. Se não encontrou uma com nome masculino explícito, busca qualquer uma que NÃO seja feminina
  if (!best) {
    best = pool.find(v => {
      const raw = `${v.name || ''} ${v.voiceURI || ''}`.toLowerCase();
      return !FEMALE_TERMS.some(f => raw.includes(f));
    });
  }

  // 3. Fallback: se o dispositivo só tiver 1 voz instalada, retorna ela (o pitch baixo vai deixá-la grave)
  if (!best && pool.length) best = pool[0];

  return best || null;
}

// Voz Tática e Imponente da Central do NOC
export function speakRadio(text, { force = false } = {}) {
  if (!radioEnabled || isMuted()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  if (document.documentElement.classList.contains('calm')) return;

  const now = Date.now();
  // Cooldown de 7 segundos para falas normais, e 2.2s mesmo para falas forçadas
  if (!force && now - lastSpeakTime < 7000) return;
  if (force && now - lastSpeakTime < 2200) return;
  lastSpeakTime = now;

  try {
    window.speechSynthesis.cancel();
    const translated = t(text);
    const u = new SpeechSynthesisUtterance(translated);
    const langPrefix = LANG === 'es' ? 'es' : LANG === 'en' ? 'en' : 'pt';
    const voice = pickImposingVoice(langPrefix);

    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' }[LANG] || 'pt-BR';
    }

    // Parâmetros para voz grave, imponente, com autoridade e presença de comandante de operações
    u.pitch = 0.80;  // Registro barítono encorpado (abaixo de 1.0 garante voz masculina imponente)
    u.rate = 1.02;   // Cadência firme, resoluta e segura
    u.volume = 1.0;

    // Bip tático de abertura de canal de rádio
    try { if (sfx.radio) sfx.radio(); else sfx.sel(); } catch (e) {}

    window.speechSynthesis.speak(u);
  } catch (e) {
    // Web Speech silencioso em navegadores sem suporte
  }
}

// Voz Robótica, Sinistra e Imponente do Antagonista Z3R0
export function speakZ3R0(text) {
  if (!radioEnabled || isMuted()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  if (document.documentElement.classList.contains('calm')) return;

  try {
    window.speechSynthesis.cancel();
    try { if (sfx.glitch) sfx.glitch(); else sfx.zap(); } catch (e) {}

    const translated = t(text);
    const u = new SpeechSynthesisUtterance(translated);
    const langPrefix = LANG === 'es' ? 'es' : LANG === 'en' ? 'en' : 'pt';
    const voice = pickImposingVoice(langPrefix);

    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' }[LANG] || 'pt-BR';
    }

    // Configuração robótica ultra-grave e imponente de vilão cibernético
    u.pitch = 0.44;  // Sub-grave mecânico ameaçador e imponente
    u.rate = 0.88;   // Cadência calculada e implacável
    u.volume = 1.0;

    window.speechSynthesis.speak(u);
    lastSpeakTime = Date.now();
  } catch (e) {}
}
