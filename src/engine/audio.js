// Som 100% sintetizado com Web Audio: efeitos (sfx) e um sequenciador de música simples.
// Nada é tocado antes de au() ser chamado num gesto do usuário (política de autoplay).

let AC = null, MASTER, MUSG, SFXG, DLY, GTR_BUS = null, muted = false;
try { muted = localStorage.getItem('noc_mute') === '1'; } catch (e) {}
export function au() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      MASTER = AC.createGain(); MASTER.gain.value = muted ? 0 : 0.9;
      MASTER.connect(comp); comp.connect(AC.destination);
      MUSG = AC.createGain(); MUSG.gain.value = 0.38; MUSG.connect(MASTER);
      SFXG = AC.createGain(); SFXG.gain.value = 1; SFXG.connect(MASTER);
      DLY = AC.createDelay(); DLY.delayTime.value = 0.19;
      const fb = AC.createGain(); fb.gain.value = 0.32; const wet = AC.createGain(); wet.gain.value = 0.3;
      DLY.connect(fb); fb.connect(DLY); DLY.connect(wet); wet.connect(MASTER);
      initGuitarBus();
    } catch (e) { AC = null; }
  } else if (AC.state === 'suspended') AC.resume();
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function osc(f, d, { type = 'square', v = .05, sl = 0, at = 0, bus, echo = false, det = 0, att = .005 } = {}) {
  if (!AC) return;
  const t = (at || AC.currentTime), o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det;
  if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + sl), t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(bus || SFXG); if (echo) g.connect(DLY);
  o.start(t); o.stop(t + d + .05);
}
let NB = null;
function noiseBuf() { if (!NB) { const len = AC.sampleRate * 3; NB = AC.createBuffer(1, len, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; } return NB; }
function noise(d, { v = .1, type = 'highpass', f = 6000, f2 = 0, at = 0, bus, q = 1 } = {}) {
  if (!AC) return;
  const t = at || AC.currentTime, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(bus || SFXG); s.start(t, Math.random() * .8); s.stop(t + d + .05);
}
function kick(at, v = .5, bus) { if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(40, at + .12); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(.0001, at + .25); o.connect(g); g.connect(bus || MUSG); o.start(at); o.stop(at + .3); }
export const sfx = {
  ok(c) { const b = 72 + Math.min(c, 5) * 2; const t = AC && AC.currentTime; if (!AC) return; [0, 4, 7].forEach((n, i) => { osc(mtof(b + n), .35, { type: 'sine', v: .09, at: t + i * .045, echo: true }); osc(mtof(b + n + 12), .2, { type: 'triangle', v: .03, at: t + i * .045 }); }); },
  plug() { if (!AC) return; const t = AC.currentTime; noise(.03, { v: .25, f: 3000, at: t }); osc(90, .08, { type: 'square', v: .06, at: t }); [76, 83, 88].forEach((m, i) => osc(mtof(m), .18, { type: 'sine', v: .07, at: t + .06 + i * .06, echo: true })); },
  bad() { if (!AC) return; const t = AC.currentTime; osc(140, .28, { type: 'sawtooth', v: .09, sl: -80, at: t }); osc(147, .28, { type: 'square', v: .05, sl: -90, at: t }); noise(.2, { v: .14, type: 'bandpass', f: 1200, q: 3, at: t }); for (let i = 0; i < 4; i++) osc(200 + Math.random() * 600, .03, { type: 'square', v: .04, at: t + .05 + i * .04 }); },
  step() { if (!AC) return; noise(.05, { v: .18, type: 'lowpass', f: 400 }); osc(70, .06, { type: 'sine', v: .12 }); },
  key() { if (!AC) return; noise(.018, { v: .12, f: 4000 + Math.random() * 2000 }); },
  sel() { osc(1320, .06, { type: 'sine', v: .05 }); osc(1760, .05, { type: 'sine', v: .03, at: AC && AC.currentTime + .03 }); },
  whoosh() { noise(.45, { v: .12, type: 'bandpass', f: 300, f2: 3000, q: 1.5 }); },
  combo(m) { if (!AC) return; const t = AC.currentTime; [0, 4, 7, 12, 16].slice(0, m).forEach((n, i) => { osc(mtof(76 + n), .16, { type: 'square', v: .05, at: t + i * .05 }); osc(mtof(88 + n), .3, { type: 'triangle', v: .05, at: t + i * .05, echo: true }); }); },
  drop() { if (!AC) return; const t = AC.currentTime; osc(110, .12, { type: 'sine', v: .2, sl: -50, at: t }); noise(.05, { v: .12, type: 'lowpass', f: 900, at: t }); },
  tick() { osc(1500, .04, { type: 'square', v: .03 }); },
  zap() { if (!AC) return; osc(1400, .25, { type: 'sawtooth', v: .07, sl: -1250 }); noise(.15, { v: .1, f: 2000 }); },
  win() { if (!AC) return; const t = AC.currentTime; [60, 64, 67, 72, 76, 79].forEach((m, i) => { osc(mtof(m), .22, { type: 'square', v: .05, at: t + i * .09 }); osc(mtof(m), .22, { type: 'triangle', v: .06, at: t + i * .09, echo: true }); }); [72, 76, 79, 84].forEach(m => osc(mtof(m), 1.1, { type: 'triangle', v: .06, at: t + .6, echo: true })); kick(t + .6, .5, SFXG); },
  lose() { if (!AC) return; const t = AC.currentTime; [64, 61, 57, 52].forEach((m, i) => { osc(mtof(m), .4, { type: 'sawtooth', v: .06, at: t + i * .2, det: -15 }); osc(mtof(m), .4, { type: 'sawtooth', v: .06, at: t + i * .2, det: 15 }); }); noise(1, { v: .1, type: 'lowpass', f: 2000, f2: 100, at: t + .8 }); },
  boom() { if (!AC) return; const t = AC.currentTime; noise(1.6, { v: .45, type: 'lowpass', f: 3000, f2: 60, at: t }); osc(80, 1.2, { type: 'sine', v: .4, sl: -50, at: t }); [0, .15, .3].forEach(d => osc(900 - d * 1000, .3, { type: 'sawtooth', v: .05, sl: -700, at: t + d })); },
  siren() { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(950, t + .35); o.frequency.linearRampToValueAtTime(600, t + .7); g.gain.setValueAtTime(.04, t); g.gain.exponentialRampToValueAtTime(.0001, t + .75); o.connect(g); g.connect(SFXG); o.start(t); o.stop(t + .8); },
  radio() { if (!AC) return; const t = AC.currentTime; osc(920, .035, { type: 'sine', v: .05, at: t }); osc(1380, .035, { type: 'sine', v: .04, at: t + .032 }); noise(.035, { v: .025, type: 'bandpass', f: 2800, q: 2, at: t + .065 }); },
  glitch() { if (!AC) return; const t = AC.currentTime; osc(180, .2, { type: 'sawtooth', v: .08, sl: -100, at: t }); osc(90, .22, { type: 'square', v: .06, sl: -45, at: t }); noise(.14, { v: .07, type: 'bandpass', f: 850, q: 3, at: t }); }
};

// ---------- Banda de rock sintetizada ----------
// Guitarra: corda dedilhada por Karplus-Strong (ruído que vira nota num laço com atraso), duas guitarras
// gravadas em L e R, distorção valvulada e simulação de caixa 4x12. Baixo também em Karplus-Strong.
// Bateria: bumbo, caixa com esteira, chimbal e pratos metálicos (osciladores em razão inarmônica) e sala.
// Quatro músicas originais, uma por clima: menu (hino lento), classic (hard rock), gallop (galope de
// heavy metal com guitarras gêmeas) e boss (riff de pedal em semicolcheias, para chefe, quiz e fase difícil).

let GTR = null, LEAD = null, BASS = null, DRUM = null, VERB = null;
const KS = new Map();

// Corda dedilhada: guarda um buffer por nota (gerado uma vez só).
// Atraso fracionário (interpolado) no laço: a nota sai afinada sem mexer na velocidade de reprodução.
function ksRaw(m, len, decay, sr) {
  const D = sr / mtof(m) - .5, N = Math.floor(D), fr = D - N, d = new Float32Array(len);
  let p = 0; for (let i = 0; i < N + 2 && i < len; i++) { p = p * .5 + (Math.random() * 2 - 1) * .5; d[i] = p; }   // palhetada: ruído levemente filtrado
  for (let i = N + 2; i < len; i++) {   // média de duas amostras (perde agudos como a corda) lidas no atraso exato D
    const y0 = d[i - N] * (1 - fr) + d[i - N - 1] * fr, y1 = d[i - N - 1] * (1 - fr) + d[i - N - 2] * fr;
    d[i] = decay * .5 * (y0 + y1);
  }
  return d;
}
function ksBuf(m, dur = 1.8, decay = .996) {
  const k = `${m}|${dur}|${decay}`; if (KS.has(k)) return KS.get(k);
  const sr = AC.sampleRate, len = Math.floor(sr * dur), b = AC.createBuffer(1, len, sr);
  b.copyToChannel(ksRaw(m, len, decay, sr), 0);
  const v = { b, rate: 1 }; KS.set(k, v); return v;
}
// Power chord já mixado (tônica, quinta, oitava, com a palhetada descendo pelas cordas): uma fonte por guitarra.
function ksChord(r, mute) {
  const k = `c${r}|${mute}`; if (KS.has(k)) return KS.get(k);
  const sr = AC.sampleRate, len = Math.floor(sr * (mute ? .5 : 2.2)), b = AC.createBuffer(1, len, sr), out = b.getChannelData(0);
  [0, 7, 12].forEach((n, j) => { const off = Math.floor(j * .006 * sr), d = ksRaw(r + n, len - off, mute ? .985 : .997, sr), v = j === 2 ? .6 : .85; for (let i = 0; i < d.length; i++) out[i + off] += d[i] * v; });
  const v = { b, rate: 1 }; KS.set(k, v); return v;
}
function shaper(k) { const c = new Float32Array(2048); for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } return c; }
function chain(nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[0]; }
function bq(type, f, q = .7, gain = 0) { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = gain; return b; }
function gn(v) { const g = AC.createGain(); g.gain.value = v; return g; }

