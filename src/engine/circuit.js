// Minigame de Lógica de Circuito / Roteamento de Rede (Estilo Marvel's Spider-Man PS4).
// O jogador gira peças de circuito (retas, curvas, junções T) para conduzir
// o fluxo do pacote do nó de entrada (SYN IN) até o nó de saída (ACK OUT).

import { t as tr } from './i18n.js';
import { sfx, au } from './audio.js';
import { cyberConfetti } from './particles.js';
import { addXP } from './career.js';
import { speakRadio } from './radio.js';
import { S } from './state.js';
import { setHP, modal, closeModal } from './ui.js';
import { $ } from './util.js';

// Direções: 0 = Cima, 1 = Direita, 2 = Baixo, 3 = Esquerda
// Tipos de peças:
// 'I': reta [0, 2] (0/2 = vertical, 1/3 = horizontal)
// 'L': curva [0, 1] (0: Up-Right, 1: Right-Down, 2: Down-Left, 3: Left-Up)
// 'T': junção [3, 0, 1] (0: L-U-R, 1: U-R-D, 2: R-D-L, 3: D-L-U)
// 'B': bloqueador (chip inativo) []

const PUZZLES = [
  {
    name: 'Bypass de Roteamento SYN-ACK',
    desc: 'Alinhe os circuitos para conduzir o pacote interceptado até o buffer de decodificação.',
    cols: 3, rows: 3,
    in: { r: 1, c: 0, side: 3 }, // Entra pela esquerda no meio (cell 3)
    out: { r: 1, c: 2, side: 1 }, // Sai pela direita no meio (cell 5)
    // Caminho da solução: 3(L:3,0) -> 0(L:1,2) -> 1(I:1,3) -> 2(L:2,3) -> 5(L:0,1)
    grid: [
      { t: 'L', sol: 1 }, { t: 'I', sol: 1 }, { t: 'L', sol: 2 },
      { t: 'L', sol: 3 }, { t: 'B', sol: 0 }, { t: 'L', sol: 0 },
      { t: 'I', sol: 0 }, { t: 'I', sol: 1 }, { t: 'L', sol: 1 }
    ]
  },
  {
    name: 'Túnel de Enlace BGP Seguro',
    desc: 'Restaure o circuito da rota para fechar o emparelhamento com o sistema autônomo.',
    cols: 3, rows: 3,
    in: { r: 1, c: 0, side: 3 }, // Entra pela esquerda no meio (cell 3)
    out: { r: 1, c: 2, side: 1 }, // Sai pela direita no meio (cell 5)
    // Caminho da solução: 3(L:2,3) -> 6(L:0,1) -> 7(I:1,3) -> 8(L:3,0) -> 5(L:1,2)
    grid: [
      { t: 'L', sol: 1 }, { t: 'I', sol: 1 }, { t: 'L', sol: 2 },
      { t: 'L', sol: 2 }, { t: 'B', sol: 0 }, { t: 'L', sol: 1 },
      { t: 'L', sol: 0 }, { t: 'I', sol: 1 }, { t: 'L', sol: 3 }
    ]
  },
  {
    name: 'Decodificador de Header RPKI',
    desc: 'Complete a ponte lógica para validar a assinatura ROA da rota de borda.',
    cols: 3, rows: 3,
    in: { r: 1, c: 0, side: 3 }, // Entra pela esquerda no meio (cell 3)
    out: { r: 1, c: 2, side: 1 }, // Sai pela direita no meio (cell 5)
    // Caminho da solução: 3(L:3,0) -> 0(L:1,2) -> 1(L:2,3) -> 4(L:0,1) -> 5(I:1,3)
    grid: [
      { t: 'L', sol: 1 }, { t: 'L', sol: 2 }, { t: 'B', sol: 0 },
      { t: 'L', sol: 3 }, { t: 'L', sol: 0 }, { t: 'I', sol: 1 },
      { t: 'B', sol: 0 }, { t: 'I', sol: 1 }, { t: 'L', sol: 2 }
    ]
  },
  {
    name: 'Mitigação de Loop STP',
    desc: 'Gire os segmentos para desviar o fluxo do nó corrompido e restabelecer o link root.',
    cols: 3, rows: 3,
    in: { r: 1, c: 0, side: 3 }, // Entra pela esquerda no meio (cell 3)
    out: { r: 1, c: 2, side: 1 }, // Sai pela direita no meio (cell 5)
    // Caminho: 3(L:2,3) -> 6(L:0,1) -> 7(T:3,0,1) -> 4(I:0,2) -> 1(L:1,2) -> 2(L:2,3) -> 5(L:0,1)
    grid: [
      { t: 'B', sol: 0 }, { t: 'L', sol: 1 }, { t: 'L', sol: 2 },
      { t: 'L', sol: 2 }, { t: 'I', sol: 0 }, { t: 'L', sol: 0 },
      { t: 'L', sol: 0 }, { t: 'T', sol: 0 }, { t: 'B', sol: 0 }
    ]
  },
  {
    name: 'Buffer de Desfragmentação MTU',
    desc: 'Conecte o canal de reordenação de pacotes para evitar descarte por MSS inconsistente.',
    cols: 4, rows: 3,
    in: { r: 1, c: 0, side: 3 }, // Entra pela esquerda no meio (cell 4)
    out: { r: 1, c: 3, side: 1 }, // Sai pela direita no meio (cell 7)
    // Caminho: 4(L:3,0) -> 0(L:1,2) -> 1(I:1,3) -> 2(I:1,3) -> 3(L:2,3) -> 7(L:0,1)
    grid: [
      { t: 'L', sol: 1 }, { t: 'I', sol: 1 }, { t: 'I', sol: 1 }, { t: 'L', sol: 2 },
      { t: 'L', sol: 3 }, { t: 'B', sol: 0 }, { t: 'B', sol: 0 }, { t: 'L', sol: 0 },
      { t: 'I', sol: 1 }, { t: 'L', sol: 1 }, { t: 'I', sol: 0 }, { t: 'L', sol: 3 }
    ]
  }
];

