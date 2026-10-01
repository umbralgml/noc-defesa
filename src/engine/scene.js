// Cenas em SVG (NOC, rack, firewall, sala de guerra, servidor), herói animado, avatares e mídias de cabo.
import { $ } from './util.js';

// ---------- avatars ----------
export const AV_ME = `<svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#12324a"/><path d="M11 64c2-12 10-18 21-18s19 6 21 18z" fill="#00a884"/><path d="M26 46l6 7 6-7" fill="#0b6e57"/><rect x="38" y="53" width="8" height="6" rx="1" fill="#e6f1ff"/><circle cx="32" cy="29" r="12" fill="#d9a77f"/><path d="M20 27c0-9 6-14 12-14s12 5 12 13c-3-4-8-6-12-6s-9 2-12 7z" fill="#2b1d14"/><rect x="24" y="26.5" width="7" height="5" rx="1.6" fill="rgba(160,220,255,.25)" stroke="#0b1220" stroke-width="1.4"/><rect x="33" y="26.5" width="7" height="5" rx="1.6" fill="rgba(160,220,255,.25)" stroke="#0b1220" stroke-width="1.4"/><path d="M31 28.5h2" stroke="#0b1220" stroke-width="1.4"/><path d="M28.5 35.5q3.5 2.5 7 0" stroke="#7a4a33" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M19 30a13 13 0 0 1 26 0" fill="none" stroke="#1b2a44" stroke-width="3"/><rect x="16" y="27" width="5" height="9" rx="2" fill="#1b2a44"/><rect x="43" y="27" width="5" height="9" rx="2" fill="#1b2a44"/><path d="M19 35c0 5 4 8 9 8" stroke="#1b2a44" stroke-width="2" fill="none"/><circle cx="29" cy="43" r="2.2" fill="#00e0a8"/></svg>`;
export const AV_Z = `<svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#2a0d18"/><path d="M8 64c0-22 9-42 24-46 15 4 24 24 24 46z" fill="#12050a"/><path d="M14 64c1-16 8-30 18-33 10 3 17 17 18 33z" fill="#1f0a12"/><ellipse cx="32" cy="35" rx="11" ry="13" fill="#e8e8ee"/><path d="M23 31l7 2.5-7 2.5z" fill="#ff2e63"/><path d="M41 31l-7 2.5 7 2.5z" fill="#ff2e63"/><path d="M26 42q6 4 12 0" stroke="#12050a" stroke-width="1.6" fill="none"/><path d="M28 44v2M32 45v2M36 44v2" stroke="#12050a" stroke-width="1.2"/></svg>`;