// Amplificador: pré, distorção, equalização e caixa. pan = posição no estéreo.
function amp(drive, out, pan, mids = 2) {
  const ws = AC.createWaveShaper(); ws.curve = shaper(drive); ws.oversample = '2x';
  const p = AC.createStereoPanner ? AC.createStereoPanner() : gn(1); if (p.pan) p.pan.value = pan;
  const o = gn(out);
  const head = chain([bq('highpass', 110), gn(1), ws, bq('peaking', 110, 1, 3), bq('peaking', 650, 1.2, -3), bq('peaking', 1900, 1, mids), bq('lowpass', 5200, .9), bq('lowpass', 7500, .7), o, p]);
  p.connect(MUSG); o.connect(VERB.in);
  return head;
}
function initGuitarBus() {
  if (!AC || GTR) return;
  try {
    // Sala: reverb curto gerado em ruído (nada de arquivo externo).
    const cv = AC.createConvolver(), len = AC.sampleRate * 1.4, ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    cv.buffer = ir; const vin = gn(.22); vin.connect(cv); cv.connect(MUSG); VERB = { in: vin };
    GTR = [amp(14, .16, -.75), amp(14, .16, .75)];   // guitarra dobrada esquerda/direita
    LEAD = amp(30, .1, 0, 5);
    const bws = AC.createWaveShaper(); bws.curve = shaper(2.2);
    BASS = chain([bq('lowpass', 1400, .8), bws, bq('peaking', 90, 1, 4), gn(.42)]); BASS.connect(MUSG);
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = .003; comp.release.value = .12;
    DRUM = gn(1); DRUM.connect(comp); comp.connect(MUSG); const dv = gn(.5); DRUM.connect(dv); dv.connect(VERB.in);
  } catch (e) { GTR = null; }
}

