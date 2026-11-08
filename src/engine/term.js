// Motor "term": troubleshooting num terminal. O jogador investiga rodando comandos
// (digitando ou tocando nos sugeridos) e depois responde os passos de diagnóstico e correção.
// Errar um passo custa integridade e explica o porquê, mas dá para tentar de novo.
import { $ } from './util.js';
import { t } from './i18n.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { info, flow, glossCard } from './ui.js';
import { cmdGloss } from './glossary.js';
import { runSteps } from './steps.js';
import { stat, unlock } from './ach.js';
import { cyberConfetti } from './particles.js';

const MIN_CMDS = 2;   // comandos diferentes antes de liberar o diagnóstico
const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
let L = null, ran = new Set(), ps = '', hist = [], histIdx = -1;

export function renderTerm(level) {
  L = level; ran = new Set(); ps = L.prompt || L.host + '#'; hist = []; histIdx = -1;
  const st = $('stage');
  st.innerHTML = `${L.intro ? `<div class="task">${L.intro}</div>` : ''}
    <div class="term"><div class="tlog" id="tlog"></div>
      <form class="tline" id="tform"><span class="tps"></span><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></form></div>
    <div class="tstep" id="tstep"></div>`;
  st.querySelector('.tps').textContent = ps;
  print(`${L.host}: digite um comando ou toque num dos sugeridos abaixo. "?" lista os comandos.`, 'tsys');
  $('tform').onsubmit = e => {
    e.preventDefault();
    const val = $('tin').value.trim();
    if (val) {
      if (stat('typed') >= 10) unlock('teclado');
      hist.push(val);
      histIdx = hist.length;
    }
    run(val);
    $('tin').value = '';
  };
  let lastKey = 0;
  $('tin').oninput = () => {
    const now = performance.now();
    if (now - lastKey > 55) { lastKey = now; sfx.key(); }
  };
  $('tin').onkeydown = e => {
    if (e.key === 'ArrowUp') {
      if (!hist.length) return;
      e.preventDefault();
      if (histIdx > 0) histIdx--;
      $('tin').value = hist[histIdx] || '';
    } else if (e.key === 'ArrowDown') {
      if (!hist.length) return;
      e.preventDefault();
      if (histIdx < hist.length - 1) {
        histIdx++;
        $('tin').value = hist[histIdx];
      } else {
        histIdx = hist.length;
        $('tin').value = '';
      }
    }
  };
  const bank = $('bank');
  const cards = L.cmds.some(c => cmdGloss(c.c));
  bank.innerHTML = `<div class="bankh"><span>COMANDOS · TOQUE PARA EXECUTAR${cards ? ' · ? EXPLICA' : ''}</span><span id="bankCnt">0/${MIN_CMDS}</span></div>`;
  bank.style.display = 'flex';
  L.cmds.forEach(c => {
    const b = document.createElement('button'); b.className = 'cmd'; b.textContent = c.c; b.onclick = () => run(c.c);
    const g = cmdGloss(c.c);
    if (!g) { bank.append(b); return; }
    // Comando com cartão: o "?" abre o que ele é, sem rodar nada.
    const w = document.createElement('span'), q = document.createElement('button');
    w.className = 'cmdw'; q.className = 'cmdi'; q.type = 'button'; q.textContent = '?'; q.setAttribute('aria-label', 'O que é ' + g[0]);
    q.onclick = () => glossCard(g, '⌨ COMANDO'); w.append(b, q); bank.append(w);
  });
  showStep();
}

function print(text, cls) {
  const log = $('tlog'); if (!log) return;
  const d = document.createElement('div'); d.className = cls || 'tout'; d.textContent = text;
  log.append(d); log.scrollTop = log.scrollHeight;
}

function run(raw) {
  if (S.busy) return;
  const n = norm(raw); if (!n) return;
  print(`${ps} ${raw.trim()}`, 'tcmd'); sfx.key();
  if (n === '?' || n === 'help') { print('Comandos disponíveis:\n' + L.cmds.map(c => '  ' + c.c).join('\n'), 'tsys'); return; }
  if (n === 'clear' || n === 'cls') { $('tlog').innerHTML = ''; return; }
  if (n === 'matrix') {
    unlock('easter');
    sfx.whoosh();
    cyberConfetti({ count: 65 });
    print(t('10100110 01001111 01000011 ... Conectando à Matrix do NOC ...'), 'tok');
    print(t('Acorde, analista. O plantão é real. Siga o pacote verde.'), 'tsys');
    return;
  }
  if (n === 'z3r0' || n === 'hacker') {
    unlock('easter');
    sfx.bad();
    const stage = $('stage');
    if (stage) { stage.classList.add('alarm'); setTimeout(() => stage.classList.remove('alarm'), 1200); }
    print(t('>>> [Z3R0 INTERCEPT]: Achou que estava no controle da rede?'), 'terr');
    print(t('[Z3R0]: Cada byte que passa por esse switch passa pelos meus olhos. Desconecte enquanto ainda há tempo...'), 'terr');
    return;
  }
  if (n === 'sudo rm -rf /' || n === 'rm -rf /' || n === 'sudo rm -rf /*') {
    unlock('easter');
    sfx.bad();
    print(t('⚠️ KERNEL PANIC ABORTADO: Tentativa de autodestruição do NOC bloqueada.'), 'terr');
    print(t('O estagiário foi escoltado para fora da sala do datacenter com segurança.'), 'tsys');
    return;
  }
  if (n === 'cat /etc/shadow') {
    unlock('easter');
    print(t('root:$6$Z3R0$k9xLq... [HASH SHA-512]: ACESSO NEGADO!'), 'terr');
    print(t('Dica do NOC: o /etc/shadow só o root lê e guarda as senhas em hash; use sempre senhas fortes e MFA.'), 'tsys');
    return;
  }
  if (n === 'neofetch' || n === 'fastfetch') {
    unlock('easter');
    sfx.sel();
    print('   _  _  ___   ____\n  | \\| |/ _ \\ / ___|   OS: NOC-Defense Linux v2.4 (x86_64)\n  | .` | (_) | |___    Kernel: 6.8.0-noc-hardened\n  |_|\\_|\\___/ \\____|   Uptime: 03:12:44 (PLANTÃO ATIVO)\n                       Shell: bash 5.2.21', 'tok');
    return;
  }
  const c = L.cmds.find(c => norm(c.c) === n || (c.alias || []).some(a => norm(a) === n));
  if (!c) { print('% Comando inválido ou indisponível neste cenário. Digite ? para ver a lista.', 'terr'); return; }
  print(c.out);
  if (!ran.has(c.c)) {
    ran.add(c.c);
    if (c.why) info(c.c, c.why);
    const bc = $('bankCnt'); if (bc) bc.textContent = Math.min(ran.size, MIN_CMDS) + '/' + MIN_CMDS;
    [...$('bank').querySelectorAll('.cmd')].find(b => b.textContent === c.c)?.classList.add('done');
    if (ran.size === MIN_CMDS) showStep();
  }
}

function showStep() {
  const box = $('tstep'); if (!box) return;
  if (ran.size < MIN_CMDS) { box.innerHTML = `<div class="tlock">🔎 Investigue: rode pelo menos ${MIN_CMDS} comandos para liberar o diagnóstico.</div>`; return; }
  runSteps(box, L, L.steps, q => { if (q.run) print(`${ps} ${q.run}`, 'tcmd'); if (q.out) print(q.out, 'tok'); },
    () => { S.busy = true; setTimeout(() => flow.win(), 1400); });
}
