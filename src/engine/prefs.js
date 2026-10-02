// Preferências do jogador: visual do analista (destravado por estrelas, ouro e conquistas)
// e acessibilidade (alto contraste, texto maior, menos animação). Tudo fica no aparelho.
import { $, store, esc } from './util.js';
import { progress } from './state.js';
import { modal, closeModal } from './ui.js';
import { sfx } from './audio.js';

// need: { s: estrelas } | { g: estrelas de ouro } | { a: conquista }
export const SHIRTS = [
  ['noc', 'Verde NOC', ['#00a884', '#008f70', '#0b6e57'], null],
  ['azul', 'Azul suporte', ['#2f7bff', '#2562cc', '#173f85'], { s: 6 }],
  ['roxo', 'Roxo DevOps', ['#8b5cf6', '#6d44c9', '#47288a'], { s: 15 }],
  ['laranja', 'Laranja campo', ['#ff7a2f', '#d9601c', '#8f3d0f'], { s: 30 }],
  ['soc', 'Preto SOC', ['#2a3346', '#1e2636', '#0e131d'], { s: 50 }],
  ['z3r0', 'Vermelho Z3R0', ['#ff2e63', '#d31e4f', '#80102d'], { a: 'chefe' }],
  ['ouro', 'Dourado', ['#e8b923', '#c29610', '#7d600a'], { g: 1 }]
];
export const HAIR = ['#2b1d14', '#0e0e12', '#c99a4b', '#a8431f', '#9aa3b5'];
export const SKIN = ['#f1c8a4', '#d9a77f', '#b07a52', '#7c4f33', '#4f3122'];
export const ACC = [['headset', 'Headset', null], ['none', 'Nada', null], ['cap', 'Boné', { s: 20 }]];
const DEF = { shirt: 'noc', hair: 0, skin: 1, acc: 'headset', hc: false, big: false, calm: null };

export const prefs = () => ({ ...DEF, ...(store('noc_prefs') || {}) });
export const golds = () => (store('noc_gold') || []).length;
const has = need => {
  if (!need) return true;
  if (need.s) return progress().stars >= need.s;
  if (need.g) return golds() >= need.g;
  return !!(store('noc_ach') || {})[need.a];
};
const needTxt = n => n.s ? `${n.s}★` : n.g ? `${n.g} ★ de ouro` : 'derrote o Z3R0';

// Aplica tudo no <html>: cores do herói em variáveis CSS e classes de acessório/acessibilidade.
export function applyPrefs() {
  const p = prefs(), r = document.documentElement, sh = (SHIRTS.find(x => x[0] === p.shirt && has(x[3])) || SHIRTS[0])[2];
  ['--hs', '--hs2', '--hs3'].forEach((v, i) => r.style.setProperty(v, sh[i]));
  r.style.setProperty('--hh', HAIR[p.hair] || HAIR[0]); r.style.setProperty('--hk', SKIN[p.skin] || SKIN[1]);
  const acc = (ACC.find(a => a[0] === p.acc && has(a[2])) || ACC[0])[0];
  r.classList.remove('acc-headset', 'acc-none', 'acc-cap'); r.classList.add('acc-' + acc);
  r.classList.toggle('hc', !!p.hc); r.classList.toggle('big', !!p.big);
  const calm = p.calm === null ? matchMedia('(prefers-reduced-motion: reduce)').matches : p.calm;
  r.classList.toggle('calm', !!calm);
}
const set = (k, v) => { store('noc_prefs', { ...prefs(), [k]: v }); applyPrefs(); sfx.sel(); };

const HERO_PREVIEW = () => document.querySelector('#tScene .hero') ? document.querySelector('#tScene svg').outerHTML : '';
export function lookModal(after) {
  const p = prefs();
  const sw = (k, list, cur) => list.map((c, i) => `<button class="swc${i === cur ? ' on' : ''}" data-k="${k}" data-v="${i}" style="background:${c}" aria-label="${k === 'hair' ? 'Cabelo' : 'Pele'} ${i + 1}"></button>`).join('');
  const opt = (k, list, cur) => list.map(([id, name, ...rest]) => {
    const need = rest[rest.length - 1], ok = has(need), c = k === 'shirt' ? rest[0][0] : null;
    return `<button class="lopt${id === cur ? ' on' : ''}" data-k="${k}" data-v="${id}" ${ok ? '' : 'disabled'}>${c ? `<i style="background:${c}"></i>` : ''}${esc(name)}${ok ? '' : `<small>🔒 ${needTxt(need)}</small>`}</button>`;
  }).join('');
  modal(`<div class="tag">VESTIÁRIO DO NOC</div><h2>Seu analista</h2>
    <div class="lprev">${HERO_PREVIEW()}</div>
    <div class="lsec">CAMISA</div><div class="lrow">${opt('shirt', SHIRTS, p.shirt)}</div>
    <div class="lsec">ACESSÓRIO</div><div class="lrow">${opt('acc', ACC, p.acc)}</div>
    <div class="lsec">CABELO</div><div class="lrow">${sw('hair', HAIR, p.hair)}</div>
    <div class="lsec">PELE</div><div class="lrow">${sw('skin', SKIN, p.skin)}</div>
    <div class="fnote">Mais camisas destravam com estrelas, com estrelas de ouro do modo difícil e derrotando o Z3R0.</div>
    <div class="row"><button class="btn" id="mOk">PRONTO</button></div>`);
  $('mcard').querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k; set(k, k === 'hair' || k === 'skin' ? +b.dataset.v : b.dataset.v); lookModal(after);
  });
  $('mOk').onclick = () => { closeModal(); after && after(); };
}

export function a11yModal() {
  const p = prefs(), calm = document.documentElement.classList.contains('calm');
  const row = (k, on, t, s) => `<label class="fc a11y"><input type="checkbox" data-k="${k}" ${on ? 'checked' : ''}> <span><b>${t}</b><br>${s}</span></label>`;
  modal(`<div class="tag">ACESSIBILIDADE</div><h2>Do seu jeito</h2>
    ${row('hc', p.hc, 'Alto contraste', 'Textos e bordas mais fortes.')}
    ${row('big', p.big, 'Texto maior', 'Aumenta a fonte das perguntas, explicações e aulas.')}
    ${row('calm', calm, 'Menos animação', 'Sem tremida de tela, partículas e flashes. Liga sozinho se o aparelho pedir menos movimento.')}
    <div class="fnote">Teclado: Tab navega, Enter ou espaço escolhe. Nas fases de arrastar, escolha a ficha (ou o item da esquerda) e depois o destino.</div>
    <div class="row"><button class="btn" id="mOk">PRONTO</button></div>`);
  $('mcard').querySelectorAll('input[data-k]').forEach(i => i.onchange = () => set(i.dataset.k, i.checked));
  $('mOk').onclick = closeModal;
}