// Toca uma corda: palm mute = som abafado e curto; bend = semitons subindo do tom de baixo até a nota.
function pluck(m, at, dur, dest, { v = 1, mute = false, bend = 0, vib = false, decay, buf } = {}) {
  const { b, rate } = buf || ksBuf(m, mute ? .5 : 2.2, decay || (mute ? .985 : .997));
  const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b;
  if (bend) { s.playbackRate.setValueAtTime(rate * Math.pow(2, -bend / 12), at); s.playbackRate.linearRampToValueAtTime(rate, at + Math.min(.12, dur * .5)); }
  else s.playbackRate.setValueAtTime(rate, at);
  if (vib) { const l = AC.createOscillator(), lg = gn(rate * .012); l.frequency.value = 5.5; l.connect(lg); lg.connect(s.playbackRate); l.start(at + dur * .35); l.stop(at + dur + .2); }
  g.gain.setValueAtTime(v, at); g.gain.setTargetAtTime(0, at + dur * (mute ? .4 : .92), mute ? .03 : .06);
  if (mute) { const f = bq('lowpass', 900, .8); s.connect(f); f.connect(g); } else s.connect(g);
  g.connect(dest); s.start(at); s.stop(at + dur + .5);
}
// Power chord (tônica, quinta e oitava) nas duas guitarras, com palhetada levemente desencontrada.
function chord(r, at, dur, mute = false, v = 1) {
  if (!GTR) return;
  const buf = ksChord(r, mute);
  GTR.forEach((bus, side) => pluck(r, at + side * .011, dur, bus, { v, mute, buf }));   // segunda guitarra 11 ms atrás: som dobrado
}
const lead = (m, at, dur, o = {}) => LEAD && pluck(m, at, dur, LEAD, { v: .9, vib: dur > .3, ...o });
function bass(m, at, dur, v = 1) {
  if (!BASS) return;
  pluck(m - 12, at, dur, BASS, { v: v * 1.1, decay: .995 });
  const o = AC.createOscillator(), g = gn(0); o.type = 'sine'; o.frequency.value = mtof(m - 24);   // peso no subgrave
  g.gain.setValueAtTime(.0001, at); g.gain.linearRampToValueAtTime(.32 * v, at + .01); g.gain.setTargetAtTime(0, at + dur * .8, .05);
  o.connect(g); g.connect(MUSG); o.start(at); o.stop(at + dur + .3);
}
// Bateria
function bdKick(at, v = 1) {
  const o = AC.createOscillator(), g = gn(0); o.frequency.setValueAtTime(135, at); o.frequency.exponentialRampToValueAtTime(46, at + .09);
  g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(.001, at + .38); o.connect(g); g.connect(DRUM); o.start(at); o.stop(at + .4);
  noise(.012, { v: .35 * v, type: 'highpass', f: 2500, at, bus: DRUM });
}
function snare(at, v = 1) {
  [185, 330].forEach((f, i) => osc(f, .09, { type: 'triangle', v: (i ? .25 : .5) * v, sl: -40, at, bus: DRUM }));
  noise(.22, { v: .55 * v, type: 'bandpass', f: 2600, q: .6, at, bus: DRUM });
  noise(.08, { v: .3 * v, type: 'highpass', f: 5000, at, bus: DRUM });
}
const METAL = [263, 400, 421, 474, 587, 845];   // razões inarmônicas de prato
function cymbal(at, dur, v, hp) {
  const g = gn(0), f = bq('highpass', hp, .7), b = bq('bandpass', hp * 1.4, .5); g.connect(DRUM);
  b.connect(f); f.connect(g);
  METAL.forEach(fr => { const o = AC.createOscillator(); o.type = 'square'; o.frequency.value = fr * (hp > 6000 ? 1.9 : 1.2); o.connect(b); o.start(at); o.stop(at + dur + .05); });
  g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(.001, at + dur);
}
const hat = (at, open = false, v = 1) => { noise(open ? .26 : .045, { v: .2 * v, type: 'highpass', f: 7500, at, bus: DRUM }); noise(open ? .2 : .03, { v: .1 * v, type: 'bandpass', f: 10500, q: 1.5, at, bus: DRUM }); };
const crash = (at, v = 1) => { cymbal(at, 1.7, .22 * v, 4500); noise(1.4, { v: .1 * v, type: 'highpass', f: 6000, at, bus: DRUM }); };
const ride = at => cymbal(at, .45, .09, 5500);
const tom = (at, f) => { osc(f, .3, { type: 'sine', v: .55, sl: -f * .35, at, bus: DRUM }); noise(.05, { v: .12, type: 'lowpass', f: 1500, at, bus: DRUM }); };
// Virada nos 4 últimos tempos de semicolcheia
function fill(t, q) { [0, 1, 2, 3].forEach(k => Q.tom(t + 12 * q + k * q, [200, 170, 140, 110][k])); }

