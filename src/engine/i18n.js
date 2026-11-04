// Idioma do jogo. Português é o original; os outros idiomas são camadas por cima:
// - telas: dicionário em src/i18n/<lang>.js (ui), aplicado no DOM por translateDOM();
// - fases: src/levels/<lang>/<ato>.json com só os textos traduzidos (levels.js mescla);
// - glossário: gloss no mesmo arquivo, pela chave do termo em português.
// Comandos, saídas e configurações nunca são traduzidos (o validador confere).
// O que não tem tradução aparece em português. Trocar o idioma recarrega a página.
import { store, setLocale } from './util.js';

// Idiomas do seletor da tela inicial (bandeiras em main.js). Aparelho em outro idioma abre em inglês.
export const LANGS = { pt: 'Português (Brasil)', en: 'English', es: 'Español' };
const pick = () => {
  const s = store('noc_lang'); if (LANGS[s]) return s;
  const n = (typeof navigator !== 'undefined' && navigator.language) || 'pt';
  return /^pt\b/i.test(n) ? 'pt' : /^es\b/i.test(n) ? 'es' : 'en';   // outros idiomas: inglês
};
export const LANG = pick();
setLocale({ pt: 'pt-BR', es: 'es', en: 'en-US' }[LANG]);
// Só o pacote do idioma escolhido é carregado.
export const PACK = LANG === 'pt' ? null : (await import(`../i18n/${LANG}.js`)).default;
export const setLang = l => { store('noc_lang', l); location.reload(); };

// Chave do dicionário: espaços normalizados e números trocados por {n} (voltam na mesma ordem).
const norm = s => s.replace(/\s+/g, ' ').trim();
const NUM = /\d(?:[\d.,]*\d)?/g;
const keyOf = s => norm(s).replace(NUM, '{n}');
// Coleta (só desenvolvimento): com localStorage noc_i18n_coleta, guarda os textos sem tradução em MISS.
export const MISS = new Set(); const COLETA = !!store('noc_i18n_coleta');
const UI = new Map(PACK ? Object.entries(PACK.ui).map(([k, v]) => [keyOf(k), v]) : []);
export function t(s) {
  if (!PACK || !s) return s;
  const v = UI.get(keyOf(s)); if (v === undefined) { if (COLETA) MISS.add(norm(s)); return s; }
  const nums = norm(s).match(NUM) || []; let i = 0;
  return v.replace(/\{n\}/g, () => nums[i++] ?? '');
}

// Tradução das telas direto no DOM, inclusive do que os motores criam depois (MutationObserver).
// Terminal, comandos e código ficam de fora: nunca se traduz o que o analista digita ou lê do equipamento.
const SKIP = '.tlog,.cmd,.tps,code,pre,.cli,script,style,[data-notr]';
const ATTRS = ['placeholder', 'aria-label', 'title'];
const seen = new WeakMap();
function trText(n) {
  const p = n.parentElement; if (!p || p.closest(SKIP)) return;
  const raw = n.nodeValue; if (!raw || !/[A-Za-zÀ-ú]/.test(raw) || seen.get(n) === raw) return;
  const out = t(raw);
  if (out !== raw) { const lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0]; n.nodeValue = lead + out + tail; }
  seen.set(n, n.nodeValue);
}
function trEl(el) {
  if (el.closest(SKIP)) return;
  ATTRS.forEach(a => { const v = el.getAttribute(a); if (v) { const o = t(v); if (o !== v) el.setAttribute(a, o); } });
}
export function translateDOM(root = document.body) {
  if (!PACK) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = root; n; n = w.nextNode()) n.nodeType === 3 ? trText(n) : trEl(n);
}
export function initI18n() {
  document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : LANG;
  if (!PACK) return;
  if (PACK.title) document.title = PACK.title;
  translateDOM();
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'characterData') trText(m.target);
    else if (m.type === 'attributes') trEl(m.target);
    else m.addedNodes.forEach(n => n.nodeType === 3 ? trText(n) : n.nodeType === 1 && translateDOM(n));
  })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