const BASE_PORTS = {
  I: [0, 2],
  L: [0, 1],
  T: [3, 0, 1],
  X: [0, 1, 2, 3],
  B: []
};

const getPorts = (type, rot) => (BASE_PORTS[type] || []).map(p => (p + rot) % 4);

export function openCircuitPuzzle() {
  // Congela cronômetros de perguntas e modos de tempo enquanto o minigame estiver aberto
  S.paused = true;

  const pz = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  let solved = false;

  // Estado das rotações atuais (embaralha a solução inicial)
  const state = pz.grid.map((cell) => {
    if (cell.t === 'B') return { rot: 0, t: cell.t };
    let r = Math.floor(Math.random() * 4);
    if (r === cell.sol) {
      r = (r + 1) % 4;
    }
    return { rot: r, t: cell.t };
  });

  const DR = [-1, 0, 1, 0];
  const DC = [0, 1, 0, -1];

  function evaluate() {
    const active = new Set();
    const queue = [];
    const inCellIdx = pz.in.r * pz.cols + pz.in.c;
    const inPorts = getPorts(state[inCellIdx].t, state[inCellIdx].rot);
    const entryPort = pz.in.side;

    if (inPorts.includes(entryPort)) {
      active.add(inCellIdx);
      queue.push({ r: pz.in.r, c: pz.in.c, cameFromPort: entryPort });
    }

    const visited = new Set();
    visited.add(`${pz.in.r},${pz.in.c}`);

    while (queue.length) {
      const curr = queue.shift();
      const currIdx = curr.r * pz.cols + curr.c;
      const ports = getPorts(state[currIdx].t, state[currIdx].rot);

      for (const p of ports) {
        if (p === curr.cameFromPort) continue; // Conexão segue pelas outras portas da peça

        const nr = curr.r + DR[p];
        const nc = curr.c + DC[p];
        if (nr < 0 || nr >= pz.rows || nc < 0 || nc >= pz.cols) continue;

        const nextIdx = nr * pz.cols + nc;
        const requiredNeighborPort = (p + 2) % 4;
        const nextPorts = getPorts(state[nextIdx].t, state[nextIdx].rot);

        if (nextPorts.includes(requiredNeighborPort)) {
          active.add(nextIdx);
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ r: nr, c: nc, cameFromPort: requiredNeighborPort });
          }
        }
      }
    }

    // Checa se o fluxo ativo alcançou a porta de saída
    const outIdx = pz.out.r * pz.cols + pz.out.c;
    const isOutActive = active.has(outIdx);
    const outPorts = isOutActive ? getPorts(state[outIdx].t, state[outIdx].rot) : [];
    const reachedEnd = isOutActive && outPorts.includes(pz.out.side);

    return { active, reachedEnd };
  }

  function renderPuzzle(container, { active, reachedEnd }) {
    const gridEl = container.querySelector('.circ-grid');
    const boardWrap = container.querySelector('.circ-board-wrap');
    if (!gridEl) return;

    if (boardWrap) {
      boardWrap.classList.toggle('circ-connected', reachedEnd);
    }

    gridEl.style.gridTemplateColumns = `repeat(${pz.cols}, 1fr)`;
    gridEl.innerHTML = state.map((cell, idx) => {
      const isActive = active.has(idx);
      const isBlock = cell.t === 'B';
      const deg = cell.rot * 90;

      let svgPath = '';
      if (cell.t === 'I') {
        svgPath = '<line x1="25" y1="0" x2="25" y2="50" class="cwire" stroke-width="8"/>';
      } else if (cell.t === 'L') {
        svgPath = '<path d="M 25 0 V 25 H 50" class="cwire" stroke-width="8" fill="none"/>';
      } else if (cell.t === 'T') {
        svgPath = '<path d="M 0 25 H 50 M 25 25 V 0" class="cwire" stroke-width="8" fill="none"/>';
      } else if (cell.t === 'X') {
        svgPath = '<line x1="25" y1="0" x2="25" y2="50" class="cwire" stroke-width="8"/><line x1="0" y1="25" x2="50" y2="25" class="cwire" stroke-width="8"/>';
      } else if (isBlock) {
        svgPath = '<rect x="8" y="8" width="34" height="34" rx="4" class="cblock" fill="#141f33" stroke="#253856" stroke-width="2"/><text x="25" y="29" font-size="12" text-anchor="middle" fill="#586f96">🔒</text>';
      }

      return `<button class="circ-tile${isActive ? ' active' : ''}${isBlock ? ' block' : ''}" data-idx="${idx}" type="button" aria-label="Peça de circuito ${idx + 1}" ${isBlock || solved ? 'disabled' : ''}>
        <svg viewBox="0 0 50 50" class="circ-svg" style="transform: rotate(${deg}deg)">
          ${svgPath}
          ${isActive ? '<circle cx="25" cy="25" r="4.5" class="cnode-pulse"/>' : ''}
        </svg>
      </button>`;
    }).join('');

    const statusEl = container.querySelector('.circ-status');
    if (statusEl) {
      if (reachedEnd) {
        statusEl.innerHTML = `<span class="circ-ok">⚡ ${tr('CIRCUITO ÍNTEGRO · TRANSMISSÃO CONCLUÍDA')}</span>`;
      } else {
        statusEl.innerHTML = `<span class="circ-wait">${tr('Toque nas peças para girar e conectar Origem → Destino')}</span>`;
      }
    }
  }

  const exitPuzzle = () => {
    S.paused = false;
    closeModal();
  };

  const html = `
    <div class="circuit-modal">
      <button class="modal-x" id="circAbortX" type="button" aria-label="${tr('Fechar')}">×</button>
      <div class="tag">⚡ ${tr('PACOTE DE REDE INTERCEPTADO')}</div>
      <h2>${tr(pz.name)}</h2>
      <p class="learn">${tr(pz.desc)}</p>
      
      <div class="circ-board-wrap">
        <div class="circ-io circ-in">
          <span class="cio-badge">SYN IN</span>
          <span class="cio-ip">10.0.0.1</span>
          <div class="cio-arrow">▶</div>
        </div>

        <div class="circ-grid"></div>

        <div class="circ-io circ-out">
          <div class="cio-arrow">▶</div>
          <span class="cio-badge">ACK OUT</span>
          <span class="cio-ip">192.168.1.1</span>
        </div>
      </div>

      <div class="circ-status"></div>

      <div class="circ-actions" id="circActions" hidden>
        <div class="circ-reward">
          <b>✓ +40 ${tr('XP DE CARREIRA')} · +15% HP</b>
          <span>${tr('Telemetria recuperada · Dados decodificados com sucesso')}</span>
        </div>
        <button class="btn" id="circCloseBtn" type="button">${tr('CONTINUAR O PLANTÃO')}</button>
      </div>

      <div id="circAbortRow" class="row" style="margin-top:10px">
        <button class="btn ghostb circ-abort-btn" id="circAbortBtn" type="button">✕ ${tr('DESISTIR DO PACOTE')}</button>
      </div>
    </div>
  `;

  modal(html);
  au();
  sfx.zap();

  const container = $('mcard');
  const initial = evaluate();
  renderPuzzle(container, initial);

  // Botões de saída voluntária (não ganha pontos)
  $('circAbortX').onclick = exitPuzzle;
  $('circAbortBtn').onclick = exitPuzzle;

  container.addEventListener('click', e => {
    if (solved) return;
    const tile = e.target.closest('.circ-tile');
    if (!tile || tile.classList.contains('block')) return;

    au();
    sfx.sel();
    const idx = +tile.dataset.idx;
    state[idx].rot = (state[idx].rot + 1) % 4;

    const res = evaluate();
    renderPuzzle(container, res);

    if (res.reachedEnd && !solved) {
      solved = true;
      sfx.win();
      try { sfx.whoosh(); } catch (err) {}
      cyberConfetti({ count: 45 });
      addXP(40);
      if (S && S.hp !== undefined && S.hp < 100) {
        S.hp = Math.min(100, S.hp + 15);
        setHP();
      }
      speakRadio(tr('Excelente! Circuito restaurado com perfeição!'), { force: true });

      const actEl = $('circActions');
      if (actEl) actEl.hidden = false;
      const abortRow = $('circAbortRow');
      if (abortRow) abortRow.hidden = true;
      const btn = $('circCloseBtn');
      if (btn) btn.onclick = exitPuzzle;
    }
  });
}