// ---------- scenes ----------
const HERO = `<g class="hero" id="hero"><g class="bob">
<ellipse cx="0" cy="0" rx="11" ry="2" fill="rgba(0,0,0,.4)"/>
<g class="legL"><rect x="-6" y="-22" width="5.5" height="21" rx="2" fill="#1b2a44"/><rect x="-7" y="-3" width="8.5" height="3" rx="1.5" fill="#05080f"/></g>
<g class="legR"><rect x="0.5" y="-22" width="5.5" height="21" rx="2" fill="#243556"/><rect x="0.5" y="-3" width="8.5" height="3" rx="1.5" fill="#05080f"/></g>
<g class="armL"><rect x="-12" y="-43" width="4.5" height="17" rx="2.2" fill="#008f70"/><circle cx="-9.8" cy="-25" r="2.4" fill="#d9a77f"/></g>
<rect x="-9" y="-45" width="18" height="25" rx="5" fill="#00a884"/>
<path d="M-4 -45 L0 -40 L4 -45" fill="#0b6e57"/>
<rect x="2.5" y="-37" width="5" height="4" rx=".6" fill="#e6f1ff"/>
<g class="armR"><rect x="7.5" y="-43" width="4.5" height="17" rx="2.2" fill="#00a884"/><circle cx="9.8" cy="-25" r="2.4" fill="#d9a77f"/></g>
<rect x="-2.5" y="-49" width="5" height="4" fill="#d9a77f"/>
<circle cx="0" cy="-55" r="8" fill="#d9a77f"/>
<path d="M-8 -56 C-8 -64 -2 -66 2 -65 C6 -64 9 -61 8 -56 C5 -60 0 -60 -8 -56Z" fill="#2b1d14"/>
<rect x="1.5" y="-57.5" width="5.5" height="3.6" rx="1" fill="rgba(160,220,255,.35)" stroke="#0b1220" stroke-width=".9"/>
<path d="M-8.5 -55 A8.6 8.6 0 0 1 8.2 -58.5" stroke="#1b2a44" stroke-width="1.8" fill="none"/>
<rect x="-10.2" y="-58" width="3.6" height="6.5" rx="1.5" fill="#1b2a44"/>
<path d="M-7 -52 C-6 -48 -1 -47 3 -48" stroke="#1b2a44" stroke-width="1.1" fill="none"/><circle cx="3.6" cy="-48" r="1.2" fill="#00e0a8"/>
</g></g>`;
const led = (x, y, c, d, cls = 'led') => `<circle class="${cls}" style="animation-delay:${d.toFixed(2)}s" cx="${x}" cy="${y}" r="1.3" fill="${c}"/>`;
function lines(id, x, y, w, h, c) {
  let s = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})"><g class="scroll">`;
  const n = Math.ceil(h / 4) + 7;
  for (let i = 0; i < n; i++) s += `<rect x="${x + 2}" y="${y + 2 + i * 4}" width="${((w - 4) * (0.3 + ((i * 37) % 60) / 100)).toFixed(1)}" height="1.5" fill="${i % 5 === 3 ? '#ffd166' : c}" opacity="${(0.5 + ((i * 13) % 5) / 10).toFixed(1)}"/>`;
  return s + '</g></g>';
}
function bgS() {
  let s = `<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1426"/><stop offset="1" stop-color="#101f38"/></linearGradient></defs>
  <rect width="400" height="120" fill="url(#wg)"/>
  <rect x="0" y="14" width="400" height="3" fill="#15223a"/>
  <rect class="lamp" x="40" y="0" width="70" height="4" fill="#9fe8d5"/><rect class="lamp" x="190" y="0" width="70" height="4" fill="#9fe8d5" style="animation-delay:1.3s"/>
  <text x="128" y="42" font-family="Orbitron,monospace" font-size="11" font-weight="800" fill="#00e0a8" opacity=".35" letter-spacing="3">NOC</text>
  <rect x="0" y="104" width="400" height="16" fill="#0a1120"/><path d="M0 104H400" stroke="#1e2d48"/>`;
  for (let x = 0; x <= 400; x += 40) s += `<path d="M${x} 104L${x * 1.08 - 16} 120" stroke="#15223a"/>`;
  [12, 58].forEach((x, k) => {
    s += `<rect x="${x}" y="36" width="40" height="68" rx="2" fill="#0d182b" stroke="#182640"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${x + 4}" y="${40 + i * 10.5}" width="32" height="7" fill="#0a1322"/>` + led(x + 8, 43.5 + i * 10.5, i % 2 ? '#00e0a8' : '#4dd2ff', (i * .3 + k) % 1.3);
  });
  return s;
}
function rackS(x, loose) {
  let s = `<rect x="${x}" y="22" width="66" height="84" rx="3" fill="#121d31" stroke="#2c3d5c"/><rect x="${x + 3}" y="25" width="60" height="78" fill="#0c1628"/>`;
  for (let i = 0; i < 7; i++) {
    const y = 28 + i * 10.8;
    s += `<rect x="${x + 6}" y="${y}" width="54" height="8.5" rx="1" fill="#16233a" stroke="#223350" stroke-width=".5"/>`;
    for (let j = 0; j < 4; j++) s += led(x + 10 + j * 4, y + 4.2, (i + j) % 3 ? '#00e0a8' : '#4dd2ff', ((i * 4 + j) * .17) % 1.3);
    for (let j = 0; j < 5; j++) s += `<rect x="${x + 30 + j * 5.5}" y="${y + 2.2}" width="4" height="4" fill="#070d18"/>`;
  }
  ['#ffd400', '#33d6c9', '#3d8bff', '#7ee06a', '#a6b1c6'].forEach((c, k) => {
    const sx = x + 32 + k * 5.5, sy = 32 + k * 12;
    s += loose
      ? `<path d="M${sx} ${sy} C${sx - 4} ${sy + 34} ${x - 14 + k * 9} 96 ${x - 26 + k * 11} 104" stroke="${c}" stroke-width="1.6" fill="none"/><rect x="${x - 29 + k * 11}" y="101" width="5" height="3" fill="${c}"/>`
      : `<path d="M${sx} ${sy} C${sx + 12} ${sy + 18} ${x + 72} ${sy + 24} ${x + 70} ${sy + 44}" stroke="${c}" stroke-width="1.4" fill="none"/>`;
  });
  return s;
}
function deskS(x, id) {
  return `<rect x="${x}" y="82" width="100" height="4" rx="1" fill="#2a3b58"/><rect x="${x + 6}" y="86" width="3" height="18" fill="#1b2840"/><rect x="${x + 91}" y="86" width="3" height="18" fill="#1b2840"/>
  <rect x="${x + 22}" y="46" width="60" height="34" rx="2" fill="#050a12" stroke="#3a4d6e"/>${lines(id, x + 24, 48, 56, 30, '#00e0a8')}
  <rect x="${x + 49}" y="80" width="6" height="2" fill="#3a4d6e"/><rect x="${x + 26}" y="79" width="32" height="3" rx="1" fill="#34476a"/>
  <rect x="${x + 84}" y="74" width="6" height="8" rx="1" fill="#ff7a45"/><path d="M${x + 90} 76 q3 2 0 4" stroke="#ff7a45" fill="none"/>`;
}
function fwS(x, id) {
  let s = `<rect x="${x}" y="80" width="40" height="3" fill="#2a3b58"/><rect x="${x + 18}" y="83" width="4" height="20" fill="#1b2840"/><rect x="${x + 8}" y="102" width="24" height="2" fill="#1b2840"/>
  <rect x="${x + 6}" y="58" width="30" height="20" rx="1.5" fill="#050a12" stroke="#3a4d6e"/>${lines(id, x + 7, 59, 28, 18, '#ffb020')}<rect x="${x + 3}" y="78" width="36" height="2" rx="1" fill="#3a4d6e"/>
  <rect x="${x + 58}" y="26" width="64" height="80" rx="3" fill="#121d31" stroke="#2c3d5c"/>
  <rect x="${x + 62}" y="34" width="56" height="20" rx="1.5" fill="#2a1410" stroke="#ff7a45"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += `<rect x="${x + 64 + c * 7 + (r % 2 ? 3.5 : 0)}" y="${36 + r * 5.5}" width="6" height="4.5" fill="#ff7a45" opacity=".75"/>`;
  s += `<text x="${x + 100}" y="47" font-family="Orbitron,monospace" font-size="7" font-weight="800" fill="#ffb020">FW</text>`;
  for (let i = 0; i < 4; i++) { const y = 60 + i * 10.5; s += `<rect x="${x + 62}" y="${y}" width="56" height="8" fill="#16233a"/>` + led(x + 66, y + 4, '#ffb020', i * .3) + led(x + 70, y + 4, '#00e0a8', i * .2 + .4); }
  s += `<path d="M${x + 36} 70 C${x + 48} 72 ${x + 52} 50 ${x + 62} 48" stroke="#4dd2ff" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>`;
  return s;
}
function warS(boss, id) {
  let s = `<rect class="scrframe" x="200" y="20" width="190" height="62" rx="3" fill="${boss ? '#1a0610' : '#050a12'}" stroke="${boss ? '#ff2e63' : '#2c3d5c'}" stroke-width="1.5"/>`;
  if (boss) {
    s += `<g class="glitch"><path d="M318 82 C318 50 330 30 350 28 C370 30 382 50 382 82Z" fill="#12050a"/><ellipse cx="350" cy="52" rx="14" ry="18" fill="#e8e8ee"/><path d="M338 46l9 3.5-9 3.5z" fill="#ff2e63"/><path d="M362 46l-9 3.5 9 3.5z" fill="#ff2e63"/><path d="M344 62q6 4 12 0" stroke="#1a0610" stroke-width="2" fill="none"/>
    <text x="210" y="34" font-family="Orbitron,monospace" font-size="9" font-weight="800" fill="#ff2e63" class="led">Z3R0</text><text x="208" y="44" font-family="JetBrains Mono,monospace" font-size="6" fill="#ff2e63">pwned.exe</text></g>
    <g class="zdef"><rect x="201" y="21" width="188" height="60" rx="2" fill="#04150f"/><text x="208" y="34" font-family="Orbitron,monospace" font-size="7" font-weight="800" fill="#00e0a8">THREAT NEUTRALIZED</text>
    <text x="345" y="46" text-anchor="middle" font-family="Orbitron,monospace" font-size="9" font-weight="800" fill="#00e0a8">Z3R0 OFFLINE</text>
    <text x="345" y="58" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.5" fill="#9fe8d5">C2 em blackhole</text>
    <text x="345" y="67" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.5" fill="#9fe8d5">65535:666</text></g>`;
  } else {
    let p = '', q = '';
    for (let i = 0; i <= 18; i++) { p += `${206 + i * 10},${70 - (12 + ((i * 7) % 11) + (i > 11 ? 20 + (i % 3) * 6 : 0))} `; q += `${206 + i * 10},${72 - (6 + ((i * 5) % 7))} `; }
    s += `<polyline class="graph" points="${p}" fill="none" stroke="#ff4d6d" stroke-width="1.6"/><polyline points="${q}" fill="none" stroke="#00e0a8" stroke-width="1.2"/>
    <text x="208" y="31" font-family="Orbitron,monospace" font-size="7" font-weight="800" fill="#ff4d6d" class="led">DDoS 80 Gbps</text>`;
  }
  s += deskS(215, id);
  return s;
}
function srvS(x, id) {
  let s = `<rect x="${x}" y="80" width="40" height="3" fill="#2a3b58"/><rect x="${x + 18}" y="83" width="4" height="20" fill="#1b2840"/><rect x="${x + 8}" y="102" width="24" height="2" fill="#1b2840"/>
  <rect x="${x + 6}" y="58" width="30" height="20" rx="1.5" fill="#050a12" stroke="#3a4d6e"/>${lines(id, x + 7, 59, 28, 18, '#ff7ad9')}<rect x="${x + 3}" y="78" width="36" height="2" rx="1" fill="#3a4d6e"/>
  <rect x="${x + 58}" y="24" width="64" height="82" rx="3" fill="#121d31" stroke="#2c3d5c"/>`;
  for (let i = 0; i < 7; i++) { const y = 29 + i * 10.8; s += `<rect x="${x + 62}" y="${y}" width="56" height="8.5" fill="#16233a"/>` + led(x + 66, y + 4.2, i === 3 ? '#ff2e63' : '#00e0a8', i * .2, i === 3 ? 'redled' : 'led') + `<rect x="${x + 74}" y="${y + 3}" width="30" height="2.5" fill="#0a1322"/>`; }
  s += `<path d="M${x + 110} 8 l7 12 h-14z" fill="#ff2e63" class="redled"/><text x="${x + 108.6}" y="18.5" font-size="8" font-weight="800" fill="#1a0610">!</text>`;
  return s;
}
export const HX = { rack: 272, desk: 252, firewall: 252, war: 206, server: 252 };
export const LOCNAME = { rack: 'RACK · DATACENTER', desk: 'TERMINAL DO NOC', firewall: 'CONSOLE DO FIREWALL', war: 'SALA DE GUERRA', server: 'SERVIDOR COMPROMETIDO' };
export function sceneSVG(loc, boss, loose) {
  let s = `<svg viewBox="0 0 400 120" preserveAspectRatio="xMaxYMax slice">` + bgS();
  if (loc === 'rack') s += rackS(300, loose);
  if (loc === 'desk') s += deskS(262, 'sc1');
  if (loc === 'firewall') s += fwS(262, 'sc1');
  if (loc === 'war') s += warS(boss, 'sc1');
  if (loc === 'server') s += srvS(262, 'sc1');
  return s + HERO + '</svg>';
}
// ---------- sala do NOC (mapa explorável) ----------
// Estações: onde cada equipamento é desenhado (x), onde o herói para (stand) e a área de toque.
export const ROOM_W = 910;
export const STATIONS = [
  { loc: 'rack', name: 'RACK', x: 60, stand: 34, x1: 20, x2: 130 },
  { loc: 'server', name: 'SERVIDOR', x: 190, stand: 178, x1: 160, x2: 316 },
  { loc: 'desk', name: 'TERMINAL', x: 360, stand: 348, x1: 330, x2: 464 },
  { loc: 'firewall', name: 'FIREWALL', x: 520, stand: 508, x1: 490, x2: 646 },
  { loc: 'war', name: 'TELÃO', x: 700, stand: 706, x1: 680, x2: 900 }
];
export function roomSVG() {
  let s = `<svg viewBox="0 0 ${ROOM_W} 120" preserveAspectRatio="xMinYMax meet" class="roomsvg" role="img" aria-label="Sala do NOC">`;
  // fundo: três faixas do cenário padrão lado a lado
  for (let k = 0; k < 3; k++) s += `<g transform="translate(${k * 400},0)">${bgS()}</g>`;
  const st = Object.fromEntries(STATIONS.map(t => [t.loc, t]));
  s += rackS(st.rack.x, false) + srvS(st.server.x, 'rm1') + deskS(st.desk.x, 'rm2') + fwS(st.firewall.x, 'rm3');
  s += `<g transform="translate(${st.war.x - 200},0)">${warS(false, 'rm4')}</g>`;
  // placas e áreas de toque
  STATIONS.forEach(t => {
    const cx = (t.x1 + t.x2) / 2;
    s += `<g class="stn" data-loc="${t.loc}" tabindex="0" role="button" aria-label="${t.name}">
      <rect class="stnhit" x="${t.x1}" y="0" width="${t.x2 - t.x1}" height="100" fill="transparent"/>
      <g class="stntag" transform="translate(${cx},16)"><rect x="-34" y="-8" width="68" height="13" rx="6.5" fill="#070d18" stroke="#2c3d5c"/>
      <text y="1.6" text-anchor="middle" font-family="Orbitron,monospace" font-size="6.4" font-weight="800" fill="#c9d6ea" letter-spacing=".6">${t.name}</text>
      <text class="stncnt" y="1.6" x="40" font-family="JetBrains Mono,monospace" font-size="6" fill="#8a9bb8"></text></g>
      <g class="stnalert" transform="translate(${cx},34)"><circle r="7" fill="#ff2e63"/><text y="2.8" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff">!</text></g>
    </g>`;
  });
  return s + `<g class="rhero">${HERO}</g></svg>`;
}

