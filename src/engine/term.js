// Motor "term": troubleshooting num terminal. O jogador investiga rodando comandos
// (digitando ou tocando nos sugeridos) e depois responde os passos de diagnóstico e correção.
// Errar um passo custa integridade e explica o porquê, mas dá para tentar de novo.
import { $, shuffle, center } from './util.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { good, damage, explain, info, note, flow } from './ui.js';

const MIN_CMDS = 2;   // comandos diferentes antes de liberar o diagnóstico
const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
const opt = o => typeof o === 'string' ? { t: o } : o;
let L = null, ran = new Set(), step = 0;

export function renderTerm(level) {
  L = level; ran = new Set(); step = 0;
  const st = $('stage');
  st.innerHTML = `${L.intro ? `<div class="task">${L.intro}</div>` : ''}
    <div class="term"><div class="tlog" id="tlog"></div>
      <form class="tline" id="tform"><span class="tps"></span><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></form></div>
    <div class="tstep" id="tstep"></div>`;
  st.querySelector('.tps').textContent = L.host + '#';
  print(`${L.host} — digite um comando ou toque num dos sugeridos abaixo. "?" lista os comandos.`, 'tsys');
  $('tform').onsubmit = e => { e.preventDefault(); run($('tin').value); $('tin').value = ''; };
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
  print(`${L.host}# ${raw.trim()}`, 'tcmd'); sfx.key();
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
  const q = L.steps[step];
  box.innerHTML = `<div class="qmeta">DIAGNÓSTICO ${step + 1}/${L.steps.length}</div><div class="q"></div><div class="topts"></div><div id="whyBox"></div>`;
  box.querySelector('.q').textContent = q.q;
  shuffle(q.o.map((o, i) => ({ ...opt(o), ok: i === q.a }))).forEach(o => {
    const b = document.createElement('button'); b.className = 'opt'; b.textContent = o.t;
    b.onclick = () => answer(b, o, q); box.querySelector('.topts').append(b);
  });
}

function answer(b, o, q) {
  if (S.busy || b.disabled) return;
  const at = center(b);
  if (!o.ok) {
    b.disabled = true; b.classList.add('wrong');
    explain(false, o.t, o.why || q.why, false);
    note(q.q, `Resposta: ${opt(q.o[q.a]).t}. ${q.why}`);
    damage(15, at); return;
  }
  $('tstep').querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x === b) x.classList.add('right'); });
  explain(true, o.t, q.why); good(at);
  if (q.run) print(`${L.host}# ${q.run}`, 'tcmd');
  if (q.out) print(q.out, 'tok');
  step++;
  if (step >= L.steps.length) { S.busy = true; setTimeout(() => flow.win(), 1400); }
  else setTimeout(showStep, 900);
}
