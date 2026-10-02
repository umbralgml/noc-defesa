#!/usr/bin/env node
// Validador opcional das fases. Não é etapa de build: o jogo roda sem ele.
// Uso: node tools/validar-fases.mjs
// Erros (fase quebrada) fazem o script sair com código 1. Avisos apontam conteúdo didático faltando.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { matches, path, reach, lid, compile } from '../src/engine/netlib.js';

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
  if (L.dailyFrom !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(L.dailyFrom)) err('"dailyFrom" precisa ser AAAA-MM-DD');

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
    if ((L.boss || L.miniboss) && L.type === 'quiz' && !L.time) err('chefe precisa de "time" (segundos por pergunta)');
    (L.qs || []).forEach((q, i) => {
      if (!q.q || !q.why) err(`pergunta ${i + 1} sem "q" ou "why"`);
      if (!Array.isArray(q.o) || q.o.length < 2) err(`pergunta ${i + 1} precisa de 2+ opções`);
      else if (!(q.a >= 0 && q.a < q.o.length)) err(`pergunta ${i + 1}: "a" = ${q.a} fora das opções`);
      else q.o.forEach((o, k) => { if (k !== q.a && !hasWhy(o)) warn(`pergunta ${i + 1}: opção errada "${txt(o)}" sem "why"`); });
    });
  } else if (L.type === 'term') {
    if (!L.host) err('terminal precisa de "host" (nome do equipamento no prompt)');
    if (!L.cmds || L.cmds.length < 2) err('"cmds" precisa de pelo menos 2 comandos (o diagnóstico libera com 2)');
    const seen = new Set();
    (L.cmds || []).forEach(c => {
      if (!c.c || c.out === undefined) err(`comando sem "c" ou "out"`);
      [c.c, ...(c.alias || [])].forEach(n => { const k = (n || '').trim().toLowerCase().replace(/\s+/g, ' '); if (seen.has(k)) err(`comando/alias repetido: "${n}"`); seen.add(k); });
      if (!c.why) warn(`comando "${c.c}" sem "why"`);
    });
    if (!L.steps || !L.steps.length) err('"steps" vazio');
    checkSteps(L.steps, err, warn);
  } else if (L.type === 'defense') {
    const rules = L.rules || [], pk = (L.waves || []).flatMap(w => w.packets || []);
    if (!rules.length || !pk.length) err('defesa precisa de "rules" e "waves" com "packets"');
    rules.forEach(r => { if (!r.id || !r.t || !r.match) err(`regra sem "id", "t" ou "match"`); if (!r.why) warn(`regra "${r.t}" sem "why"`); });
    pk.forEach(p => {
      if (!p.src || !p.why) err(`pacote ${p.t || p.src} sem "src" ou "why"`);
      const hit = rules.filter(r => r.match && matches(r.match, p));
      // ataque precisa de uma regra boa que o pare; legítimo não pode ser barrado por regra boa
      if (p.bad && !hit.some(r => r.good)) err(`ataque ${p.src}/${p.port} não é bloqueado por nenhuma regra "good"`);
      if (!p.bad && hit.some(r => r.good)) err(`cliente legítimo ${p.src}/${p.port} seria bloqueado pela regra boa "${hit.find(r => r.good).t}"`);
    });
    rules.filter(r => !r.good && r.match).forEach(r => { if (!pk.some(p => !p.bad && matches(r.match, p))) warn(`armadilha "${r.t}" não pega nenhum cliente legítimo (não ensina o falso positivo)`); });
  } else if (L.type === 'topo') {
    const ids = (L.nodes || []).map(n => n.id), links = (L.links || []).map(k => lid(k.a, k.b));
    if (!ids.includes(L.from)) err(`"from" = ${L.from} não é um nó`);
    (L.nodes || []).forEach(n => { if (!n.id || !n.t || n.x === undefined || n.y === undefined) err(`nó sem "id", "t", "x" ou "y"`); if (n.id !== L.from && !n.why) warn(`nó "${n.t}" sem "why"`); });
    (L.links || []).forEach(k => { if (!ids.includes(k.a) || !ids.includes(k.b)) err(`enlace ${k.a}-${k.b} liga nó inexistente`); });
    const all = [...ids, ...links];
    if (!all.includes(L.fault)) err(`"fault" = ${L.fault} não é nó nem enlace (enlace é "a-b" em ordem alfabética)`);
    (L.accept || []).forEach(a => { if (!all.includes(a)) err(`"accept" tem ${a}, que não existe`); });
    if (L.accept && !L.accept.includes(L.fault)) err('"accept" precisa incluir o "fault"');
    if (!L.faultWhy || !L.faultName) err('topologia precisa de "faultName" e "faultWhy"');
    if (L.nodes && L.links && all.includes(L.fault)) {
      const res = ids.filter(n => n !== L.from).map(n => { const p = path(L, n); return p ? reach(L, p) === p.length - 1 : null; });
      if (res.includes(null)) err('algum nó não tem caminho a partir de "from"');
      if (!res.includes(true) || !res.includes(false)) err('precisa de destinos que respondem e que falham para o jogador comparar');
    }
    if (L.steps) checkSteps(L.steps, err, warn);
  } else if (L.type === 'pcap') {
    const P = L.packets || [];
    if (P.length < 4) err('"packets" precisa de pelo menos 4 pacotes');
    if (!P.some(p => p.bad) || !P.some(p => !p.bad)) err('a captura precisa ter pacotes normais e suspeitos');
    P.forEach((p, i) => { if (!p.src || !p.dst || !p.proto || !p.info) err(`pacote ${i + 1} sem "src", "dst", "proto" ou "info"`); if (!p.why) warn(`pacote ${i + 1} sem "why"`); });
    (L.filters || []).forEach(f => {
      try { const fn = compile(f.f); if (!P.some(fn)) warn(`filtro "${f.f}" não mostra nenhum pacote`); } catch (e) { err(`filtro "${f.f}" inválido: ${e.message}`); }
      if (!f.why) warn(`filtro "${f.f}" sem "why"`);
    });
  } else err(`tipo "${L.type}"${L.mode ? '/' + L.mode : ''} desconhecido`);
}

