// Cena da tela inicial: telão do NOC visto por trás do analista de plantão.
// Três painéis (tráfego, topologia da borda e alertas), o Z3R0 invadindo o telão e o analista em silhueta.
// Só SVG e CSS (classes tt-* no style.css); com a acessibilidade "menos animação", tudo fica parado.

const W = 400, H = 176;
const r = n => Math.round(n * 10) / 10;

// Linha de tráfego: duas voltas iguais lado a lado para o deslize em loop não dar salto.
function traffic(x, y, w, h) {
  const pts = [.55, .5, .62, .58, .7, .52, .64, .8, .72, .6, .66, .58];
  const step = w / pts.length, line = [];
  for (let k = 0; k <= pts.length * 2; k++) line.push(`${r(x + k * step)},${r(y + h - pts[k % pts.length] * h)}`);
  const d = 'M' + line.join(' L');
  return `<g clip-path="url(#ttClipG)"><g class="tt-scroll" style="--tt-w:${r(-w)}px">
    <path d="${d} L${r(x + w * 2)},${y + h} L${x},${y + h}Z" fill="url(#ttArea)"/>
    <path d="${d}" fill="none" stroke="#00e0a8" stroke-width="1.1" stroke-linejoin="round"/></g></g>`;
}

function panel(x, y, w, h, title, body, extra = '') {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#ttPanel)" stroke="rgba(120,190,255,.22)" stroke-width=".6"/>
    <rect x="${x}" y="${y}" width="${w}" height="7" rx="3" fill="rgba(120,190,255,.07)"/>
    <text x="${x + 4}" y="${y + 5.2}" class="tt-lbl">${title}</text>${extra}${body}</g>`;
}

export function titleSVG() {
  // painéis do telão
  const gx = 30, gy = 20, gw = 92, gh = 64;
  const graph = traffic(gx + 3, gy + 18, gw - 6, gh - 22)
    + `<text x="${gx + 4}" y="${gy + 15}" class="tt-big">9,8<tspan class="tt-lbl"> Gbps</tspan></text>`;

  const cx = 130, cy = 12, cw = 140, ch = 80;
  const N = { core: [200, 54], a: [158, 34], b: [242, 34], c: [152, 76], d: [248, 76], e: [200, 26] };
  const links = [['core', 'a'], ['core', 'b'], ['core', 'c'], ['core', 'd'], ['core', 'e'], ['a', 'e'], ['b', 'e']];
  let topo = links.map(([p, q], i) => {
    const [x1, y1] = N[p], [x2, y2] = N[q], bad = q === 'd';
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${bad ? 'rgba(255,46,99,.45)' : 'rgba(77,210,255,.3)'}" stroke-width=".8"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tt-flow${bad ? ' bad' : ''}" style="animation-delay:-${(i * .37).toFixed(2)}s" stroke="${bad ? '#ff2e63' : '#00e0a8'}" stroke-width="1.3"/>`;
  }).join('');
  // Radar tático em varredura ativa 360° em torno do Core
  topo += `<g class="tt-radar-wrap" style="transform-origin:200px 54px">
    <circle cx="200" cy="54" r="36" fill="none" stroke="rgba(77,210,255,.15)" stroke-width=".6" stroke-dasharray="2 3"/>
    <circle cx="200" cy="54" r="22" fill="none" stroke="rgba(0,224,168,.12)" stroke-width=".5"/>
    <path d="M200 54 L232 32 A36 36 0 0 1 234 68 Z" fill="url(#ttLaserArc)" class="tt-radar-spin"/>
  </g>`;
  topo += Object.entries(N).map(([k, [x, y]]) => {
    if (k === 'd') return `<circle cx="${x}" cy="${y}" r="8" class="tt-ring" fill="none" stroke="#ff2e63" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="3.6" fill="#2a0d18" stroke="#ff2e63" stroke-width="1.1"/><line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" stroke="#ff2e63" stroke-width=".6"/><line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" stroke="#ff2e63" stroke-width=".6"/>`;
    const big = k === 'core';
    return `<circle cx="${x}" cy="${y}" r="${big ? 5 : 3.4}" fill="#0b1a2e" stroke="#4dd2ff" stroke-width="${big ? 1.3 : 1}"/>${big ? `<circle cx="${x}" cy="${y}" r="1.8" fill="#4dd2ff"/>` : ''}`;
  }).join('');
  // o Z3R0 aparece por instantes no meio do painel
  const z = `<g class="tt-z"><rect x="${cx + 1}" y="${cy + 8}" width="${cw - 2}" height="${ch - 9}" fill="rgba(42,6,18,.82)"/>
    <ellipse cx="200" cy="52" rx="13" ry="16" fill="#e8e8ee"/><path d="M190 48l8 3-8 3z M210 48l-8 3 8 3z" fill="#ff2e63"/>
    <path d="M193 61q7 4 14 0" stroke="#12050a" stroke-width="1.6" fill="none"/>
    <line x1="${cx + 6}" y1="52" x2="${cx + cw - 6}" y2="52" stroke="rgba(255,46,99,.4)" stroke-width=".6" stroke-dasharray="3 2"/>
    <text x="200" y="83" text-anchor="middle" class="tt-zt">Z3R0 ESTÁ NA SUA REDE</text></g>`;

  const lx = 278, ly = 20, lw = 92, lh = 64;
  const rows = [['#00e0a8', 'BGP UP', 52], ['#00e0a8', 'OLT-04 ok', 40], ['#ffd166', 'CPU 81%', 46], ['#ff2e63', 'BORDA-02 ataque', 64], ['#00e0a8', 'DNS ok', 34], ['#ff2e63', 'C2 detectado', 58]];
  const logs = rows.map(([c, t, w], i) => {
    const y = ly + 15 + i * 8.2, red = c === '#ff2e63';
    return `<g${red ? ' class="tt-blink"' : ''} style="animation-delay:${i * .3}s"><circle cx="${lx + 6}" cy="${y - 1.6}" r="1.5" fill="${c}"/><text x="${lx + 10}" y="${y}" class="tt-log"${red ? ' fill="#ff8aa5"' : ''}>${t}</text></g>`;
  }).join('');

  // partículas de dados subindo do chão
  let motes = '';
  for (let k = 0; k < 14; k++) { const x = 20 + ((k * 53) % 360), d = (k * .73) % 6; motes += `<circle class="tt-mote" style="animation-delay:-${d.toFixed(2)}s;animation-duration:${(5 + (k % 4)).toFixed(1)}s" cx="${x}" cy="${150 - (k % 3) * 8}" r="${k % 3 ? .7 : 1}" fill="${k % 5 ? '#4dd2ff' : '#00e0a8'}"/>`; }
  // chão em perspectiva
  let floor = '';
  for (let k = -9; k <= 9; k++) floor += `<line x1="${200 + k * 8}" y1="110" x2="${200 + k * 60}" y2="${H}" />`;
  [114, 119, 127, 138, 154].forEach(y => { floor += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" />`; });

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="tt" role="img" aria-label="Analista de plantão diante do telão do NOC, com o Z3R0 invadindo a rede">
  <defs>
    <linearGradient id="ttBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040812"/><stop offset=".6" stop-color="#0a1630"/><stop offset="1" stop-color="#050a14"/></linearGradient>
    <radialGradient id="ttGlow" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="rgba(0,224,168,.22)"/><stop offset="1" stop-color="rgba(0,224,168,0)"/></radialGradient>
    <radialGradient id="ttRed" cx=".62" cy=".3" r=".55"><stop offset="0" stop-color="rgba(255,46,99,.35)"/><stop offset="1" stop-color="rgba(255,46,99,0)"/></radialGradient>
    <linearGradient id="ttPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(16,32,58,.92)"/><stop offset="1" stop-color="rgba(8,16,32,.92)"/></linearGradient>
    <linearGradient id="ttArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(0,224,168,.35)"/><stop offset="1" stop-color="rgba(0,224,168,0)"/></linearGradient>
    <linearGradient id="ttDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1628"/><stop offset="1" stop-color="#03060c"/></linearGradient>
    <linearGradient id="ttRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(0,224,168,.9)"/><stop offset=".5" stop-color="rgba(77,210,255,.35)"/><stop offset="1" stop-color="rgba(77,210,255,0)"/></linearGradient>
    <linearGradient id="ttLaserArc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(0,224,168,.75)"/><stop offset="1" stop-color="rgba(0,224,168,0)"/></linearGradient>
    <clipPath id="ttClipG"><rect x="${gx + 1}" y="${gy + 8}" width="${gw - 2}" height="${gh - 9}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ttBg)"/>
  <g class="tt-cam">
  <rect width="${W}" height="${H}" fill="url(#ttGlow)"/>
  <rect width="${W}" height="${H}" fill="url(#ttRed)" class="tt-alarm"/>
  <g stroke="rgba(77,210,255,.08)" stroke-width=".5">${floor}</g>
  <g transform="translate(0,10)">
  <g class="tt-hud-alert">
    <rect x="22" y="0" width="356" height="8" rx="2" fill="rgba(255,46,99,.15)" stroke="rgba(255,46,99,.4)" stroke-width=".6"/>
    <circle cx="28" cy="4" r="1.6" fill="#ff2e63" class="tt-blink"/>
    <text x="34" y="6.2" font-family="Orbitron,monospace" font-size="4.5" font-weight="800" fill="#ff8aa5">DEFCON 2 // ALERTA TÁTICO: VARREDURA HOSTIL DETECTADA</text>
    <text x="372" y="6.2" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="4.5" font-weight="700" fill="#00e0a8">NOC ONLINE · 99.9%</text>
  </g>
  <rect x="22" y="10" width="356" height="88" rx="5" fill="rgba(2,6,14,.6)" stroke="rgba(120,190,255,.12)" stroke-width=".6"/>
  <g class="tt-stream-left" opacity=".35">
    <text x="25" y="24" class="tt-lbl" font-size="4.2">0x7F SYN</text>
    <text x="25" y="32" class="tt-lbl" font-size="4.2">0x80 ACK</text>
    <text x="25" y="40" class="tt-lbl" font-size="4.2">DROP 443</text>
    <text x="25" y="48" class="tt-lbl" font-size="4.2">RPKI OK</text>
    <text x="25" y="56" class="tt-lbl" font-size="4.2">TCP 179</text>
    <text x="25" y="64" class="tt-lbl" font-size="4.2">BGP PASS</text>
  </g>
  <g class="tt-stream-right" opacity=".35">
    <text x="375" y="24" class="tt-lbl" font-size="4.2" text-anchor="end">ETH 10G</text>
    <text x="375" y="32" class="tt-lbl" font-size="4.2" text-anchor="end">CWDM 1310</text>
    <text x="375" y="40" class="tt-lbl" font-size="4.2" text-anchor="end">SLA 99.99</text>
    <text x="375" y="48" class="tt-lbl" font-size="4.2" text-anchor="end">ARP CLEAN</text>
    <text x="375" y="56" class="tt-lbl" font-size="4.2" text-anchor="end">FLOW PASS</text>
    <text x="375" y="64" class="tt-lbl" font-size="4.2" text-anchor="end">SECURE</text>
  </g>
  ${panel(gx, gy, gw, gh, 'TRÁFEGO DA BORDA', graph)}
  ${panel(cx, cy, cw, ch, 'TOPOLOGIA', topo + z)}
  ${panel(lx, ly, lw, lh, 'ALERTAS', logs)}
  <rect class="tt-sweep" x="24" y="12" width="352" height="2" fill="rgba(77,210,255,.35)"/>
  </g>
  ${motes}
  <path d="M0 ${H} L0 150 Q200 132 400 150 L400 ${H}Z" fill="url(#ttDesk)"/>
  <path d="M0 150 Q200 132 400 150" fill="none" stroke="rgba(77,210,255,.25)" stroke-width=".6"/>
  <g class="tt-me">
    <rect x="98" y="128" width="44" height="22" rx="2" fill="#061020" stroke="rgba(77,210,255,.35)" stroke-width=".6"/>
    <path d="M102 145 L108 140 L114 142 L120 136 L126 139 L132 134 L138 137" fill="none" stroke="rgba(0,224,168,.7)" stroke-width=".8"/>
    <rect x="102" y="131" width="16" height="1.6" rx=".8" fill="rgba(120,190,255,.45)"/><rect x="102" y="134" width="10" height="1.6" rx=".8" fill="rgba(120,190,255,.25)"/>
    <rect x="258" y="128" width="44" height="22" rx="2" fill="#061020" stroke="rgba(77,210,255,.35)" stroke-width=".6"/>
    <path d="M262 145 L268 140 L274 142 L280 136 L286 139 L292 134 L298 137" fill="none" stroke="rgba(0,224,168,.7)" stroke-width=".8"/>
    <rect x="262" y="131" width="16" height="1.6" rx=".8" fill="rgba(120,190,255,.45)"/><rect x="262" y="134" width="10" height="1.6" rx=".8" fill="rgba(120,190,255,.25)"/>
    <rect x="281" y="134" width="16" height="1.6" rx=".8" fill="rgba(255,46,99,.8)" class="tt-blink"/>
    <!-- Analista com jaqueta tática moderna e crachá -->
    <path d="M148 ${H} C148 148 160 138 180 135 L220 135 C240 138 252 148 252 ${H}Z" fill="#03060c"/>
    <path d="M148 ${H} C148 148 160 138 180 135 L220 135 C240 138 252 148 252 ${H}" fill="none" stroke="url(#ttRim)" stroke-width="1.2"/>
    <path d="M192 135 L200 146 L208 135" stroke="rgba(0,224,168,.4)" stroke-width=".8" fill="none"/>
    <rect x="196" y="142" width="8" height="10" rx="1.2" fill="#f0f6fc" stroke="#0e1b2e" stroke-width=".6"/>
    <rect x="198" y="144" width="4" height="1.4" fill="#00e0a8"/>
    <!-- Relógio / Terminal de pulso no antebraço -->
    <rect x="160" y="148" width="9" height="5" rx="1.2" fill="#0b1628" stroke="#4dd2ff" stroke-width=".6"/>
    <line x1="162" y1="150.5" x2="167" y2="150.5" stroke="#00e0a8" stroke-width=".8"/>
    <!-- Cabeça e Headset de operador com espectro de áudio -->
    <rect x="193" y="126" width="14" height="13" rx="4" fill="#03060c"/>
    <ellipse cx="200" cy="114" rx="15" ry="17" fill="#03060c"/>
    <path d="M185 112 a15 17 0 0 1 30 0" fill="none" stroke="url(#ttRim)" stroke-width="1.1"/>
    <path d="M183 113 a17 18 0 0 1 34 0" fill="none" stroke="#14233a" stroke-width="2.6"/>
    <rect x="180" y="110" width="5" height="10" rx="2" fill="#14233a" stroke="#00e0a8" stroke-width=".5"/>
    <rect x="215" y="110" width="5" height="10" rx="2" fill="#14233a" stroke="#00e0a8" stroke-width=".5"/>
    <circle cx="217.5" cy="115" r="1.3" class="tt-blink" fill="#00e0a8"/>
    <!-- Teclado holográfico sob as mãos -->
    <g class="tt-holo-keys" opacity=".7">
      <ellipse cx="200" cy="146" rx="46" ry="5" fill="rgba(0,224,168,.18)" class="tt-key"/>
      <rect x="180" y="144" width="6" height="2" rx=".5" fill="#4dd2ff" opacity=".7"/>
      <rect x="188" y="144" width="6" height="2" rx=".5" fill="#4dd2ff" opacity=".7"/>
      <rect x="196" y="144" width="8" height="2" rx=".5" fill="#00e0a8"/>
      <rect x="206" y="144" width="6" height="2" rx=".5" fill="#4dd2ff" opacity=".7"/>
      <rect x="214" y="144" width="6" height="2" rx=".5" fill="#4dd2ff" opacity=".7"/>
    </g>
  </g>
  </g>
  <rect width="${W}" height="${H}" fill="rgba(255,46,99,.22)" class="tt-zflash"/>
</svg>`;
}
