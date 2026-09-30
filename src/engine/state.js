// Estado da partida em andamento e progresso salvo no navegador.
// LEVELS e ACTS começam vazios e são preenchidos por loadLevels() (levels.js).

export const LEVELS = [];   // fases na ordem do mapa; cada uma recebe .act (índice do ato)
export const ACTS = [];     // [tag, nome] de cada ato, ex.: ['ATO 1', 'Camada física e endereçamento']

export const S = {
  prog: {}, best: {},       // estrelas e melhor pontuação por fase (chave = título)
  cur: 0, hp: 100, err: 0, placed: 0, need: 0, busy: false,
  pairs: [], timer: null, intro: [], score: 0, combo: 1,
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
export const unlocked = i => i === 0 || (S.prog[K(i - 1)] || 0) > 0;
