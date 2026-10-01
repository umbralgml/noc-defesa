#!/usr/bin/env node
// Validador opcional das fases. Não é etapa de build: o jogo roda sem ele.
// Uso: node tools/validar-fases.mjs
// Erros (fase quebrada) fazem o script sair com código 1. Avisos apontam conteúdo didático faltando.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../src/levels/', import.meta.url));
const LOCS = ['rack', 'desk', 'firewall', 'war', 'server'];
const MEDIA = ['sm', 'mm', 'dac', 'cu', 'pon'];
const ICONS = ['sfp', 'rj45', 'sc'];
const REQ = ['title', 'tag', 'type', 'loc', 'cap', 'goal', 'z', 'me', 'tip', 'learn'];

const errors = [], warns = [];
const read = f => JSON.parse(readFileSync(DIR + f, 'utf8'));
const txt = x => typeof x === 'string' ? x : x.t;
const val = x => typeof x === 'string' ? x : (x.v ?? x.t);
const hasWhy = x => typeof x === 'object' && !!x.why;

function check(L, where) {
  const err = m => errors.push(`${where}: ${m}`), warn = m => warns.push(`${where}: ${m}`);
  REQ.forEach(k => { if (L[k] === undefined || L[k] === '') err(`campo obrigatório "${k}" ausente`); });
  if (L.loc && !LOCS.includes(L.loc)) err(`loc "${L.loc}" inválido (use ${LOCS.join(', ')})`);
  if (!L.lesson || !L.lesson.length) warn('sem "lesson" (aula rápida do briefing)');

  if (L.type === 'wire') {
    const l = (L.left || []).map(p => p.id), r = (L.right || []).map(p => p.id);
    if (!l.length) err('"left" vazio');
    if (new Set(l).size !== l.length) err('ids repetidos em "left"');
    if (l.slice().sort().join() !== r.slice().sort().join()) err(`ids de "left" e "right" não formam pares: [${l}] x [${r}]`);
    (L.left || []).forEach(p => { if (p.m && !MEDIA.includes(p.m)) err(`mídia "${p.m}" inválida em ${p.id}`); if (!p.why) warn(`left "${p.t}" sem "why"`); });
    (L.right || []).forEach(p => { if (p.ico && !ICONS.includes(p.ico)) err(`ícone "${p.ico}" inválido em ${p.id}`); if (!p.why) warn(`right "${p.t}" sem "why"`); });
  } else if (L.type === 'drop' && L.mode === 'slots') {
    const ids = [...(L.html || '').matchAll(/\[(\w+)\]/g)].map(m => m[1]), zones = Object.keys(L.zones || {});
    if (new Set(ids).size !== ids.length) err('lacuna repetida no "html"');
    ids.filter(z => !zones.includes(z)).forEach(z => err(`lacuna [${z}] sem entrada em "zones"`));
    zones.filter(z => !ids.includes(z)).forEach(z => err(`zona "${z}" não aparece no "html"`));
    const vals = (L.chips || []).map(val), texts = (L.chips || []).map(txt);
    if (new Set(texts).size !== texts.length) err('fichas com texto repetido');
    zones.forEach(z => L.zones[z].forEach(v => { if (!vals.includes(v)) err(`zona "${z}" aceita "${v}", mas nenhuma ficha tem esse valor`); }));
    // Cada ficha certa precisa ter lacuna: conta quantas lacunas aceitam cada valor.
    const need = {}; zones.forEach(z => L.zones[z].forEach(v => { need[v] = (need[v] || 0) + 1; }));
    Object.keys(L.explain || {}).forEach(z => { if (!zones.includes(z)) err(`"explain.${z}" não é uma zona`); });
    zones.forEach(z => { if (!(L.explain || {})[z]) warn(`zona "${z}" sem "explain"`); });
    (L.chips || []).forEach(c => { if (!need[val(c)] && !hasWhy(c)) warn(`ficha distratora "${txt(c)}" sem "why"`); });
  } else if (L.type === 'drop' && L.mode === 'buckets') {
    if (!L.buckets || L.buckets.length < 2) err('"buckets" precisa de pelo menos 2 categorias');
    const all = (L.buckets || []).flatMap(b => b.a.map(val));
    if (new Set(all).size !== all.length) err('item repetido entre categorias');
    (L.buckets || []).forEach(b => { if (!b.label || !b.c) err('categoria sem "label" ou "c"'); b.a.forEach(x => { if (!hasWhy(x)) warn(`item "${txt(x)}" sem "why"`); }); });
  } else if (L.type === 'quiz') {
    if (!L.qs || !L.qs.length) err('"qs" vazio');
    if (L.boss && !L.time) err('chefe precisa de "time" (segundos por pergunta)');
    (L.qs || []).forEach((q, i) => {
      if (!q.q || !q.why) err(`pergunta ${i + 1} sem "q" ou "why"`);
      if (!Array.isArray(q.o) || q.o.length < 2) err(`pergunta ${i + 1} precisa de 2+ opções`);
      else if (!(q.a >= 0 && q.a < q.o.length)) err(`pergunta ${i + 1}: "a" = ${q.a} fora das opções`);
      else q.o.forEach((o, k) => { if (k !== q.a && !hasWhy(o)) warn(`pergunta ${i + 1}: opção errada "${txt(o)}" sem "why"`); });
    });
  } else err(`tipo "${L.type}"${L.mode ? '/' + L.mode : ''} desconhecido`);
}

const idxActs = () => read('index.json').acts;
const titles = new Map();
let total = 0;
for (const f of read('index.json').acts) {
  const a = read(f);
  if (!a.tag || !a.name) errors.push(`${f}: ato sem "tag" ou "name"`);
  a.levels.forEach((L, i) => {
    total++;
    const where = `${f} #${i + 1} "${L.title}"`;
    if (titles.has(L.title)) errors.push(`${where}: título repetido (já usado em ${titles.get(L.title)}). O progresso salvo usa o título como chave.`);
    titles.set(L.title, where);
    check(L, where);
  });
}

// O service worker (sw.js) guarda os módulos para o jogo abrir offline: todo módulo novo precisa estar na lista.
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
readdirSync(new URL('../src/engine/', import.meta.url)).filter(f => f.endsWith('.js')).forEach(f => {
  if (!sw.includes(`'${f.replace(/\.js$/, '')}'`)) errors.push(`sw.js: módulo src/engine/${f} fora da lista CORE (o jogo não abriria offline)`);
});
idxActs().forEach(f => { if (!sw.includes(`src/levels/${f}`)) errors.push(`sw.js: src/levels/${f} fora da lista CORE`); });

warns.forEach(w => console.log('aviso  ' + w));
errors.forEach(e => console.log('ERRO   ' + e));
console.log(`\n${total} fases · ${errors.length} erro(s) · ${warns.length} aviso(s)`);
process.exit(errors.length ? 1 : 0);
