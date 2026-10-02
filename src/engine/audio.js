// Som 100% sintetizado com Web Audio: efeitos (sfx) e um sequenciador de música simples.
// Nada é tocado antes de au() ser chamado num gesto do usuário (política de autoplay).

let AC = null, MASTER, MUSG, SFXG, DLY, muted = false;
try { muted = localStorage.getItem('noc_mute') === '1'; } catch (e) {}
export function au() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      MASTER = AC.createGain(); MASTER.gain.value = muted ? 0 : 0.9;
      MASTER.connect(comp); comp.connect(AC.destination);
      MUSG = AC.createGain(); MUSG.gain.value = 0.32; MUSG.connect(MASTER);
      SFXG = AC.createGain(); SFXG.gain.value = 1; SFXG.connect(MASTER);
      DLY = AC.createDelay(); DLY.delayTime.value = 0.19;
      const fb = AC.createGain(); fb.gain.value = 0.32; const wet = AC.createGain(); wet.gain.value = 0.3;
      DLY.connect(fb); fb.connect(DLY); DLY.connect(wet); wet.connect(MASTER);
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
  siren() { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(950, t + .35); o.frequency.linearRampToValueAtTime(600, t + .7); g.gain.setValueAtTime(.04, t); g.gain.exponentialRampToValueAtTime(.0001, t + .75); o.connect(g); g.connect(SFXG); o.start(t); o.stop(t + .8); }
};

// ---------- music (sequencer) ----------
const SONGS = {
  menu: { bpm: 96, prog: [[45, 0], [41, 1], [48, 1], [43, 1]], lead: false, hat: 2, snare: false },
  play: { bpm: 116, prog: [[45, 0], [41, 1], [43, 1], [40, 0]], lead: false, hat: 1, snare: true },
  boss: { bpm: 144, prog: [[38, 0], [46, 1], [43, 0], [45, 1]], lead: true, hat: 1, snare: true }
};
const LEADB = [0, null, 7, null, 12, 10, 7, null, 3, null, 5, 7, null, 3, 2, null];
export const MUS = { cur: null, step: 0, next: 0, timer: null };
export function music(name) {
  if (MUS.cur === name && MUS.timer) return;
  MUS.cur = name;
  if (!AC || muted) return;
  if (!MUS.timer) { MUS.next = AC.currentTime + .08; MUS.step = 0; MUS.timer = setInterval(schedule, 25); }
}
export function stopMusic() { clearInterval(MUS.timer); MUS.timer = null; }
function schedule() {
  const sg = SONGS[MUS.cur]; if (!sg || !AC) return;
  const sd = 60 / sg.bpm / 4;
  while (MUS.next < AC.currentTime + .15) {
    const s = MUS.step, t = MUS.next, bar = (s >> 4) % 4, st = s % 16, ch = sg.prog[bar], root = ch[0], third = ch[1] ? 4 : 3;
    if (st % 4 === 0) kick(t, MUS.cur === 'boss' ? .55 : .4);
    if (sg.snare && (st === 4 || st === 12)) noise(.14, { v: .16, type: 'bandpass', f: 1800, q: .8, at: t, bus: MUSG });
    if (st % sg.hat === 0 && st % 4 !== 0) noise(.04, { v: st % 2 ? .05 : .08, f: 8000, at: t, bus: MUSG });
    if (st % 2 === 0) osc(mtof(root + (st % 8 === 6 ? 12 : 0)), sd * 1.8, { type: 'sawtooth', v: .1, at: t, bus: MUSG, det: MUS.cur === 'boss' ? 8 : 0 });
    const arp = [0, third, 7, 12][st % 4] + 24 + (st >= 8 ? 12 : 0);
    osc(mtof(root + arp), sd * .9, { type: 'triangle', v: .05, at: t, bus: MUSG, echo: true });
    if (sg.lead && LEADB[st] !== null && bar % 2 === 1) osc(mtof(root + 24 + LEADB[st]), sd * 1.6, { type: 'square', v: .035, at: t, bus: MUSG, echo: true });
    if (st === 0) osc(mtof(root + 12 + third), sd * 15, { type: 'sine', v: .04, at: t, bus: MUSG, att: .3 });
    MUS.next += sd; MUS.step = (MUS.step + 1) % 64;
  }
}
export function setMute(m) {
  muted = m; try { localStorage.setItem('noc_mute', m ? '1' : '0'); } catch (e) {}
  if (MASTER) MASTER.gain.setTargetAtTime(m ? 0 : .9, AC.currentTime, .05);
  if (!m && AC && MUS.cur && !MUS.timer) { const c = MUS.cur; MUS.cur = null; music(c); }
  if (m) stopMusic();
  document.querySelectorAll('#sndT,#sndG').forEach(b => b.textContent = 'SOM: ' + (m ? 'OFF' : 'ON'));
  document.querySelectorAll('#sndM').forEach(b => b.style.opacity = m ? .4 : 1);
}
export const isMuted = () => muted;