// Fila: a música "escreve" o compasso inteiro, mas cada nota só vira nó de áudio ~0,25 s antes de tocar.
// Assim, trocar de música ou parar corta na hora, sem sobrar meio compasso tocando.
let CAP = null;
const qd = (fn, ti) => (...a) => CAP ? CAP.push([a[ti], () => fn(...a)]) : fn(...a);
const Q = { chord: qd(chord, 1), lead: qd(lead, 1), bass: qd(bass, 1), kick: qd(bdKick, 0), snare: qd(snare, 0), hat: qd(hat, 0), crash: qd(crash, 0), ride: qd(ride, 0), tom: qd(tom, 0) };

// Músicas: cada uma toca um compasso por vez (bar = número do compasso, t = início, q = semicolcheia).
// Todas em mi menor, compostas para o jogo; lembram os estilos, sem copiar riff nenhum.
const E = 40, G = 43, A = 45, B = 47, C = 48, D = 50, Fs = 42;
const SONGS = {
  // Hino lento e pesado, acordes soando e solo em menor harmônico (o ré sustenido dá o ar "oriental").
  menu: { bpm: 98, bars: 16, play(bar, t, q) {
    const P = [E, E, C, D, E, E, G, B][bar % 8], hits = [0, 6, 12];
    hits.forEach((s, i) => { Q.chord(P, t + s * q, (i === 2 ? 4 : 6) * q * .95); Q.bass(P, t + s * q, (i === 2 ? 4 : 6) * q); });
    for (let s = 0; s < 16; s += 2) { if (s === 0 && bar % 2 === 0) Q.crash(t); else if (s % 4 === 0) Q.ride(t + s * q); else Q.hat(t + s * q, false, .7); }
    [0, 6, 10].forEach(s => Q.kick(t + s * q)); [4, 12].forEach(s => Q.snare(t + s * q));
    if (bar >= 8) {   // solo de guitarra na segunda metade
      const L = [[76, 0, 4], [75, 4, 2], [76, 6, 2], [79, 8, 4], [78, 12, 4]], L2 = [[83, 0, 6], [81, 6, 2], [79, 8, 2], [78, 10, 2], [76, 12, 4]];
      ((bar % 2) ? L2 : L).forEach(([m, s, d]) => Q.lead(m - (bar % 4 === 2 ? 0 : 0), t + s * q, d * q, { bend: s === 0 ? 2 : 0 }));
    }
    if (bar % 8 === 7) fill(t, q);
  } },
  // Hard rock de bar: chimbal aberto, groove reto, riff com abafado e acorde no contratempo, solo com bend.
  classic: { bpm: 122, bars: 16, play(bar, t, q) {
    const P = [A, A, D, E, A, A, G, E][bar % 8];
    for (let s = 0; s < 16; s += 2) {
      const open = s === 0 || s === 6 || s === 10;
      Q.chord(P, t + s * q, open ? 3 * q : 1.6 * q, !open);
      Q.bass(P + (s === 14 ? 7 : 0), t + s * q, 1.8 * q, .9);
      Q.hat(t + s * q, s % 4 === 2, s % 4 === 0 ? 1 : .7);
    }
    if (bar % 4 === 0) Q.crash(t); [0, 7, 8].forEach(s => Q.kick(t + s * q)); [4, 12].forEach(s => Q.snare(t + s * q));
    if (bar >= 8 && bar % 2 === 1) [[69, 0, 2, 2], [72, 2, 2], [69, 4, 2], [67, 6, 2], [64, 8, 4, 2], [67, 12, 2], [69, 14, 2]].forEach(([m, s, d, b]) => Q.lead(m + (bar % 4 === 3 ? 12 : 0), t + s * q, d * q, { bend: b || 0 }));
    if (bar % 8 === 7) fill(t, q);
  } },
  // Galope de heavy metal: colcheia + duas semicolcheias abafadas, guitarras gêmeas em terças.
  gallop: { bpm: 156, bars: 16, play(bar, t, q) {
    const P = [E, E, C, D, E, E, C, B][bar % 8];
    for (let b = 0; b < 4; b++) [0, 2, 3].forEach(s => { const at = t + (b * 4 + s) * q; Q.chord(P, at, (s ? 1 : 2) * q * .95, true, .9); Q.bass(P, at, (s ? 1 : 2) * q * .9, .85); });
    for (let s = 0; s < 16; s += 2) Q.hat(t + s * q, false, .8);
    [0, 2, 3, 8, 10, 11].forEach(s => Q.kick(t + s * q, .8)); [4, 12].forEach(s => Q.snare(t + s * q));
    if (bar % 4 === 0) Q.crash(t);
    if (bar >= 8) {   // duas guitarras solo: melodia e a mesma melodia uma terça acima (escala de mi menor)
      const SC = [64, 66, 67, 69, 71, 72, 74, 76, 78, 79, 81, 83], mel = [[7, 0, 4], [6, 4, 2], [4, 6, 2], [5, 8, 4], [4, 12, 2], [2, 14, 2]], mel2 = [[4, 0, 2], [5, 2, 2], [7, 4, 4], [9, 8, 2], [7, 10, 2], [4, 12, 4]];
      ((bar % 2) ? mel2 : mel).forEach(([i, s, d]) => { Q.lead(SC[i], t + s * q, d * q); Q.lead(SC[i + 2], t + s * q + .004, d * q, { v: .6 }); });
    }
    if (bar % 8 === 7) fill(t, q);
  } },
  // Chefe, quiz e fases difíceis: riff de semicolcheias com nota de pedal, a banda entra no 3º compasso.
  boss: { bpm: 136, bars: 16, play(bar, t, q) {
    const ped = 71, line = [[78, 76, 74, 76], [79, 78, 76, 78], [81, 79, 78, 79], [83, 81, 79, 78]][bar % 4];
    for (let s = 0; s < 16; s++) Q.lead(s % 2 ? line[(s >> 1) % 4] : ped, t + s * q, q * .95, { v: .7, decay: .99 });
    if (bar < 2) { for (let s = 0; s < 16; s += 4) Q.hat(t + s * q, false, .6); return; }   // intro só com o riff
    if (bar < 4) { [0, 4, 8, 12].forEach(s => { Q.kick(t + s * q, .7); Q.tom(t + s * q, 90); }); if (bar === 3) fill(t, q); return; }
    const P = [E, E, A, E, D, A, E, E][bar % 8];
    for (let s = 0; s < 16; s += 2) { Q.chord(P, t + s * q, s % 8 === 0 ? 3.6 * q : 1.6 * q, s % 8 !== 0, .9); Q.bass(P, t + s * q, 1.8 * q); Q.hat(t + s * q, s % 4 === 2); }
    [0, 2, 8, 10].forEach(s => Q.kick(t + s * q)); [4, 12].forEach(s => Q.snare(t + s * q, 1.1));
    if (bar % 2 === 0) Q.crash(t, bar % 8 === 4 ? 1.2 : .9);
    if (bar % 8 === 7) fill(t, q);
  } }
};
SONGS.play = SONGS.classic;   // nome antigo

