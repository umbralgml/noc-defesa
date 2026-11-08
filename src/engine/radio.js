// Vozes do jogo pela Web Speech API (nativa, sem biblioteca), ligadas junto com o som.
// Central do NOC: voz animada e natural (sem rebaixar o tom, que deixa a voz robótica).
// Z3R0: voz de vilão de luta, grave, lenta e com um rosnado subgrave do Web Audio por baixo.

import { store } from './util.js';
import { isMuted, sfx, zDrone } from './audio.js';
import { t, LANG } from './i18n.js';

let radioEnabled = true, lastSpeakTime = 0, cachedVoices = [], droneOff = null;
try { const saved = store('noc_voice'); if (saved !== null && saved !== undefined) radioEnabled = !!saved; } catch (e) {}

const SS = () => (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance) ? window.speechSynthesis : null;
function updateVoices() { try { const l = SS() && SS().getVoices(); if (l && l.length) cachedVoices = l; } catch (e) {} }
if (SS()) { updateVoices(); if (SS().onvoiceschanged !== undefined) SS().onvoiceschanged = updateVoices; }

export const isRadioOn = () => radioEnabled;
export function setRadioOn(v) {
  radioEnabled = !!v; store('noc_voice', radioEnabled);
  if (!radioEnabled && SS()) { SS().cancel(); zDrone(false); }
}

// Nomes casam por palavra inteira: "ana" não pode pegar "Mariana" nem "man" pegar "German".
const word = list => new RegExp(`(^|[^a-z])(${list.join('|')})([^a-z]|$)`);
const MALE = word(['male', 'man', 'masculino', 'homem', 'daniel', 'felipe', 'ricardo', 'antonio', 'fabio', 'julio', 'donato', 'humberto', 'nicolau', 'valerio',
  'jorge', 'diego', 'enrique', 'pablo', 'alvaro', 'juan', 'carlos', 'gonzalo', 'jorge', 'tomas', 'raul', 'dario', 'gerardo', 'liam',
  'guy', 'davis', 'tony', 'andrew', 'brian', 'eric', 'roger', 'christopher', 'steffan', 'ryan', 'thomas', 'george', 'arthur', 'oliver', 'fred', 'alex', 'aaron', 'gordon', 'rishi',
  'ptd', 'pte', 'esd', 'esf', 'iom', 'tpd', 'iol']);
const FEMALE = word(['female', 'woman', 'feminino', 'mulher', 'maria', 'helena', 'luciana', 'francisca', 'fernanda', 'vitoria', 'camila', 'raquel', 'thalita', 'yara', 'leila', 'manuela', 'giovanna', 'leticia', 'brenda', 'elza',
  'zira', 'samantha', 'victoria', 'karen', 'monica', 'paulina', 'laura', 'elena', 'elvira', 'dalia', 'sofia', 'carmen', 'conchita', 'lucia', 'aria', 'jenny', 'emma', 'ava', 'michelle', 'sonia', 'libby', 'susan', 'hazel', 'moira', 'tessa', 'fiona',
  'afs', 'pta', 'ptc', 'esa', 'esc', 'sfb', 'tpf', 'tpc']);
const NATURAL = /natural|neural|online|enhanced|premium|wavenet|studio|siri/;
const LOC = { pt: 'pt-br', es: 'es', en: 'en-us' };

// Pontua as vozes do aparelho: idioma certo, voz natural (não robótica) e, se possível, masculina.
function pickVoice(villain) {
  if (!cachedVoices.length) updateVoices();
  const pre = LANG === 'pt' ? 'pt' : LANG, loc = LOC[LANG] || 'pt-br';
  const pool = cachedVoices.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(pre));
  if (!pool.length) return null;
  const score = v => {
    const raw = `${v.name || ''} ${v.voiceURI || ''}`.toLowerCase(), lang = (v.lang || '').toLowerCase().replace('_', '-');
    let s = lang.startsWith(loc) ? 4 : 0;
    if (NATURAL.test(raw)) s += 3;
    if (MALE.test(raw) && !FEMALE.test(raw)) s += villain ? 6 : 3; else if (FEMALE.test(raw)) s -= villain ? 4 : 1;
    if (v.localService) s += .5;   // offline também funciona no app
    return s;
  };
  return pool.slice().sort((a, b) => score(b) - score(a))[0];
}
const isMale = v => !!v && MALE.test(`${v.name} ${v.voiceURI}`.toLowerCase()) && !FEMALE.test(`${v.name} ${v.voiceURI}`.toLowerCase());
const canSpeak = () => radioEnabled && !isMuted() && SS() && !document.documentElement.classList.contains('calm');
const pick = x => Array.isArray(x) ? x[Math.random() * x.length | 0] : x;

function utter(text, villain) {
  const u = new SpeechSynthesisUtterance(t(pick(text))), v = pickVoice(villain);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' }[LANG] || 'pt-BR';
  return { u, male: isMale(v) };
}

// Central do NOC: animada, ritmo de narrador. Aceita uma lista de frases e sorteia uma.
export function speakRadio(text, { force = false } = {}) {
  if (!canSpeak()) return;
  const now = Date.now();
  if (now - lastSpeakTime < (force ? 2200 : 7000)) return;
  lastSpeakTime = now;
  try {
    SS().cancel(); zDrone(false);
    const { u, male } = utter(text, false);
    u.rate = 1.12; u.pitch = male ? 1.05 : 0.98; u.volume = 1;   // tom quase natural: rebaixar demais deixa a voz metálica
    try { sfx.radio ? sfx.radio() : sfx.sel(); } catch (e) {}
    SS().speak(u);
  } catch (e) {}
}

// Z3R0: imponente e ameaçador. Entra na fila depois da central em vez de cortar a fala dela.
export function speakZ3R0(text) {
  if (!canSpeak()) return;
  try {
    const { u, male } = utter(text, true);
    u.rate = 0.8; u.pitch = male ? 0.35 : 0.2; u.volume = 1;
    const stop = () => { clearTimeout(droneOff); zDrone(false); };
    u.onstart = () => { try { sfx.boom(); } catch (e) {} zDrone(true); clearTimeout(droneOff); droneOff = setTimeout(stop, 1500 + u.text.length * 110); };
    u.onend = stop; u.onerror = stop;
    SS().speak(u);
    lastSpeakTime = Date.now();
  } catch (e) {}
}
