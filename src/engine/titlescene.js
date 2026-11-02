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
  topo += Object.entries(N).map(([k, [x, y]]) => {
    if (k === 'd') return `<circle cx="${x}" cy="${y}" r="7" class="tt-ring" fill="none" stroke="#ff2e63" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="3.6" fill="#2a0d18" stroke="#ff2e63" stroke-width="1.1"/>`;
    const big = k === 'core';
    return `<circle cx="${x}" cy="${y}" r="${big ? 5 : 3.4}" fill="#0b1a2e" stroke="#4dd2ff" stroke-width="${big ? 1.3 : 1}"/>${big ? `<circle cx="${x}" cy="${y}" r="1.8" fill="#4dd2ff"/>` : ''}`;
  }).join('');
  // o Z3R0 aparece por instantes no meio do painel
  const z = `<g class="tt-z"><rect x="${cx + 1}" y="${cy + 8}" width="${cw - 2}" height="${ch - 9}" fill="rgba(42,6,18,.82)"/>
    <ellipse cx="200" cy="52" rx="13" ry="16" fill="#e8e8ee"/><path d="M190 48l8 3-8 3z M210 48l-8 3 8 3z" fill="#ff2e63"/>
    <path d="M193 61q7 4 14 0" stroke="#12050a" stroke-width="1.6" fill="none"/>
    <text x="200" y="83" text-anchor="middle" class="tt-zt">Z3R0 ESTÁ NA SUA REDE</text></g>`;

  const lx = 278, ly = 20, lw = 92, lh = 64;
  const rows = [['#00e0a8', 'BGP UP', 52], ['#00e0a8', 'OLT-04 ok', 40], ['#ffd166', 'CPU 81%', 46], ['#ff2e63', 'BORDA-02 ataque', 64], ['#00e0a8', 'DNS ok', 34], ['#ff2e63', 'C2 detectado', 58]];
  const logs = rows.map(([c, t, w], i) => {
    const y = ly + 15 + i * 8.2, red = c === '#ff2e63';
    return `<g${red ? ' class="tt-blink"' : ''} style="animation-delay:${i * .3}s"><circle cx="${lx + 6}" cy="${y - 1.6}" r="1.5" fill="${c}"/><text x="${lx + 10}" y="${y}" class="tt-log"${red ? ' fill="#ff8aa5"' : ''}>${t}</text></g>`;
  }).join('');

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
    <clipPath id="ttClipG"><rect x="${gx + 1}" y="${gy + 8}" width="${gw - 2}" height="${gh - 9}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ttBg)"/>
  <rect width="${W}" height="${H}" fill="url(#ttGlow)"/>
  <rect width="${W}" height="${H}" fill="url(#ttRed)" class="tt-alarm"/>
  <g stroke="rgba(77,210,255,.08)" stroke-width=".5">${floor}</g>
  <g transform="translate(0,10)">
  <rect x="22" y="6" width="356" height="92" rx="5" fill="rgba(2,6,14,.6)" stroke="rgba(120,190,255,.12)" stroke-width=".6"/>
  ${panel(gx, gy, gw, gh, 'TRÁFEGO DA BORDA', graph)}
  ${panel(cx, cy, cw, ch, 'TOPOLOGIA', topo + z)}
  ${panel(lx, ly, lw, lh, 'ALERTAS', logs)}
  </g>
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
    <path d="M150 ${H} C150 150 162 140 182 137 L218 137 C238 140 250 150 250 ${H}Z" fill="#03060c"/>
    <path d="M150 ${H} C150 150 162 140 182 137 L218 137 C238 140 250 150 250 ${H}" fill="none" stroke="url(#ttRim)" stroke-width="1"/>
    <rect x="193" y="126" width="14" height="13" rx="4" fill="#03060c"/>
    <ellipse cx="200" cy="114" rx="15" ry="17" fill="#03060c"/>
    <path d="M185 112 a15 17 0 0 1 30 0" fill="none" stroke="url(#ttRim)" stroke-width="1.1"/>
    <path d="M183 113 a17 18 0 0 1 34 0" fill="none" stroke="#14233a" stroke-width="2.6"/>
    <rect x="180" y="110" width="5" height="10" rx="2" fill="#14233a"/><rect x="215" y="110" width="5" height="10" rx="2" fill="#14233a"/>
    <circle cx="217.5" cy="115" r="1.2" class="tt-blink" fill="#00e0a8"/>
  </g>
</svg>`;
}