export const MUS = { cur: null, bar: 0, next: 0, timer: null, ev: [] };
// Corta o que ainda soa (cordas e pratos têm cauda longa) com um fade rápido no canal da música.
function hush() { MUS.ev = []; if (MUSG) { const t = AC.currentTime; MUSG.gain.cancelScheduledValues(t); MUSG.gain.setTargetAtTime(0, t, .04); MUSG.gain.setTargetAtTime(.38, t + .3, .02); } }
export function music(name) {
  if (!SONGS[name]) name = 'play';
  if (MUS.cur === name && MUS.timer) return;
  const changed = MUS.cur !== name && MUS.timer; MUS.cur = name;
  if (!AC || muted) return;
  if (!GTR) initGuitarBus();
  if (changed) { hush(); MUS.bar = 0; MUS.next = AC.currentTime + .32; }
  if (!MUS.timer) { MUS.next = AC.currentTime + .1; MUS.bar = 0; MUS.ev = []; MUS.timer = setInterval(schedule, 40); }
}
export function stopMusic() { clearInterval(MUS.timer); MUS.timer = null; if (AC) hush(); }

// Agenda um compasso inteiro por vez, com folga para o navegador não engasgar.
function schedule() {
  const sg = SONGS[MUS.cur]; if (!sg || !AC || !GTR) return;
  const q = 60 / sg.bpm / 4;
  const now = AC.currentTime;
  if (MUS.next < now) { MUS.next = now + .05; MUS.ev = []; }   // aba voltou do segundo plano: recomeça sem atraso acumulado
  while (MUS.next < now + .6) {
    CAP = []; try { sg.play(MUS.bar % sg.bars, MUS.next, q); } catch (e) {}
    MUS.ev.push(...CAP); CAP = null;
    MUS.next += 16 * q; MUS.bar++;
  }
  const due = MUS.ev.filter(e => e[0] < now + .25); MUS.ev = MUS.ev.filter(e => e[0] >= now + .25);
  due.forEach(e => { if (e[0] >= now - .02) try { e[1](); } catch (x) {} });
}

