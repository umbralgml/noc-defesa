// Cenas em SVG (NOC, rack, firewall, sala de guerra, servidor), herói animado, avatares e mídias de cabo.
import { $, store } from './util.js';
import { t } from './i18n.js';

// ---------- avatars ----------
export const AV_ME = `<svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#12324a"/><path d="M11 64c2-12 10-18 21-18s19 6 21 18z" style="fill:var(--hs,#00a884)"/><path d="M26 46l6 7 6-7" style="fill:var(--hs3,#0b6e57)"/><rect x="38" y="53" width="8" height="6" rx="1" fill="#e6f1ff"/><circle cx="32" cy="29" r="12" style="fill:var(--hk,#d9a77f)"/><path d="M20 27c0-9 6-14 12-14s12 5 12 13c-3-4-8-6-12-6s-9 2-12 7z" style="fill:var(--hh,#2b1d14)"/><rect x="24" y="26.5" width="7" height="5" rx="1.6" fill="rgba(160,220,255,.25)" stroke="#0b1220" stroke-width="1.4"/><rect x="33" y="26.5" width="7" height="5" rx="1.6" fill="rgba(160,220,255,.25)" stroke="#0b1220" stroke-width="1.4"/><path d="M31 28.5h2" stroke="#0b1220" stroke-width="1.4"/><path d="M28.5 35.5q3.5 2.5 7 0" stroke="#7a4a33" stroke-width="1.5" fill="none" stroke-linecap="round"/><g class="hset"><path d="M19 30a13 13 0 0 1 26 0" fill="none" stroke="#1b2a44" stroke-width="3"/><rect x="16" y="27" width="5" height="9" rx="2" fill="#1b2a44"/><rect x="43" y="27" width="5" height="9" rx="2" fill="#1b2a44"/><path d="M19 35c0 5 4 8 9 8" stroke="#1b2a44" stroke-width="2" fill="none"/><circle cx="29" cy="43" r="2.2" fill="#00e0a8"/></g></svg>`;
export const AV_Z = `<svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#2a0d18"/><path d="M8 64c0-22 9-42 24-46 15 4 24 24 24 46z" fill="#12050a"/><path d="M14 64c1-16 8-30 18-33 10 3 17 17 18 33z" fill="#1f0a12"/><ellipse cx="32" cy="35" rx="11" ry="13" fill="#e8e8ee"/><path d="M23 31l7 2.5-7 2.5z" fill="#ff2e63"/><path d="M41 31l-7 2.5 7 2.5z" fill="#ff2e63"/><path d="M26 42q6 4 12 0" stroke="#12050a" stroke-width="1.6" fill="none"/><path d="M28 44v2M32 45v2M36 44v2" stroke="#12050a" stroke-width="1.2"/></svg>`;

