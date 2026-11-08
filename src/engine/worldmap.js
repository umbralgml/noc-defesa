// Mapa Tático 3D / Mundo RPG de Trilhas do NOC.
// Permite ao jogador avançar pelas fases visualizando a topologia em perspectiva isométrica/3D,
// com caminhos de fibra óptica iluminados, plataformas de incidentes e o analista marcando o plantão atual.

import { t as tr } from './i18n.js';
import { fmt } from './util.js';
import { K, num, unlocked } from './state.js';

export function worldMapHTML({ ct, LEVELS, ACTS, S, gold, nextI, DIFFS }) {
  const currentActs = ACTS.map((a, ai) => ({ a, ai })).filter(({ a }) => a[4] === ct);
  if (!currentActs.length) {
    return `<div class="rpg-empty">${tr('Nenhum ato disponível para esta trilha ainda.')}</div>`;
  }

  let html = `<div class="rpg-map-canvas">`;

  currentActs.forEach(({ a, ai }) => {
    const actLevels = LEVELS.map((L, i) => ({ L, i })).filter(({ L }) => L.act === ai);
    const done = actLevels.length > 0 && actLevels.every(({ i }) => S.prog[K(i)]);
    const doneCount = actLevels.filter(({ i }) => S.prog[K(i)]).length;

    html += `<div class="rpg-realm" data-act="${ai}">
      <div class="rpg-realm-banner">
        <div class="rpg-realm-head">
          <span class="rpg-realm-tag">${a[0]}</span>
          ${a[5] ? '<i class="diff nivel">NIVELAMENTO</i>' : a[2] ? `<i class="diff d-${DIFFS.indexOf(a[2])}">${tr(a[2].toUpperCase())}</i>` : ''}
          ${done ? `<button class="certb" data-a="${ai}" type="button">📜 ${tr('CERTIFICADO')}</button>` : ''}
        </div>
        <h3 class="rpg-realm-title">${a[1]}</h3>
        <div class="rpg-realm-sub">
          <span>${actLevels.length ? `${doneCount}/${actLevels.length} ${tr('incidentes neutralizados')}` : tr('Setor em construção')}</span>
        </div>
      </div>`;

    if (!actLevels.length) {
      html += `<div class="nivn">${tr('O plantão desta trilha chega nos próximos lotes.')}</div></div>`;
      return;
    }

    if (a[5]) {
      html += `<div class="nivn">${tr('Para quem está começando. Já trabalha com isso? O próximo ato já está liberado.')}</div>`;
    }

    // Gerador SVG do mapa isométrico com curvas e plataformas 3D
    const N = actLevels.length;
    const svgW = 340;
    const stepY = 100;
    const startY = 60;
    const svgH = startY + (N - 1) * stepY + 70;

    // Coordenadas calculadas para o zigue-zague natural da estrada
    const pts = actLevels.map((item, idx) => {
      let x = 170;
      if (idx % 4 === 0) x = 80;
      else if (idx % 4 === 1) x = 170;
      else if (idx % 4 === 2) x = 260;
      else if (idx % 4 === 3) x = 170;
      const y = startY + idx * stepY;
      return { ...item, idx, x, y };
    });

    let svg = `<svg class="rpg-realm-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="rpgGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="pedNext" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#0ff" stop-opacity=".7"/>
          <stop offset="70%" stop-color="#008f70" stop-opacity=".9"/>
          <stop offset="100%" stop-color="#041a18" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="pedDone" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#00e0a8" stop-opacity=".6"/>
          <stop offset="70%" stop-color="#073b30" stop-opacity=".85"/>
          <stop offset="100%" stop-color="#041814" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="pedLock" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1b2a42" stop-opacity=".8"/>
          <stop offset="80%" stop-color="#0d1726" stop-opacity=".95"/>
          <stop offset="100%" stop-color="#070c14" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="pedBoss" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ff4d6d" stop-opacity=".7"/>
          <stop offset="70%" stop-color="#540e1f" stop-opacity=".9"/>
          <stop offset="100%" stop-color="#1f040b" stop-opacity="1"/>
        </radialGradient>
      </defs>`;

    // 1. Dutos de Fibra Óptica conectando os nós sequenciais
    for (let k = 0; k < pts.length - 1; k++) {
      const p1 = pts[k], p2 = pts[k + 1];
      const isUnlockedNext = unlocked(p2.i);
      const midY = (p1.y + p2.y) / 2;
      const pathD = `M ${p1.x} ${p1.y + 8} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y + 8}`;

      // Duto externo base
      svg += `<path d="${pathD}" fill="none" stroke="#0a1526" stroke-width="9" stroke-linecap="round"/>`;
      svg += `<path d="${pathD}" fill="none" stroke="${isUnlockedNext ? '#10393f' : '#142033'}" stroke-width="5" stroke-linecap="round"/>`;

      // Pulso luminoso de tráfego ativo
      if (isUnlockedNext) {
        svg += `<path d="${pathD}" fill="none" stroke="#00e0a8" stroke-width="2.5" stroke-linecap="round" opacity=".8" filter="url(#rpgGlow)"/>`;
        svg += `<path d="${pathD}" fill="none" stroke="#4dd2ff" stroke-width="1.8" stroke-dasharray="8 16" class="rpg-conduit-flow"/>`;
      } else {
        svg += `<path d="${pathD}" fill="none" stroke="#1d2e47" stroke-width="1.5" stroke-dasharray="3 6"/>`;
      }
    }

    // 2. Plataformas Isométricas 3D de cada nó
    pts.forEach(p => {
      const { L, i, x, y } = p;
      const st = S.prog[K(i)] || 0;
      const lock = !unlocked(i);
      const isNext = i === nextI;
      const isBoss = L.boss || L.miniboss;
      const isGold = gold.includes(L.key || L.title);
      const best = S.best[K(i)] || 0;

      const cls = ['node', 'rpg-node', lock ? 'lock' : '', st ? 'done' : '', isNext ? 'next' : '', isBoss ? 'boss' : ''].filter(Boolean).join(' ');

      const baseColor = isBoss ? '#420d19' : isNext ? '#063532' : st ? '#083227' : '#0e1724';
      const strokeColor = isBoss ? '#ff2e63' : isNext ? '#00f0ff' : st ? '#00e0a8' : '#223859';
      const plateFill = isBoss ? 'url(#pedBoss)' : isNext ? 'url(#pedNext)' : st ? 'url(#pedDone)' : 'url(#pedLock)';

      svg += `<g class="${cls}" data-i="${i}" tabindex="${lock ? -1 : 0}" role="button" aria-label="${num(i)}. ${L.title}">`;

      // Sombra projetada
      svg += `<ellipse cx="${x}" cy="${y + 20}" rx="28" ry="9" fill="rgba(0,0,0,0.65)"/>`;

      // Cilindro / prisma de elevação 3D
      svg += `<path d="M ${x - 24} ${y + 8} C ${x - 24} ${y + 18}, ${x + 24} ${y + 18}, ${x + 24} ${y + 8} L ${x + 24} ${y + 15} C ${x + 24} ${y + 25}, ${x - 24} ${y + 25}, ${x - 24} ${y + 15} Z" fill="${baseColor}" stroke="${strokeColor}" stroke-width="1.2"/>`;

      // Plataforma superior iluminada
      svg += `<ellipse cx="${x}" cy="${y + 8}" rx="24" ry="12" fill="${plateFill}" stroke="${strokeColor}" stroke-width="${isNext ? 2.4 : 1.6}" ${isNext || isBoss ? 'filter="url(#rpgGlow)"' : ''}/>`;

      // Se for o plantão atual (next), desenha anéis de sonar e o mini analista holográfico
      if (isNext) {
        svg += `<circle cx="${x}" cy="${y + 8}" r="22" class="rpg-beacon-wave"/>`;
        svg += `<circle cx="${x}" cy="${y + 8}" r="15" class="rpg-beacon-wave-2"/>`;

        // Mini Avatar do Operador no mapa
        svg += `<g class="rpg-hero-token" transform="translate(${x},${y - 10})">
          <ellipse cx="0" cy="12" rx="10" ry="2.2" fill="rgba(0,0,0,0.5)"/>
          <path d="M -4 2 L -2 12 M 4 2 L 2 12" stroke="#111c2e" stroke-width="3" stroke-linecap="round"/>
          <path d="M -6 -8 H 6 L 5 4 H -5 Z" fill="#00a884" stroke="#00e0a8" stroke-width=".6"/>
          <rect x="-7" y="-7" width="2" height="8" rx="1" fill="#008f70"/>
          <rect x="5" y="-7" width="2" height="8" rx="1" fill="#008f70"/>
          <circle cx="0" cy="-14" r="5" fill="#d9a77f"/>
          <path d="M -5 -16 C -5 -20 5 -20 5 -16 Z" fill="#2b1d14"/>
          <rect x="0" y="-15" width="5.5" height="2.2" rx="1" fill="rgba(0,240,255,0.85)"/>
          <line x1="4.5" y1="-13" x2="6.5" y2="-11" stroke="#00e0a8" stroke-width=".8"/>
          <circle cx="6.5" cy="-11" r=".8" fill="#fff"/>
        </g>`;

        // Tag indicadora flutuante
        svg += `<g class="rpg-pin-tag" transform="translate(${x},${y - 40})">
          <rect x="-35" y="-8.5" width="70" height="17" rx="8.5" fill="#00e0a8" filter="url(#rpgGlow)"/>
          <text y="3.5" text-anchor="middle" font-family="Orbitron,monospace" font-size="7.5" font-weight="900" fill="#040913">SEU PLANTÃO</text>
        </g>`;
      } else {
        // Ícone central sobre a plataforma
        if (lock) {
          svg += `<text x="${x}" y="${y + 11}" text-anchor="middle" font-size="11" fill="#4d648d">🔒</text>`;
        } else if (isBoss) {
          svg += `<text x="${x}" y="${y + 12}" text-anchor="middle" font-size="12" fill="#ff4d6d">☠</text>`;
        } else if (st) {
          svg += `<text x="${x}" y="${y + 12}" text-anchor="middle" font-family="Orbitron,monospace" font-size="10" font-weight="900" fill="#00e0a8">✓</text>`;
        } else {
          svg += `<text x="${x}" y="${y + 12}" text-anchor="middle" font-family="Orbitron,monospace" font-size="9" font-weight="800" fill="#8cb3e8">${num(i)}</text>`;
        }
      }

      // Estrelas de pontuação (se concluído)
      if (st > 0) {
        const starStr = '★'.repeat(st) + '☆'.repeat(3 - st);
        svg += `<text x="${x}" y="${y + 24}" text-anchor="middle" font-size="9.5" fill="${isGold ? '#ffe8a3' : '#ffd166'}" letter-spacing="1.5">${starStr}</text>`;
      }

      // Card / Tag de identificação do incidente
      const shortTitle = L.title.length > 22 ? L.title.slice(0, 20) + '…' : L.title;
      const titleColor = isNext ? '#00f0ff' : st ? '#e2ecfc' : lock ? '#5c6f8f' : '#b2c8e8';
      const labelStroke = isNext ? '#00f0ff' : st ? 'rgba(0,224,168,.4)' : 'rgba(44,61,92,.6)';

      svg += `<g class="rpg-label" transform="translate(${x},${y + (st > 0 ? 36 : 30)})">
        <rect x="-60" y="-8" width="120" height="28" rx="8" fill="rgba(6,14,26,0.92)" stroke="${labelStroke}" stroke-width="${isNext ? 1.5 : 1}"/>
        <text y="4" text-anchor="middle" font-family="Orbitron,monospace" font-size="7.5" font-weight="700" fill="${titleColor}">${num(i)}. ${shortTitle}</text>
        <text y="14" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6" fill="#8095b5">${L.tag}${best ? ' · ' + fmt(best) + ' pts' : ''}</text>
      </g>`;

      svg += `</g>`; // fecha rpg-node
    });

    svg += `</svg></div>`; // fecha rpg-realm
    html += svg;
  });

  html += `</div>`; // fecha rpg-map-canvas
  return html;
}
