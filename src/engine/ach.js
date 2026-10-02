// Conquistas: verificadas em momentos-chave do jogo; cada uma vale XP e aparece numa faixa no topo.
import { $, store, esc } from './util.js';
import { S, LEVELS, ACTS, K, progress } from './state.js';
import { addXP } from './career.js';
import { sfx } from './audio.js';

export const ACH = [
  ['primeiro', '🎖️', 'Primeiro plantão', 'Vença a primeira fase.'],
  ['semerro', '🎯', 'Mão firme', 'Vença uma fase sem nenhum erro.'],
  ['combo5', '🔥', 'Em chamas', 'Chegue ao combo x5.'],
  ['prologo', '🎓', 'Formado no básico', 'Conclua o Prólogo.'],
  ['atoperfeito', '💎', 'Ato perfeito', 'Faça 3 estrelas em todas as fases de um ato.'],
  ['linux', '🐧', 'Pinguim de plantão', 'Conclua o ato Linux no NOC.'],
  ['chefe', '💀', 'Z3R0 offline', 'Derrote o chefe final.'],
  ['intocavel', '🛡️', 'Intocável', 'Derrote o chefe com 100% de integridade.'],
  ['temporada2', '🌐', 'Temporada 2', 'Vença uma fase depois do chefe final.'],
  ['teclado', '⌨️', 'Mãos no teclado', 'Digite 10 comandos no terminal (sem tocar nos sugeridos).'],
  ['relampago', '⚡', 'Bloqueio relâmpago', 'Bloqueie um ataque relâmpago do Z3R0.'],
  ['diario', '☀️', 'Bom dia, NOC', 'Complete um desafio diário.'],
  ['diario5', '🌟', 'Plantão perfeito', 'Faça 5/5 no desafio diário.'],
  ['seq3', '📅', 'Três noites seguidas', 'Faça o desafio diário 3 dias seguidos.'],
  ['seq7', '🗓️', 'Semana de plantão', 'Faça o desafio diário 7 dias seguidos.'],
  ['duelo', '⚔️', 'Duelista', 'Vença um duelo contra um colega.'],
  ['treino', '🧠', 'Aprendi com o erro', 'Tire um item do treino dos seus erros.'],
  ['treino10', '📚', 'Revisão em dia', 'Tire 10 itens do treino dos seus erros.'],
  ['metade', '⭐', 'Meio caminho', 'Junte metade de todas as estrelas.'],
  ['tudo', '🏆', 'Arquiteto do NOC', 'Conclua todas as fases.']
];
const got = () => store('noc_ach') || {};
export const achCount = () => Object.keys(got()).length;
export const stat = (k, n = 1) => { const s = store('noc_stats') || {}; s[k] = (s[k] || 0) + n; store('noc_stats', s); return s[k]; };

// Desbloqueia (uma vez) e mostra a faixa. Devolve true se for nova.
export function unlock(id) {
  const g = got(); if (g[id]) return false;
  const a = ACH.find(x => x[0] === id); if (!a) return false;
  g[id] = Date.now(); store('noc_ach', g); addXP(50);
  banner(a); return true;
}
let bt;
function banner(a) {
  const el = $('achv'); if (!el) return;
  el.innerHTML = `<span class="ai">${a[1]}</span><span><small>CONQUISTA · +50 XP</small><b>${esc(a[2])}</b></span>`;
  el.className = 'achv'; void el.offsetWidth; el.className = 'achv on';
  try { sfx.ok(5); } catch (e) {}
  clearTimeout(bt); bt = setTimeout(() => { el.className = 'achv'; }, 3200);
}

// Verificações depois de vencer uma fase do mapa.
export function onLevelWin(L, stars) {
  unlock('primeiro');
  if (S.err === 0) unlock('semerro');
  const actLv = LEVELS.map((x, i) => [x, i]).filter(([x]) => x.act === L.act);
  const actDone = actLv.every(([, i]) => S.prog[K(i)]), act = ACTS[L.act] || [];
  if (actDone && act[0] === 'PRÓLOGO') unlock('prologo');
  if (actDone && /linux/i.test(act[1] || '')) unlock('linux');
  if (actLv.every(([, i]) => S.prog[K(i)] === 3)) unlock('atoperfeito');
  if (L.boss) { unlock('chefe'); if (S.hp === 100) unlock('intocavel'); }
  const bossI = LEVELS.findIndex(x => x.boss);
  if (bossI >= 0 && LEVELS.indexOf(L) > bossI) unlock('temporada2');
  const p = progress();
  if (p.stars * 2 >= p.max) unlock('metade');
  if (p.done === LEVELS.length) unlock('tudo');
}

export function achHTML() {
  const g = got();
  return `<div class="achgrid">${ACH.map(a => `<div class="ach${g[a[0]] ? ' on' : ''}"><span class="ai">${g[a[0]] ? a[1] : '🔒'}</span><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div>`).join('')}</div>`;
}