function checkSteps(steps, err, warn) {
    steps.forEach((q, i) => {
      if (!q.q || !q.why) err(`passo ${i + 1} sem "q" ou "why"`);
      if (!Array.isArray(q.o) || q.o.length < 2 || !(q.a >= 0 && q.a < q.o.length)) err(`passo ${i + 1}: opções ou "a" inválidos`);
      else q.o.forEach((o, k) => { if (k !== q.a && !hasWhy(o)) warn(`passo ${i + 1}: opção errada "${txt(o)}" sem "why"`); });
    });
}

const idxActs = () => read('index.json').acts;
// A dificuldade só pode subir ao longo da campanha (progressão para quem está começando).
{
  const D = ['iniciante', 'básico', 'intermediário', 'avançado']; let prev = 0;
  idxActs().forEach(f => { const d = D.indexOf(read(f).diff); if (d >= 0 && d < prev) warns.push(`${f}: dificuldade "${D[d]}" depois de um ato mais difícil`); if (d >= 0) prev = d; });
}
const titles = new Map();
let total = 0;
for (const f of read('index.json').acts) {
  const a = read(f);
  if (!a.tag || !a.name) errors.push(`${f}: ato sem "tag" ou "name"`);
  if (a.diff !== undefined && !['iniciante', 'básico', 'intermediário', 'avançado'].includes(a.diff)) errors.push(`${f}: "diff" deve ser iniciante, básico, intermediário ou avançado`);
  if (!a.diff) warns.push(`${f}: ato sem "diff" (dificuldade)`);
  (a.story || []).forEach((s, i) => { if (!['z', 'me', 'chefe'].includes(s.who) || !s.t) errors.push(`${f}: story[${i}] precisa de "who" (z, me ou chefe) e "t"`); });
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
