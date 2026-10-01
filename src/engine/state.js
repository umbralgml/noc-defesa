// Estado da partida em andamento e progresso salvo no navegador.
// LEVELS e ACTS começam vazios e são preenchidos por loadLevels() (levels.js).

export const LEVELS = [];   // fases na ordem do mapa; cada uma recebe .act (índice do ato)
export const ACTS = [];     // [tag, nome] de cada ato, ex.: ['ATO 1', 'Camada física e endereçamento']

export const S = {
  prog: {}, best: {},       // estrelas e melhor pontuação por fase (chave = título)
  cur: 0, hp: 100, err: 0, placed: 0, need: 0, busy: false,
  lv: null,                 // fase em andamento (do mapa ou montada na hora, como o desafio diário)
  pairs: [], timer: null, intro: [], score: 0, streak: 0,   // streak = acertos seguidos; multiplicador = min(5, streak)
  miss: []                  // erros da fase atual, mostrados na revisão: { t, why }
};

try {
  S.prog = JSON.parse(localStorage.getItem('noc_prog') || '{}') || {};
  S.best = JSON.parse(localStorage.getItem('noc_best') || '{}') || {};
} catch (e) {}

export const save = () => { try { localStorage.setItem('noc_prog', JSON.stringify(S.prog)); localStorage.setItem('noc_best', JSON.stringify(S.best)); } catch (e) {} };
export const resetProgress = () => { S.prog = {}; S.best = {}; save(); };

// O progresso é indexado pelo TÍTULO da fase. Renomear uma fase apaga o progresso dela.
export const K = i => LEVELS[i].title;
// Liberada: a primeira, as que já têm estrela (mesmo se entrou fase nova antes delas) e a seguinte de uma concluída.
export const unlocked = i => i === 0 || (S.prog[K(i)] || 0) > 0 || (S.prog[K(i - 1)] || 0) > 0;

// Resumo do progresso salvo: estrelas, pontos e fases concluídas.
export function progress() {
  let stars = 0, pts = 0, done = 0;
  LEVELS.forEach((L, i) => { const st = S.prog[K(i)] || 0; stars += st; pts += S.best[K(i)] || 0; if (st) done++; });
  return { stars, pts, done, max: LEVELS.length * 3 };
}
