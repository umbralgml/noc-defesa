// Motor "quiz": perguntas de múltipla escolha. Com "boss": true vira o chefe final,
// com cronômetro por pergunta e barra de vida do Z3R0 (precisa acertar 70%).
import { $, shuffle, center } from './util.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { good, damage, toast, note, ZHURT, flow } from './ui.js';
import { bankAdd } from './bank.js';

let L = null, left = 0;
// Opção no JSON pode ser "texto" ou { "t": texto, "why": por que está errada }.
const opt = o => typeof o === 'string' ? { t: o } : o;
const bossPct = () => Math.max(0, 100 - S.hits / S.needHits * 100);

export function renderQuiz(level) {
  L = level;
  $('bank').style.display = 'none';
  S.qi = 0; S.hits = 0; S.needHits = L.boss ? Math.ceil(L.qs.length * .7) : L.qs.length;
  S.qlog = []; S.left = 0;   // acerto de cada pergunta e segundos que sobraram nos acertos
  showQ();
}

function showQ() {
  const q = L.qs[S.qi];
  // A resposta certa é q.o[q.a]; as opções são embaralhadas na tela.
  const opts = shuffle(q.o.map((o, i) => ({ ...opt(o), ok: i === q.a })));
  const st = $('stage');
  st.innerHTML = (L.boss ? `<div class="bossbar"><div class="b"><span>Z3R0 · CONEXÃO C2</span><div class="bb"><div id="bossFill" style="width:${bossPct()}%"></div></div></div></div>` : '')
    + `<div class="qmeta">PERGUNTA ${S.qi + 1}/${L.qs.length}${L.boss ? ' · ACERTOS ' + S.hits + '/' + S.needHits : ''}</div>`
    + (L.time ? `<div class="timer"><div id="tFill"></div></div>` : '')
    + `<div class="q"></div><div id="opts"></div><div id="whyBox"></div>`;
  st.querySelector('.q').textContent = q.q;
  opts.forEach(o => { const b = document.createElement('button'); b.className = 'opt'; b.textContent = o.t; b._ok = o.ok; b._why = o.why; b.onclick = () => answer(b); $('opts').append(b); });
  st.scrollTop = 0;
  left = (L.time || 0) * 1000;
  if (L.time) {
    clearInterval(S.timer);
    S.timer = setInterval(() => {
      left -= 100;
      const f = $('tFill'); if (f) { f.style.width = Math.max(0, left / (L.time * 10)) + '%'; f.style.background = left < 5000 ? '#ff4d6d' : ''; }
      if (left <= 3000 && left % 1000 === 0) sfx.tick();
      if (left <= 0) { clearInterval(S.timer); answer(null); }
    }, 100);
  }
}

function answer(btn) {
  if (S.busy) return;
  clearInterval(S.timer);
  const q = L.qs[S.qi], ok = !!(btn && btn._ok);
  S.qlog.push(ok); if (ok && L.time) S.left += Math.max(0, Math.ceil(left / 1000));
  document.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b._ok) b.classList.add('right'); });
  if (btn && !ok) btn.classList.add('wrong');
  const at = btn ? center(btn) : center($('stage'));
  if (ok) {
    S.hits++; good(at);
    if (L.boss) { sfx.zap(); toast(ZHURT[Math.random() * ZHURT.length | 0], false); const f = $('bossFill'); if (f) f.style.width = bossPct() + '%'; }
  } else {
    note(q.q, `Resposta: ${opt(q.o[q.a]).t}. ${q.why}`);
    if (!L.train) bankAdd(`${L.title}|${q.q}`, { lv: L.title, q: q.q, o: q.o, a: q.a, why: q.why });
    damage(L.boss ? 20 : 15, at);
    if (!btn) toast('Tempo esgotado! Hahaha!', false);
    if (S.hp <= 0) return;
  }
  const bossDown = L.boss && S.hits >= S.needHits, lastQ = S.qi >= L.qs.length - 1;
  const wb = $('whyBox');
  wb.innerHTML = `<div class="why"><b style="color:${ok ? 'var(--acc)' : 'var(--bad)'}">${ok ? 'Correto.' : (btn ? 'Errado.' : 'Tempo esgotado.')}</b> <span></span>${btn && !ok && btn._why ? '<div class="whyno"></div>' : ''}<button class="btn" id="qNext">${bossDown ? 'DERRUBAR O Z3R0' : lastQ ? 'FINALIZAR' : 'CONTINUAR'}</button></div>`;
  wb.querySelector('span').textContent = q.why;
  const wn = wb.querySelector('.whyno');
  if (wn) { wn.innerHTML = '<b>Sobre a sua resposta:</b> <span></span>'; wn.querySelector('span').textContent = btn._why; }
  wb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('qNext').onclick = () => {
    if (bossDown) { flow.win(); return; }
    if (lastQ) { if (L.boss) { S.busy = true; flow.fail('Você não acertou o suficiente e o Z3R0 escapou pela VPN.'); } else flow.win(); return; }
    S.qi++; showQ();
  };
}