export const AV_CHEFE = `<svg viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#2b2547"/><path d="M10 64c2-13 10-19 22-19s20 6 22 19z" fill="#3a4d6e"/><path d="M27 45l5 8 5-8z" fill="#e6f1ff"/><path d="M31 47h2l1 9-2 3-2-3z" fill="#ff7a45"/><circle cx="32" cy="29" r="12" fill="#c98f6a"/><path d="M20 27c0-8 5-13 12-13s12 5 12 12c-2-3-6-5-12-5s-10 2-12 6z" fill="#b8c2d6"/><circle cx="27.5" cy="29" r="3.2" fill="none" stroke="#0b1220" stroke-width="1.3"/><circle cx="36.5" cy="29" r="3.2" fill="none" stroke="#0b1220" stroke-width="1.3"/><path d="M30.7 29h2.6" stroke="#0b1220" stroke-width="1.3"/><path d="M28 36q4 2.5 8 0" stroke="#7a4a33" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;

// ---------- scenes ----------
// Analista: formas lisas, sombra lateral e luz de contorno. As cores vêm das variáveis do vestiário (prefs.js).
const HERO = `<g class="hero" id="hero"><g class="bob">
<ellipse cx="0" cy="0" rx="12" ry="2.2" fill="rgba(0,0,0,.45)"/><ellipse cx="0" cy="0" rx="7" ry="1.2" fill="rgba(0,224,168,.18)"/>
<g class="legL"><path d="M-6.2 -22 h5.6 l-.4 19.5 h-4.6z" fill="#16233a"/><path d="M-7.4 -3 h7.2 q1 0 1 1.4 v1.6 h-8.6 q-.4-3 .4-3z" fill="#04070d"/></g>
<g class="legR"><path d="M.6 -22 h5.6 l-.2 19.5 h-4.8z" fill="#1d2d4a"/><path d="M.8 -3 h7.2 q1 0 1 1.4 v1.6 h-8.4z" fill="#04070d"/><path d="M1 -1.2 h7.6" stroke="#00e0a8" stroke-width=".5" opacity=".6"/></g>
<g class="armL"><rect x="-12.4" y="-43.5" width="4.6" height="17.5" rx="2.3" style="fill:var(--hs2,#008f70)"/><circle cx="-10.1" cy="-25" r="2.3" style="fill:var(--hk,#d9a77f)"/></g>
<path d="M-9.6 -43.6 Q-9.6 -46.4 -6.4 -46.6 H6.4 Q9.6 -46.4 9.6 -43.6 L9.8 -21.6 Q9.8 -19.6 7.8 -19.6 H-7.8 Q-9.8 -19.6 -9.8 -21.6Z" style="fill:var(--hs,#00a884)"/>
<path d="M2 -46.6 H6.4 Q9.6 -46.4 9.6 -43.6 L9.8 -21.6 Q9.8 -19.6 7.8 -19.6 H3z" fill="rgba(0,0,0,.2)"/>
<path d="M-9.6 -43.6 L-9.8 -21.6" stroke="rgba(255,255,255,.25)" stroke-width=".7"/>
<path d="M-4 -46.6 L0 -41.5 L4 -46.6" style="fill:var(--hs3,#0b6e57)"/>
<rect x="2.6" y="-37.5" width="4.6" height="5.6" rx=".8" fill="#e6f1ff"/><rect x="3.3" y="-36.6" width="3.2" height="1" fill="#00a884"/>
<g class="armR"><rect x="7.8" y="-43.5" width="4.6" height="17.5" rx="2.3" style="fill:var(--hs,#00a884)"/><circle cx="10.1" cy="-25" r="2.3" style="fill:var(--hk,#d9a77f)"/></g>
<rect x="-2.4" y="-49.6" width="4.8" height="4" rx="1" style="fill:var(--hk,#d9a77f)"/>
<ellipse cx="0" cy="-55.4" rx="7.6" ry="8.2" style="fill:var(--hk,#d9a77f)"/>
<path d="M3 -63 Q7.6 -61 7.6 -55.4 Q7.6 -50 3 -47.6 Q6 -52 6 -55.4 Q6 -59.6 3 -63z" fill="rgba(0,0,0,.12)"/>
<path d="M-8 -55.4 C-8.4 -64 -2.4 -66.4 1.6 -65.6 C6.4 -64.8 9 -61.6 8 -56.4 C6 -59.8 1.6 -60.6 -2.4 -59.6 C-5 -59 -6.6 -57.6 -8 -55.4Z" style="fill:var(--hh,#2b1d14)"/>
<rect x="1.4" y="-57.4" width="5.4" height="3.2" rx="1.2" fill="rgba(160,220,255,.22)" stroke="rgba(11,18,32,.8)" stroke-width=".7"/>
<g class="hset"><path d="M-8.5 -55 A8.6 8.6 0 0 1 8.2 -58.5" stroke="#14233a" stroke-width="1.8" fill="none"/>
<rect x="-10.2" y="-58" width="3.6" height="6.5" rx="1.6" fill="#14233a"/>
<path d="M-7 -52 C-6 -48 -1 -47 3 -48" stroke="#14233a" stroke-width="1.1" fill="none"/><circle cx="3.6" cy="-48" r="1.2" fill="#00e0a8"/></g>
<g class="hcap"><path d="M-8.8 -57 C-8.6 -66.5 8.6 -66.5 8.8 -57 Z" style="fill:var(--hs,#00a884)"/><rect x="3" y="-58.6" width="9" height="2.4" rx="1.1" style="fill:var(--hs3,#0b6e57)"/></g>
</g></g>`;
const led = (x, y, c, d, cls = 'led') => `<circle class="${cls}" style="animation-delay:${d.toFixed(2)}s" cx="${x}" cy="${y}" r="1.3" fill="${c}"/>`;
function lines(id, x, y, w, h, c) {
  let s = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})"><g class="scroll">`;
  const n = Math.ceil(h / 4) + 7;
  for (let i = 0; i < n; i++) s += `<rect x="${x + 2}" y="${y + 2 + i * 4}" width="${((w - 4) * (0.3 + ((i * 37) % 60) / 100)).toFixed(1)}" height="1.5" fill="${i % 5 === 3 ? '#ffd166' : c}" opacity="${(0.5 + ((i * 13) % 5) / 10).toFixed(1)}"/>`;
  return s + '</g></g>';
}
// Visual v1.27: fundo escuro com brilho, chão com reflexo em perspectiva, equipamentos em vidro escuro com luz de status.
const G = `<defs>
  <linearGradient id="sgBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040913"/><stop offset=".75" stop-color="#0b1730"/><stop offset="1" stop-color="#060c18"/></linearGradient>
  <radialGradient id="sgGlow" cx=".7" cy=".1" r=".7"><stop offset="0" stop-color="rgba(0,224,168,.16)"/><stop offset="1" stop-color="rgba(0,224,168,0)"/></radialGradient>
  <linearGradient id="sgFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1830"/><stop offset="1" stop-color="#03060c"/></linearGradient>
  <linearGradient id="sgBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16243d"/><stop offset="1" stop-color="#0a1222"/></linearGradient>
  <linearGradient id="sgGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset=".5" stop-color="rgba(160,220,255,.07)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></linearGradient>
  <linearGradient id="sgScr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071628"/><stop offset="1" stop-color="#040a14"/></linearGradient>
  <radialGradient id="sgSpill" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="rgba(77,210,255,.22)"/><stop offset="1" stop-color="rgba(77,210,255,0)"/></radialGradient>
</defs>`;
function bgS() {
  let s = G + `<rect width="400" height="120" fill="url(#sgBg)"/><rect width="400" height="120" fill="url(#sgGlow)"/>`;
  // teto: faixa de luz e trilho
  s += `<rect x="0" y="0" width="400" height="9" fill="#050a14"/><rect class="lamp" x="30" y="8" width="340" height="1.2" rx=".6" fill="#9fe8d5" opacity=".55"/>`;
  // parede: painéis com junta fina
  for (let x = 0; x <= 400; x += 50) s += `<path d="M${x} 9V104" stroke="rgba(120,190,255,.05)"/>`;
  // racks ao fundo em silhueta, com fita de LED vertical
  [14, 60].forEach((x, k) => {
    s += `<rect x="${x}" y="30" width="36" height="74" rx="2" fill="#081120" stroke="rgba(120,190,255,.1)" stroke-width=".6"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${x + 5}" y="${35 + i * 7.6}" width="22" height="1.2" rx=".6" fill="rgba(120,190,255,.12)"/>`;
    s += `<rect class="sg-strip" style="animation-delay:${k * .9}s" x="${x + 31}" y="34" width="1.6" height="66" rx=".8" fill="${k ? '#4dd2ff' : '#00e0a8'}"/>`;
  });
  // chão com reflexo e linhas de perspectiva
  s += `<rect x="0" y="104" width="400" height="16" fill="url(#sgFloor)"/><path d="M0 104H400" stroke="rgba(77,210,255,.22)" stroke-width=".6"/>`;
  for (let x = -40; x <= 440; x += 32) s += `<path d="M${x} 104L${x * 1.18 - 36} 120" stroke="rgba(77,210,255,.07)"/>`;
  return s;
}
const strip = (x, y, w, c, d = 0) => `<rect class="sg-strip" style="animation-delay:${d}s" x="${x}" y="${y}" width="${w}" height="1.4" rx=".7" fill="${c}"/>`;
const shine = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sgGlass)"/>`;
function rackS(x, loose) {
  let s = `<rect x="${x}" y="20" width="66" height="86" rx="3" fill="url(#sgBox)" stroke="rgba(120,190,255,.25)" stroke-width=".7"/>` + strip(x + 6, 23, 54, '#00e0a8');
  for (let i = 0; i < 7; i++) {
    const y = 28 + i * 10.8;
    s += `<rect x="${x + 5}" y="${y}" width="56" height="8.6" rx="1.2" fill="#0a1424" stroke="rgba(120,190,255,.14)" stroke-width=".5"/>`;
    for (let j = 0; j < 3; j++) s += led(x + 9 + j * 3.6, y + 4.3, (i + j) % 3 ? '#00e0a8' : '#4dd2ff', ((i * 4 + j) * .17) % 1.3);
    for (let j = 0; j < 6; j++) s += `<rect x="${x + 22 + j * 5.8}" y="${y + 2.4}" width="4.4" height="3.8" rx=".6" fill="#04080f" stroke="rgba(120,190,255,.12)" stroke-width=".4"/>`;
  }
  s += shine(x + 2, 22, 30, 82);
  ['#ffd400', '#33d6c9', '#3d8bff', '#7ee06a', '#a6b1c6'].forEach((c, k) => {
    const sx = x + 24 + k * 5.8, sy = 32 + k * 12;
    s += loose
      ? `<path d="M${sx} ${sy} C${sx - 4} ${sy + 34} ${x - 14 + k * 9} 96 ${x - 26 + k * 11} 104" stroke="${c}" stroke-width="1.5" fill="none" opacity=".9"/><rect x="${x - 29 + k * 11}" y="101" width="5" height="3" rx=".6" fill="${c}"/>`
      : `<path d="M${sx} ${sy} C${sx + 12} ${sy + 18} ${x + 72} ${sy + 24} ${x + 70} ${sy + 44}" stroke="${c}" stroke-width="1.2" fill="none" opacity=".75"/>`;
  });
  return s;
}
// Monitor fino com gráfico ou linhas de log e a luz da tela no tampo.
function screen(x, y, w, h, id, c, chart) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#03070e" stroke="rgba(120,190,255,.35)" stroke-width=".7"/><rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - 3}" rx="1.2" fill="url(#sgScr)"/>`;
  s += lines(id, x + 2, y + 2, w - 4, h - 4, c);
  if (chart) { let p = ''; for (let i = 0; i <= 10; i++) p += `${(x + 3 + i * (w - 6) / 10).toFixed(1)},${(y + h - 5 - ((i * 7) % 9) * (h - 12) / 9).toFixed(1)} `; s += `<polyline points="${p}" fill="none" stroke="${c}" stroke-width=".9" opacity=".9"/>`; }
  return s + shine(x, y, w * .5, h);
}
function deskS(x, id) {
  const ach = store('noc_ach') || {};
  let trophies = '';
  // Troféu do Prólogo: Alicate de crimpagem dourado
  if (ach.prologo) {
    trophies += `<g class="trophy-crimp" title="${t('Troféu: Alicate de Crimpar Dourado')}">
      <rect x="${x + 6}" y="79" width="10" height="2.5" rx="1" fill="#ffe8a3" stroke="#d49b00" stroke-width=".4"/>
      <rect x="${x + 8}" y="77" width="2" height="4" rx=".5" fill="#ffd166"/>
      <circle cx="${x + 13}" cy="80.2" r=".7" fill="#00e0a8"/>
    </g>`;
  }
  // Troféu Linux: Mascote Tux em pixel art
  if (ach.linux) {
    trophies += `<g class="trophy-tux" title="${t('Troféu: Pinguim Tux do NOC')}">
      <ellipse cx="${x + 18}" cy="77" rx="3.5" ry="4.5" fill="#080e18"/>
      <ellipse cx="${x + 18}" cy="77.5" rx="2.2" ry="3.2" fill="#f0f6fc"/>
      <circle cx="${x + 17}" cy="74.5" r=".5" fill="#fff"/>
      <circle cx="${x + 19}" cy="74.5" r=".5" fill="#fff"/>
      <polygon points="${x + 17.5},75.5 ${x + 18.5},75.5 ${x + 18},77" fill="#ffb800"/>
    </g>`;
  }
  // Troféu Z3R0: Máscara quebrada do chefe derrotado
  if (ach.chefe) {
    trophies += `<g class="trophy-z3r0" title="${t('Troféu: Máscara do Z3R0 Neutralizado')}">
      <rect x="${x + 94}" y="79" width="6" height="2" rx="1" fill="#2a3b58"/>
      <ellipse cx="${x + 97}" cy="75" rx="3" ry="4" fill="#e8e8ee" stroke="#ff2e63" stroke-width=".5"/>
      <path d="M${x + 95.5} 74l2 1-2 1z" fill="#ff2e63"/>
      <path d="M${x + 98.5} 74l-2 1 2 1z" fill="#ff2e63"/>
      <path d="M${x + 96} 72L${x + 98} 76" stroke="#ff2e63" stroke-width=".4"/>
    </g>`;
  }

  return `<ellipse cx="${x + 52}" cy="84" rx="56" ry="7" fill="url(#sgSpill)"/>
  <rect x="${x}" y="82" width="104" height="3" rx="1.5" fill="#1a2840"/><path d="M${x + 2} 82H${x + 102}" stroke="rgba(77,210,255,.35)" stroke-width=".5"/>
  <rect x="${x + 8}" y="85" width="2.4" height="19" fill="#101b2e"/><rect x="${x + 93}" y="85" width="2.4" height="19" fill="#101b2e"/>
  ${screen(x + 20, 44, 62, 34, id, '#00e0a8', true)}
  <rect x="${x + 49}" y="78" width="4" height="4" fill="#1a2840"/><rect x="${x + 40}" y="81" width="22" height="1.2" rx=".6" fill="#2a3b58"/>
  <rect x="${x + 24}" y="79.6" width="30" height="2.2" rx="1" fill="#0d1a2e" stroke="rgba(0,224,168,.35)" stroke-width=".4"/>
  <rect x="${x + 86}" y="74" width="7" height="8" rx="1.5" fill="#0d1a2e" stroke="rgba(255,122,69,.6)" stroke-width=".6"/>
  ${trophies}`;
}
function fwS(x, id) {
  let s = `<ellipse cx="${x + 20}" cy="81" rx="26" ry="5" fill="url(#sgSpill)"/><rect x="${x}" y="80" width="40" height="2.4" rx="1.2" fill="#1a2840"/><rect x="${x + 18.5}" y="82" width="3" height="21" fill="#101b2e"/>
  ${screen(x + 5, 56, 31, 22, id, '#ffb020', false)}
  <rect x="${x + 58}" y="26" width="64" height="80" rx="3" fill="url(#sgBox)" stroke="rgba(255,176,32,.35)" stroke-width=".7"/>${strip(x + 63, 29, 54, '#ffb020')}
  <rect x="${x + 62}" y="34" width="56" height="20" rx="1.5" fill="#1b0f08" stroke="rgba(255,122,69,.6)" stroke-width=".6"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += `<rect x="${x + 64 + c * 7 + (r % 2 ? 3.5 : 0)}" y="${36 + r * 5.5}" width="6" height="4.5" rx=".5" fill="#ff7a45" opacity="${(.35 + ((r + c) % 3) * .2).toFixed(2)}"/>`;
  s += `<text x="${x + 100}" y="47.5" font-family="Orbitron,monospace" font-size="7" font-weight="800" fill="#ffb020">FW</text>`;
  for (let i = 0; i < 4; i++) { const y = 60 + i * 10.5; s += `<rect x="${x + 62}" y="${y}" width="56" height="8" rx="1" fill="#0a1424" stroke="rgba(120,190,255,.12)" stroke-width=".4"/>` + led(x + 66, y + 4, '#ffb020', i * .3) + led(x + 70, y + 4, '#00e0a8', i * .2 + .4); }
  s += shine(x + 60, 28, 30, 76) + `<path class="sg-flow" d="M${x + 36} 68 C${x + 48} 70 ${x + 52} 50 ${x + 62} 48" stroke="#4dd2ff" stroke-width="1.2" fill="none"/>`;
  return s;
}
function warS(boss, id) {
  let s = `<rect class="scrframe" x="198" y="16" width="194" height="66" rx="4" fill="${boss ? '#14040c' : '#03070e'}" stroke="${boss ? '#ff2e63' : 'rgba(120,190,255,.35)'}" stroke-width="1"/>
  <rect x="200" y="18" width="190" height="62" rx="3" fill="${boss ? 'rgba(255,46,99,.08)' : 'url(#sgScr)'}"/>`;
  if (boss) {
    s += `<g class="glitch"><path d="M318 80 C318 50 330 30 350 28 C370 30 382 50 382 80Z" fill="#0c0306"/><ellipse cx="350" cy="52" rx="14" ry="18" fill="#e8e8ee"/><path d="M338 46l9 3.5-9 3.5z" fill="#ff2e63"/><path d="M362 46l-9 3.5 9 3.5z" fill="#ff2e63"/><path d="M344 62q6 4 12 0" stroke="#1a0610" stroke-width="2" fill="none"/>
    <text x="208" y="32" font-family="Orbitron,monospace" font-size="9" font-weight="800" fill="#ff2e63" class="led">Z3R0</text><text x="208" y="42" font-family="JetBrains Mono,monospace" font-size="6" fill="#ff8aa5">pwned.exe</text>
    <rect class="sg-sweep" x="200" y="18" width="190" height="3" fill="rgba(255,46,99,.35)"/></g>
    <g class="zdef"><rect x="200" y="18" width="190" height="62" rx="3" fill="#03130d"/><text x="208" y="32" font-family="Orbitron,monospace" font-size="7" font-weight="800" fill="#00e0a8">THREAT NEUTRALIZED</text>
    <text x="345" y="46" text-anchor="middle" font-family="Orbitron,monospace" font-size="9" font-weight="800" fill="#00e0a8">Z3R0 OFFLINE</text>
    <text x="345" y="58" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.5" fill="#9fe8d5">C2 em blackhole</text>
    <text x="345" y="67" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="5.5" fill="#9fe8d5">65535:666</text></g>`;
  } else {
    let p = '', q = '';
    for (let i = 0; i <= 18; i++) { p += `${206 + i * 10},${70 - (12 + ((i * 7) % 11) + (i > 11 ? 20 + (i % 3) * 6 : 0))} `; q += `${206 + i * 10},${72 - (6 + ((i * 5) % 7))} `; }
    s += `<polygon points="${q} 386,76 206,76" fill="rgba(0,224,168,.12)"/><polyline class="graph" points="${p}" fill="none" stroke="#ff4d6d" stroke-width="1.4"/><polyline points="${q}" fill="none" stroke="#00e0a8" stroke-width="1.1"/>
    <text x="208" y="30" font-family="Orbitron,monospace" font-size="7" font-weight="800" fill="#ff4d6d" class="led">DDoS 80 Gbps</text><rect class="sg-sweep" x="200" y="18" width="190" height="3" fill="rgba(77,210,255,.18)"/>`;
  }
  s += shine(200, 18, 90, 62) + deskS(215, id);
  return s;
}
function srvS(x, id) {
  let s = `<ellipse cx="${x + 20}" cy="81" rx="26" ry="5" fill="url(#sgSpill)"/><rect x="${x}" y="80" width="40" height="2.4" rx="1.2" fill="#1a2840"/><rect x="${x + 18.5}" y="82" width="3" height="21" fill="#101b2e"/>
  ${screen(x + 5, 56, 31, 22, id, '#ff7ad9', false)}
  <rect x="${x + 58}" y="22" width="64" height="84" rx="3" fill="url(#sgBox)" stroke="rgba(255,46,99,.35)" stroke-width=".7"/>${strip(x + 63, 25, 54, '#ff2e63', 0)}`;
  for (let i = 0; i < 7; i++) { const y = 29 + i * 10.8; s += `<rect x="${x + 62}" y="${y}" width="56" height="8.5" rx="1" fill="#0a1424" stroke="rgba(120,190,255,.12)" stroke-width=".4"/>` + led(x + 66, y + 4.2, i === 3 ? '#ff2e63' : '#00e0a8', i * .2, i === 3 ? 'redled' : 'led') + `<rect x="${x + 74}" y="${y + 3.2}" width="30" height="2" rx="1" fill="rgba(120,190,255,.1)"/>`; }
  s += shine(x + 60, 24, 30, 80) + `<path d="M${x + 110} 8 l7 12 h-14z" fill="#ff2e63" class="redled"/><text x="${x + 108.6}" y="18.5" font-size="8" font-weight="800" fill="#1a0610">!</text>`;
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
