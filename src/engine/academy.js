// Academia de exercícios: prática sem fim, gerada na hora, sem perder integridade.
// Cada tema tem rodadas de 10 perguntas; acertar 10 seguidas (somando rodadas) domina o tema.
import { $, store, esc } from './util.js';
import { S } from './state.js';
import { flow, modal, closeModal } from './ui.js';
import { play, goMap } from './game.js';
import { ACAD } from './gen.js';
import { addXP, xpHTML } from './career.js';
import { unlock } from './ach.js';

const N = 10, GOAL = 10;
export const TOPICS = [
  ['bin', '🔢', 'Binário', 'decimal ↔ binário', ['Cada posição do octeto vale <b>128, 64, 32, 16, 8, 4, 2, 1</b>.', 'Binário → decimal: some as posições com <b>1</b>.', 'Decimal → binário: tire o maior valor que cabe (128, depois 64...) e marque 1 onde tirou.']],
  ['cidr', '🎭', 'Máscara e CIDR', '/24 ↔ 255.255.255.0', ['O CIDR conta os bits <b>1</b> da máscara: /24 = 255.255.255.0.', 'Num octeto, os valores possíveis da máscara são <b>128, 192, 224, 240, 248, 252, 254, 255</b> (1 a 8 bits ligados).', 'Cada 8 bits completam um 255: /16 = 255.255.0.0, /8 = 255.0.0.0.']],
  ['hosts', '🧮', 'Hosts por rede', 'quantos cabem numa /n', ['Bits de host = 32 − CIDR.', 'Endereços = 2^(bits de host). Hosts úteis = endereços − 2 (rede e broadcast).', 'Cada bit a menos de máscara dobra o tamanho: /24 = 254 hosts, /23 = 510.']],
  ['net', '🧭', 'Rede e broadcast', 'em que bloco o IP cai', ['Tamanho do bloco = 256 − último octeto da máscara (/26 → blocos de 64).', 'Os blocos começam em múltiplos do tamanho: .0, .64, .128, .192.', 'A <b>rede</b> é o primeiro endereço do bloco e o <b>broadcast</b>, o último.']],
  ['range', '🏷️', 'Tipos de IP', 'privado, público, CGNAT', ['Privado (RFC 1918): <b>10/8</b>, <b>172.16/12</b> (172.16 a 172.31) e <b>192.168/16</b>.', 'CGNAT (RFC 6598): <b>100.64/10</b>, de 100.64 a 100.127.', 'Link-local: <b>169.254/16</b>. O resto que não é reservado é público.']],
  ['port', '🚪', 'Portas e serviços', 'SSH 22, HTTPS 443...', ['A porta diz qual programa atende: <b>22</b> SSH, <b>53</b> DNS, <b>80</b> HTTP, <b>443</b> HTTPS.', '<b>123</b> NTP, <b>161</b> SNMP, <b>179</b> BGP, <b>3389</b> RDP.', 'DNS, NTP e SNMP usam <b>UDP</b>; SSH, HTTP(S), BGP e RDP usam <b>TCP</b>.']],
  ['wild', '🃏', 'Wildcard (ACL)', 'o inverso da máscara', ['A ACL Cisco usa <b>wildcard</b>: 255 menos cada octeto da máscara.', '/24 → 0.0.0.255, /30 → 0.0.0.3.', 'Bit 0 na wildcard = "tem que bater"; bit 1 = "tanto faz".']]
];
const rec = () => store('noc_acad') || {};
const top = id => ({ streak: 0, best: 0, total: 0, hits: 0, ...(rec()[id] || {}) });
export const mastered = () => TOPICS.filter(t => top(t[0]).best >= GOAL).length;

