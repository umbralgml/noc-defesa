// Carreira do analista: XP acumulado e o cargo correspondente (só local).
import { store } from './util.js';

export const RANKS = [
  [0, 'Estagiário'], [300, 'Analista N1'], [900, 'Analista N2'], [1800, 'Analista N3'], [3000, 'Especialista'], [4500, 'Arquiteto de Redes']
];
export const xp = () => store('noc_xp') || 0;
export function rankOf(v = xp()) {
  let i = 0; RANKS.forEach((r, k) => { if (v >= r[0]) i = k; });
  const next = RANKS[i + 1];
  return { i, name: RANKS[i][1], v, next: next ? next[0] : null, nextName: next ? next[1] : null, pct: next ? Math.round((v - RANKS[i][0]) / (next[0] - RANKS[i][0]) * 100) : 100 };
}
// Soma XP e diz se subiu de cargo.
export function addXP(n) {
  const before = rankOf(), v = xp() + Math.max(0, Math.round(n));
  store('noc_xp', v);
  const after = rankOf(v);
  return { gained: n, after, up: after.i > before.i };
}
// HTML curto para telas de resultado.
export const xpHTML = r => `<div class="xpline"><b>+${r.gained} XP</b> · ${r.after.name}<i class="xpbar"><i style="width:${r.after.pct}%"></i></i>${r.up ? `<span class="xpup">PROMOVIDO!</span>` : ''}</div>`;
