// Rastreador e Interceptor de Pacotes de Rede Voadores (Sniffer Event).
// Esporadicamente faz voar pela tela um pacote de dados anômalo.
// Ao clicar, o jogador abre o desafio de lógica de circuito estilo Spider-Man PS4.

import { sfx, au } from './audio.js';
import { openCircuitPuzzle } from './circuit.js';
import { cyberConfetti } from './particles.js';
import { t as tr } from './i18n.js';
import { $ } from './util.js';

let snifferTimer = null;
let activePacket = null;

export function spawnPacket() {
  if (activePacket || document.hidden || $('modal')?.classList.contains('on')) return;
  if (document.documentElement.classList.contains('calm')) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Direção de voo: esquerda -> direita ou direita -> esquerda
  const fromLeft = Math.random() > 0.3;
  const startY = Math.floor(Math.random() * (h * 0.5) + (h * 0.15));
  const endY = Math.floor(Math.random() * (h * 0.5) + (h * 0.2));

  const el = document.createElement('div');
  el.className = `fly-packet ${fromLeft ? 'dir-r' : 'dir-l'}`;
  el.id = 'flyPacket';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', tr('Pacote de rede anômalo detectado! Toque para interceptar'));

  el.style.top = `${startY}px`;
  el.style.setProperty('--end-y', `${endY - startY}px`);

  el.innerHTML = `
    <div class="fp-drone">
      <div class="fp-wave"></div>
      <div class="fp-ring"></div>
      <div class="fp-core">⚡</div>
    </div>
    <div class="fp-bubble">
      <b class="fp-title">${tr('⚡ PACOTE DETECTADO!')}</b>
      <span class="fp-sub">${tr('[INTERCEPTAR]')}</span>
    </div>
  `;

  document.body.appendChild(el);
  activePacket = el;

  // Som sutil de drone passando
  try { sfx.whoosh(); } catch (e) {}

  const removePacket = () => {
    if (!activePacket) return;
    el.classList.add('fade-out');
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (activePacket === el) activePacket = null;
    }, 400);
  };

  el.addEventListener('click', e => {
    e.stopPropagation();
    au();
    sfx.zap();
    cyberConfetti({ count: 20, x: e.clientX, y: e.clientY });
    if (el.parentNode) el.parentNode.removeChild(el);
    activePacket = null;
    openCircuitPuzzle();
  });

  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });

  // Expira após 10 segundos de travessia
  setTimeout(removePacket, 9600);
}

export function initSniffer() {
  if (typeof window === 'undefined') return;
  window.spawnPacket = spawnPacket;

  const scheduleNext = () => {
    // Intervalo aleatório entre 45 e 75 segundos
    const delay = Math.floor(Math.random() * 30000 + 45000);
    clearTimeout(snifferTimer);
    snifferTimer = setTimeout(() => {
      spawnPacket();
      scheduleNext();
    }, delay);
  };

  // Primeiro pacote surge entre 25 e 40 segundos após o início
  snifferTimer = setTimeout(() => {
    spawnPacket();
    scheduleNext();
  }, 28000);
}