export function openAcademy() {
  modal(`<div class="tag">ACADEMIA DO NOC</div><h2>Prática sem fim</h2>
    <div class="fnote" style="margin-top:4px">Perguntas novas a cada rodada, sem perder integridade e sem cronômetro. Acerte <b>${GOAL} seguidas</b> num tema para dominá-lo.</div>
    <div class="acad">${TOPICS.map(([id, ico, name, sub]) => { const t = top(id), ok = t.best >= GOAL;
      return `<button class="acb${ok ? ' ok' : ''}" data-t="${id}"><span class="aci">${ico}</span><span class="act"><b>${name}</b><small>${sub}</small>
        <i class="acm"><i style="width:${Math.min(100, t.best / GOAL * 100)}%"></i></i></span><span class="acs">${ok ? '✓ DOMINADO' : `${t.best}/${GOAL}`}</span></button>`; }).join('')}</div>
    <div class="row"><button class="btn ghostb" id="mOk">FECHAR</button></div>`);
  $('mOk').onclick = closeModal;
  $('mcard').querySelectorAll('.acb').forEach(b => b.onclick = () => { closeModal(); startTopic(b.dataset.t); });
}

export function startTopic(id) {
  const [, ico, name, , lesson] = TOPICS.find(t => t[0] === id);
  play({ title: 'Academia: ' + name, tag: 'ACADEMIA', type: 'quiz', loc: 'desk', train: true, free: true, lesson,
    qs: Array.from({ length: N }, () => ACAD[id](Math.random)), cap: 'Abrindo o caderno de exercícios...',
    tip: 'Sem pressa: leia a explicação de cada resposta. Errar aqui não custa integridade.',
    onWin: () => finish(id) }, `${ico} Academia: ${name}`);
}

function finish(id) {
  const all = rec(), t = top(id), hits = S.qlog.filter(Boolean).length, was = t.best >= GOAL;
  S.qlog.forEach(ok => { t.streak = ok ? t.streak + 1 : 0; t.best = Math.max(t.best, t.streak); });
  t.total += S.qlog.length; t.hits += hits; all[id] = t; store('noc_acad', all);
  const now = t.best >= GOAL, r = addXP(5 + hits * 3);
  if (now && !was) unlock('academia');
  if (mastered() === TOPICS.length) unlock('academia_tudo');
  const [, ico, name] = TOPICS.find(x => x[0] === id);
  modal(`<div class="tag">ACADEMIA · ${ico} ${esc(name.toUpperCase())}</div><h2>${now && !was ? 'Tema dominado!' : hits === N ? 'Rodada perfeita!' : 'Rodada feita.'}</h2>
    <div class="pts"><span>Acertos</span><b>${hits}/${N}</b></div>
    <div class="pts"><span>Sequência atual</span><b>${t.streak}</b></div>
    <div class="pts"><span>Melhor sequência</span><b>${Math.min(t.best, 999)}/${GOAL}${now ? ' ✓' : ''}</b></div>
    <div class="pts"><span>Aproveitamento geral</span><b>${Math.round(t.hits / t.total * 100)}%</b></div>
    ${xpHTML(r)}
    <div class="learn"><b>DICA DE ESTUDO</b>${hits < 7 ? 'Releia a aula (botão ?) e faça mais uma rodada: repetir com explicação é o que fixa.' : 'Mandou bem. Tente outro tema ou siga para as fases do mapa.'}</div>
    <div class="row"><button class="btn ghostb" id="mMap">TEMAS</button><button class="btn" id="mAgain">MAIS ${N}</button></div>`);
  $('mMap').onclick = () => { closeModal(); goMap(); openAcademy(); };
  $('mAgain').onclick = () => { closeModal(); startTopic(id); };
}

// Cartão no mapa, abaixo do treino.
function card() {
  const box = $('acadBox'); if (!box) return;
  const m = mastered();
  box.innerHTML = `<button class="daily acadc" id="acadBtn"><span class="di">🎓</span><span class="dt"><b>Academia de exercícios</b><small>Prática sem fim · ${m}/${TOPICS.length} temas dominados</small></span><span class="dg">PRATICAR</span></button>`;
  $('acadBtn').onclick = openAcademy;
}
export function initAcademy() { flow.acad = card; }