export function setMute(m) {
  muted = m; try { localStorage.setItem('noc_mute', m ? '1' : '0'); } catch (e) {}
  if (MASTER) MASTER.gain.setTargetAtTime(m ? 0 : .9, AC.currentTime, .05);
  if (!m && AC && MUS.cur && !MUS.timer) { const c = MUS.cur; MUS.cur = null; music(c); }
  if (m) stopMusic();
  document.querySelectorAll('#sndT,#sndG,#sndP').forEach(b => b.textContent = 'SOM: ' + (m ? 'OFF' : 'ON'));
  document.querySelectorAll('#sndM').forEach(b => b.style.opacity = m ? .4 : 1);
}
export const isMuted = () => muted;

// Rosnado grave por baixo da fala do Z3R0: a voz do navegador não passa pelo Web Audio,
// então o peso vem de um subgrave distorcido que liga no início da fala e desliga no fim.
let ZD = null;
export function zDrone(on) {
  if (!AC || muted) return;
  const t = AC.currentTime;
  if (!on) { if (ZD) { ZD.g.gain.setTargetAtTime(.0001, t, .12); const z = ZD; setTimeout(() => z.o.forEach(o => { try { o.stop(); } catch (e) {} }), 600); ZD = null; } return; }
  if (ZD) return;
  const g = AC.createGain(), lp = AC.createBiquadFilter(), ws = AC.createWaveShaper(), cv = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 3); }
  ws.curve = cv; lp.type = 'lowpass'; lp.frequency.value = 220; lp.Q.value = 4;
  const o = [41, 43.5, 82].map((f, i) => { const x = AC.createOscillator(); x.type = i < 2 ? 'sawtooth' : 'square'; x.frequency.value = f; x.connect(ws); x.start(t); return x; });
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 60; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t); o.push(lfo);
  ws.connect(lp); lp.connect(g); g.connect(SFXG); g.connect(DLY);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.16, t + .25);
  ZD = { g, o };
}