export function heroTo(sc, x, instant) {
  const h = sc.querySelector('.hero');
  if (instant) { h.style.transition = 'none'; h.style.transform = `translate(${x}px,106px)`; h.getBoundingClientRect(); h.style.transition = ''; }
  else h.style.transform = `translate(${x}px,106px)`;
}
export function heroState(cls, ms) {
  const h = $('scene').querySelector('.hero'); if (!h) return;
  h.classList.remove('hit', 'happy'); void h.getBBox;
  h.classList.add(cls);
  setTimeout(() => h.classList.remove(cls), ms || 500);
}
export function sceneFx(cls, ms) {
  const sc = $('scene'); sc.classList.remove('alarm', 'okf'); void sc.offsetWidth; sc.classList.add(cls);
  clearTimeout(sceneFx.t); sceneFx.t = setTimeout(() => sc.classList.remove(cls), ms);
}

// ---------- media ----------
export const MEDIA = {
  sm: { c: '#ffd400', n: 'Fibra monomodo OS2', ico: 'sfp' },
  mm: { c: '#33d6c9', n: 'Fibra multimodo OM4', ico: 'sfp' },
  dac: { c: '#a6b1c6', n: 'Cabo DAC twinax', ico: 'sfp' },
  cu: { c: '#3d8bff', n: 'Cabo de rede Cat6', ico: 'rj45' },
  pon: { c: '#7ee06a', n: 'Fibra GPON SC/APC', ico: 'sc' }
};
export function icon(type, c) {
  c = c || '#6b7c99';
  if (type === 'sfp') return `<svg viewBox="0 0 30 19"><rect x="1" y="2" width="28" height="15" rx="2" fill="#0b1220" stroke="#6b7c99"/><rect x="5" y="5.5" width="9" height="8" rx="1" fill="#1d2b44"/><rect x="16" y="5.5" width="9" height="8" rx="1" fill="#1d2b44"/><rect x="1" y="2" width="3" height="15" fill="${c}"/></svg>`;
  if (type === 'rj45') return `<svg viewBox="0 0 30 19"><rect x="5" y="1" width="20" height="17" rx="2" fill="#0b1220" stroke="#6b7c99"/><rect x="8.5" y="4" width="13" height="9" fill="#1d2b44"/><rect x="12" y="13" width="6" height="3" fill="#1d2b44"/><path d="M10 5.5h10" stroke="#d4b24a" stroke-width="1.6" stroke-dasharray="1 .8"/><rect x="5" y="1" width="3" height="17" fill="${c}"/></svg>`;
  if (type === 'sc') return `<svg viewBox="0 0 30 19"><rect x="7" y="1" width="16" height="17" rx="2" fill="${c === '#6b7c99' ? '#3b5c36' : c}" stroke="#6b7c99"/><rect x="11" y="5" width="8" height="9" rx="1" fill="#0b1220"/><circle cx="15" cy="9.5" r="1.6" fill="#d7e3f5"/></svg>`;
  return '';
}

// Texto do botão "IR PARA ..." no briefing, por local.
export const GOTO = { war: 'A SALA', desk: 'O TERMINAL', server: 'O SERVIDOR', firewall: 'O FIREWALL', rack: 'O RACK' };
