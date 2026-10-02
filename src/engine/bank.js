// Banco de erros para o treino: cada erro vira uma pergunta de revisão (formato do quiz).
// Sem dependências de tela, para os motores poderem gravar sem import circular.
import { store } from './util.js';

const KEY = 'noc_bank', MAX = 60;
export const bankItems = () => store(KEY) || [];
const strip = s => String(s || '').replace(/<[^>]+>/g, '');

// Grava (ou reinicia) um item. q = { q, o: [{ t, why }...], a, why }.
export function bankAdd(id, item) {
  const list = bankItems().filter(x => x.id !== id);
  list.push({ id, ...item, q: strip(item.q), hits: 0 });
  store(KEY, list.slice(-MAX));
}

// Pergunta "o que é verdade sobre X?": a explicação certa contra explicações de outros itens da mesma fase.
export function bankWhy(lv, label, why, others) {
  const wrong = [...new Set(others.filter(w => w && w !== why))].sort(() => Math.random() - .5).slice(0, 3);
  if (!why || wrong.length < 2) return;
  bankAdd(`${lv}|${label}`, { lv, q: `${lv}: qual afirmação é verdadeira sobre "${label}"?`, o: [why, ...wrong.map(t => ({ t, why: 'Essa explicação é de outro item da mesma fase.' }))], a: 0, why });
}

// Resultado de uma rodada de treino: acertou soma, errou zera. Dois acertos tiram da lista.
export function bankResult(id, ok) {
  let removed = 0;
  const list = bankItems().flatMap(x => {
    if (x.id !== id) return [x];
    const hits = ok ? x.hits + 1 : 0;
    if (hits >= 2) { removed = 1; return []; }
    return [{ ...x, hits }];
  });
  store(KEY, list);
  return removed;
}
