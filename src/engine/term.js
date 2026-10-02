// Motor "term": troubleshooting num terminal. O jogador investiga rodando comandos
// (digitando ou tocando nos sugeridos) e depois responde os passos de diagnóstico e correção.
// Errar um passo custa integridade e explica o porquê, mas dá para tentar de novo.
import { $ } from './util.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { info, flow } from './ui.js';
import { runSteps } from './steps.js';
import { stat, unlock } from './ach.js';

const MIN_CMDS = 2;   // comandos diferentes antes de liberar o diagnóstico
const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
let L = null, ran = new Set(), ps = '';

export function renderTerm(level) {
  L = level; ran = new Set(); ps = L.prompt || L.host + '#';
  const st = $('stage');
  st.innerHTML = `${L.intro ? `<div class="task">${L.intro}</div>` : ''}
    <div class="term"><div class="tlog" id="tlog"></div>
      <form class="tline" id="tform"><span class="tps"></span><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></form></div>
    <div class="tstep" id="tstep"></div>`;
  st.querySelector('.tps').textContent = ps;
  print(`${L.host}: digite um comando ou toque num dos sugeridos abaixo. "?" lista os comandos.`, 'tsys');
  $('tform').onsubmit = e => { e.preventDefault(); if ($('tin').value.trim() && stat('typed') >= 10) unlock('teclado'); run($('tin').value); $('tin').value = ''; };
  const bank = $('bank');
  bank.innerHTML = `<div class="bankh"><span>COMANDOS · TOQUE PARA EXECUTAR</span><span id="bankCnt">0/${MIN_CMDS}</span></div>`;
  bank.style.display = 'flex';
  L.cmds.forEach(c => { const b = document.createElement('button'); b.className = 'cmd'; b.textContent = c.c; b.onclick = () => run(c.c); bank.append(b); });
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
