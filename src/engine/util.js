// Utilitários sem dependências: DOM, sorteio e formatação.
export const $ = id => document.getElementById(id);
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const fmt = n => n.toLocaleString('pt-BR');
export const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
export const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// localStorage com JSON, sem quebrar em aba anônima: store(k) lê, store(k, v) grava, store(k, null) apaga.
export const store = (k, v) => {
  try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }
  catch (e) { return null; }
};
// Variações da pergunta: "v" no JSON (texto ou { q, o, a, why }). n = quantas vezes o jogador já errou ela.
export const vary = (q, n = 0) => { const l = [q, ...(q.v || [])], x = l[n % l.length]; return typeof x === 'string' ? { ...q, q: x } : { ...q, ...x }; };
// Erros por pergunta (localStorage noc_vary): cada erro faz a pergunta voltar reescrita.
export const missN = k => (store('noc_vary') || {})[k] || 0;
export const missInc = k => { const m = store('noc_vary') || {}; m[k] = (m[k] || 0) + 1; store('noc_vary', m); };
