// Mapa Tático 3D / Mundo RPG de Trilhas do NOC.
// Permite ao jogador avançar pelas fases visualizando a topologia em perspectiva isométrica/3D,
// com caminhos de fibra óptica iluminados, plataformas de incidentes e o analista marcando o plantão atual.

import { t as tr } from './i18n.js';
import { fmt, store, esc } from './util.js';
import { K, num, unlocked } from './state.js';

export function worldMapHTML({ ct, LEVELS, ACTS, S, gold, nextI, DIFFS }) {
  const currentActs = ACTS.map((a, ai) => ({ a, ai })).filter(({ a }) => a[4] === ct);
  if (!currentActs.length) {
    return `<div class="rpg-empty">${tr('Nenhum ato disponível para esta trilha ainda.')}</div>`;
  }

  const walkFrom = store('noc_walk_from');
  let html = `<div class="rpg-map-canvas">`;

  currentActs.forEach(({ a, ai }, actIdx) => {
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

    // Mesmo texto da lista clássica: só promete o próximo ato se ele existir nesta trilha.
    if (a[5]) {
      html += `<div class="nivn">${tr(LEVELS.some(L => L.act > ai && L.trail === ct) ? 'Para quem está começando. Já trabalha com isso? O próximo ato já está liberado.' : 'Para quem está começando. O plantão desta trilha chega nos próximos lotes.')}</div>`;
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

    const hasNext = actLevels.some(item => item.i === nextI);
    const pTo = hasNext ? pts.find(p => p.i === nextI) : null;
    const pFrom = (walkFrom !== null && walkFrom !== undefined && walkFrom !== nextI)
      ? pts.find(p => p.i === walkFrom)
      : null;
    const isWalking = !!(hasNext && pTo && pFrom);

    if (isWalking) {
      try {
        setTimeout(() => store('noc_walk_from', null), 3500);
      } catch (e) {}
    }

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
    let beacon = '';
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

      svg += `<g class="${cls}" data-i="${i}" tabindex="${lock ? -1 : 0}" role="button" aria-label="${num(i)}. ${esc(L.title)}">`;

      // Sombra projetada no solo
      svg += `<ellipse cx="${x}" cy="${y + 20}" rx="28" ry="9" fill="rgba(0,0,0,0.65)"/>`;

      // Cilindro / prisma de elevação 3D
      svg += `<path d="M ${x - 24} ${y + 8} C ${x - 24} ${y + 18}, ${x + 24} ${y + 18}, ${x + 24} ${y + 8} L ${x + 24} ${y + 15} C ${x + 24} ${y + 25}, ${x - 24} ${y + 25}, ${x - 24} ${y + 15} Z" fill="${baseColor}" stroke="${strokeColor}" stroke-width="1.2"/>`;

      // Plataforma superior iluminada
      svg += `<ellipse cx="${x}" cy="${y + 8}" rx="24" ry="12" fill="${plateFill}" stroke="${strokeColor}" stroke-width="${isNext ? 2.4 : 1.6}" ${isNext || isBoss ? 'filter="url(#rpgGlow)"' : ''}/>`;

      // Efeitos de sonar sobre a plataforma ativa
      if (isNext) {
        beacon = `<g pointer-events="none"><circle cx="${x}" cy="${y + 8}" r="22" class="rpg-beacon-wave"/><circle cx="${x}" cy="${y + 8}" r="15" class="rpg-beacon-wave-2"/></g>`;
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
        <text y="4" text-anchor="middle" font-family="Orbitron,monospace" font-size="7.5" font-weight="700" fill="${titleColor}">${num(i)}. ${esc(shortTitle)}</text>
        <text y="14" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="6" fill="#8095b5">${esc(L.tag || '')}${best ? ' · ' + fmt(best) + ' pts' : ''}</text>
      </g>`;

      svg += `</g>`; // fecha rpg-node
    });
    svg += beacon;

    // 3. Personagem Operador 3D (Renderizado no topo do z-order sobre o disco ativo)
    if (hasNext && pTo) {
      let heroTransform = `transform="translate(${pTo.x},${pTo.y + 8})"`;
      let motionTag = '';

      if (isWalking && pFrom) {
        heroTransform = '';
        const midY = (pFrom.y + pTo.y) / 2;
        const walkPath = `M ${pFrom.x} ${pFrom.y + 8} C ${pFrom.x} ${midY + 8}, ${pTo.x} ${midY + 8}, ${pTo.x} ${pTo.y + 8}`;
        motionTag = `<animateMotion path="${walkPath}" dur="3.2s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />`;
      }

      svg += `<g class="rpg-hero-token${isWalking ? ' rpg-hero-walking' : ''}" ${heroTransform}>
        ${motionTag}
        <!-- Sombra 3D projetada na plataforma -->
        <ellipse cx="0" cy="0" rx="14" ry="5.5" fill="rgba(0,0,0,0.6)" filter="url(#rpgGlow)"/>
        <ellipse cx="0" cy="0" rx="10" ry="3.8" fill="none" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.2" stroke-dasharray="2 2"/>

        <!-- Bobbing & Animação corporal -->
        <g class="rpg-hero-bob">
          <!-- Pernas e Botas Táticas 3D -->
          <g class="rpg-leg-l">
            <path d="M -5 -8 L -5 0" stroke="#0e1a2c" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M -7 -1 L -3 -1 L -2 1.5 L -8 1.5 Z" fill="#14243b" stroke="#00f0ff" stroke-width="0.6"/>
            <line x1="-8" y1="1.5" x2="-2" y2="1.5" stroke="#00f0ff" stroke-width="1.2"/>
          </g>
          <g class="rpg-leg-r">
            <path d="M 5 -8 L 5 0" stroke="#0e1a2c" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M 3 -1 L 7 -1 L 8 1.5 L 2 1.5 Z" fill="#14243b" stroke="#00f0ff" stroke-width="0.6"/>
            <line x1="2" y1="1.5" x2="8" y2="1.5" stroke="#00f0ff" stroke-width="1.2"/>
          </g>

          <!-- Torso / Colete Cibernético 3D -->
          <g class="rpg-hero-torso-g">
            <path d="M -7 -20 L 7 -20 L 5 -8 L -5 -8 Z" fill="#008f70"/>
            <path d="M -6 -19 L 6 -19 L 4.5 -9 L -4.5 -9 Z" fill="#00a884" stroke="#00e0a8" stroke-width="0.8"/>
            <circle cx="0" cy="-14" r="1.8" fill="#00f0ff" filter="url(#rpgGlow)"/>
            <path d="M -4.5 -19 L -2 -9 M 4.5 -19 L 2 -9" stroke="rgba(0,0,0,0.3)" stroke-width="0.7"/>

            <!-- Braços e Terminal Tático -->
            <path d="M -6 -18 L -9 -12 L -7 -8" stroke="#008f70" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 6 -18 L 9 -13 L 5 -10" stroke="#008f70" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <polygon points="5,-10 1,-6 7,-6" fill="rgba(0, 240, 255, 0.4)"/>
            <line x1="1" y1="-6" x2="7" y2="-6" stroke="#00f0ff" stroke-width="0.8"/>

            <!-- Cabeça e Viseira Curva 3D -->
            <circle cx="0" cy="-25" r="5.2" fill="#d9a77f"/>
            <path d="M -5.2 -26 C -5.2 -31 5.2 -31 5.2 -26 C 3 -27 -3 -27 -5.2 -26 Z" fill="#1b283d"/>
            <path d="M -4.5 -25.5 C -2 -27.5 2 -27.5 4.5 -25.5 L 4 -23.5 C 2 -24.5 -2 -24.5 -4 -23.5 Z" fill="#00f0ff" filter="url(#rpgGlow)"/>
            <line x1="-3" y1="-25" x2="1" y2="-25" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round"/>
            <path d="M 4.5 -24 L 6 -22 L 3 -21" fill="none" stroke="#223859" stroke-width="0.8" stroke-linecap="round"/>
            <circle cx="2.5" cy="-21" r="0.9" fill="#00e0a8"/>
          </g>
        </g>
      </g>`;

      // Tag flutuante "SEU PLANTÃO"
      svg += `<g class="rpg-pin-wrap" transform="translate(${pTo.x},${pTo.y - 34})">
        <g class="rpg-pin-tag${isWalking ? ' rpg-pin-delayed' : ''}">
          <rect x="-35" y="-8.5" width="70" height="17" rx="8.5" fill="#00e0a8" filter="url(#rpgGlow)"/>
          <text y="3.5" text-anchor="middle" font-family="Orbitron,monospace" font-size="7.5" font-weight="900" fill="#040913">${tr('SEU PLANTÃO')}</text>
        </g>
      </g>`;
    }

    svg += `</svg></div>`; // fecha rpg-realm
    html += svg;

    // Portal / Gateway Inter-Atos conectando ao próximo ato
    if (actIdx < currentActs.length - 1) {
      const nextAct = currentActs[actIdx + 1];
      const prevActLevels = actLevels;
      const prevActDone = prevActLevels.length > 0 && prevActLevels.every(({ i }) => S.prog[K(i)]);

      html += `<div class="rpg-act-gateway" data-next-act="${nextAct.ai}" role="button" tabindex="0">
        <div class="rag-portal">
          <span class="rag-pulse">⚡</span>
          <div class="rag-core">
            <b>${prevActDone ? tr('TRONCO METROPOLITANO ATIVO') : tr('ENLACE INTER-SETORIAL')}</b>
            <small>${prevActDone ? tr('Salto liberado para') : tr('Requer')} ${nextAct.a[0]} · ${nextAct.a[1]}</small>
          </div>
          <span class="rag-arrow">➔</span>
        </div>
      </div>`;
    }
  });

  html += `</div>`; // fecha rpg-map-canvas
  return html;
}
