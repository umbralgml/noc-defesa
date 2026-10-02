// Perguntas de diagnóstico em passos, usadas pelo terminal e pela topologia.
// Errar custa integridade, explica e entra no treino; acertar avança. No último passo, done().
import { $, shuffle, center } from './util.js';
import { good, damage, explain, note } from './ui.js';
import { S } from './state.js';
import { bankAdd } from './bank.js';

export const opt = o => typeof o === 'string' ? { t: o } : o;

// box: elemento onde as perguntas aparecem. onRight(q) roda a cada acerto (ex.: imprimir saída).
export function runSteps(box, L, steps, onRight, done) {
  let i = 0;
  const show = () => {
    if (!box.isConnected) return;
    const q = steps[i];
    box.innerHTML = `<div class="qmeta">DIAGNÓSTICO ${i + 1}/${steps.length}</div><div class="q"></div><div class="topts"></div>`;
    box.querySelector('.q').textContent = q.q;
    shuffle(q.o.map((o, k) => ({ ...opt(o), ok: k === q.a }))).forEach(o => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = o.t;
      b.onclick = () => answer(b, o, q); box.querySelector('.topts').append(b);
    });
    // a pergunta nova pode surgir fora da tela no celular
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const answer = (b, o, q) => {
    if (S.busy || b.disabled) return;
    const at = center(b);
    if (!o.ok) {
      b.disabled = true; b.classList.add('wrong');
      explain(false, o.t, o.why || q.why, false);
      note(q.q, `Resposta: ${opt(q.o[q.a]).t}. ${q.why}`);
      bankAdd(`${L.title}|${q.q}`, { lv: L.title, q: q.q, o: q.o, a: q.a, why: q.why });
      damage(15, at); return;
    }
    box.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x === b) x.classList.add('right'); });
    explain(true, o.t, q.why); good(at);
    if (onRight) onRight(q);
    if (++i >= steps.length) done(); else setTimeout(show, 900);
  };
  show();
}
