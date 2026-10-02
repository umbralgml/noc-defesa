// Treino dos seus erros: quiz rápido (sem cronômetro) com os itens do banco de erros.
// Acertou 2 vezes seguidas, o item sai da lista. Fica no mapa logo abaixo do desafio diário.
import { $ } from './util.js';
import { S } from './state.js';
import { flow, modal, closeModal } from './ui.js';
import { play, goMap } from './game.js';
import { bankItems, bankResult } from './bank.js';
import { addXP, xpHTML } from './career.js';
import { unlock, stat } from './ach.js';

const N = 5;

export function startTrain() {
  const items = bankItems().slice(0, N);
  if (!items.length) return;
  play({ title: 'Treino dos seus erros', tag: 'TREINO', type: 'quiz', loc: 'desk', train: true,
    qs: items.map(({ q, o, a, why }) => ({ q, o, a, why })), cap: 'Revisando os seus erros...',
    tip: 'Leia a explicação de cada resposta: é ela que fixa o conteúdo. Dois acertos seguidos tiram o item da lista.',
    onWin: () => finish(items) }, 'Treino dos seus erros');
}

function finish(items) {
  let out = 0;
  items.forEach((it, k) => { out += bankResult(it.id, !!S.qlog[k]); });
  const hits = S.qlog.filter(Boolean).length, r = addXP(5 + hits * 10), left = bankItems().length;
  if (out) { unlock('treino'); if (stat('treinoOut', out) >= 10) unlock('treino10'); }
  modal(`<div class="tag">TREINO DOS SEUS ERROS</div><h2>${hits === items.length ? 'Revisão perfeita!' : 'Revisão feita.'}</h2>
    <div class="pts"><span>Acertos</span><b>${hits}/${items.length}</b></div>
    <div class="pts"><span>Itens dominados (2 acertos seguidos)</span><b>${out}</b></div>
    <div class="pts"><span>Ainda na lista</span><b>${left}</b></div>
    ${xpHTML(r)}
    <div class="learn"><b>COMO FUNCIONA</b>Cada erro nas fases entra aqui. Acertou duas vezes seguidas, o item sai da lista. Errar de novo zera a contagem.</div>
    <div class="row"><button class="btn ghostb" id="mMap">MAPA</button>${left ? '<button class="btn" id="mAgain">TREINAR DE NOVO</button>' : ''}</div>`);
  $('mMap').onclick = () => { closeModal(); goMap(); };
  if ($('mAgain')) $('mAgain').onclick = () => { closeModal(); startTrain(); };
}

// Cartão no mapa (só aparece se houver itens).
function card() {
  const box = $('trainBox'); if (!box) return;
  const n = bankItems().length;
  box.innerHTML = n ? `<button class="daily trainc" id="trainBtn"><span class="di">🧠</span><span class="dt"><b>Treino dos seus erros</b><small>${n} ${n > 1 ? 'itens' : 'item'} para revisar · ${Math.min(n, N)} por rodada</small></span><span class="dg">TREINAR</span></button>` : '';
  if (n) $('trainBtn').onclick = startTrain;
}
export function initTrain() { flow.train = card; }
