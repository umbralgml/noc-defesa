// Perguntas de diagnóstico em passos, usadas pelo terminal e pela topologia.
// Errar custa integridade, explica e entra no treino; acertar avança. No último passo, done().
import { $, shuffle, center, vary, missN, missInc } from './util.js';
import { good, damage, explain, note } from './ui.js';
import { S } from './state.js';
import { bankAdd } from './bank.js';

export const opt = o => typeof o === 'string' ? { t: o } : o;

// box: elemento onde as perguntas aparecem. onRight(q) roda a cada acerto (ex.: imprimir saída).
// Errou: a mesma pergunta volta reescrita (campo "v"), com as opções em outra ordem e a errada riscada.
export function runSteps(box, L, steps, onRight, done) {
  let i = 0, bad = new Set();
  const show = () => {
    if (!box.isConnected || S.hp <= 0) return;
    const base = steps[i], key = `${L.title}|${base.q}`, q = vary(base, missN(key));
    box.innerHTML = `<div class="qmeta">DIAGNÓSTICO ${i + 1}/${steps.length}</div><div class="q"></div><div class="topts"></div>`;
    box.querySelector('.q').textContent = q.q;
    shuffle(q.o.map((o, k) => ({ ...opt(o), ok: k === q.a }))).forEach(o => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = o.t;
      if (bad.has(o.t)) { b.disabled = true; b.classList.add('wrong'); }
      b.onclick = () => answer(b, o, q, base, key); box.querySelector('.topts').append(b);
    });
    // a pergunta nova pode surgir fora da tela no celular
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const answer = (b, o, q, base, key) => {
    if (S.busy || b.disabled) return;
    const at = center(b);
    box.querySelectorAll('.opt').forEach(x => { x.disabled = true; });
    if (!o.ok) {
      b.classList.add('wrong'); bad.add(o.t);
      explain(false, o.t, o.why || q.why, false);
      note(q.q, `Resposta: ${opt(q.o[q.a]).t}. ${q.why}`);
      bankAdd(key, { lv: L.title, q: base.q, o: base.o, a: base.a, why: base.why, v: base.v });
      missInc(key); damage(15, at);
      setTimeout(show, 1200); return;
    }
    b.classList.add('right'); bad = new Set();
    explain(true, o.t, q.why); good(at);
    if (onRight) onRight(q);
    if (++i >= steps.length) done(); else setTimeout(show, 900);
  };
  show();
}
