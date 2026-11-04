// Carrega as fases de src/levels/. O index.json lista as trilhas e, em cada uma, os arquivos de ato na ordem do mapa.
// "acts" (lista plana de todos os atos) continua lá para o validador e o teste; a ordem é a mesma das trilhas.
// Em outro idioma, src/levels/<lang>/<ato>.json traz só os textos traduzidos, na mesma estrutura: mescla por cima do original.
// A chave do progresso continua sendo o título em português (L.key); L.orig guarda a fase original (desafio diário).
import { LEVELS, ACTS, TRAILS } from './state.js';
import { LANG, PACK } from './i18n.js';
import { merge } from './util.js';

const BASE = new URL('../levels/', import.meta.url);

async function get(file) {
  const r = await fetch(new URL(file, BASE));
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return r.json();
}
const tr = file => LANG === 'pt' ? Promise.resolve(null) : get(`${LANG}/${file}`).catch(() => null);
export async function loadLevels() {
  const idx = await get('index.json');
  const trails = idx.trilhas || [{ id: 'inicial', name: 'Trilha inicial', icon: '🧭', desc: '', acts: idx.acts }];
  const data = await Promise.all(trails.map(t => Promise.all(t.acts.map(f => Promise.all([get(f), tr(f)])))));
  trails.forEach((t, ti) => {
    const tt = (PACK && PACK.trails && PACK.trails[t.id]) || {};
    TRAILS.push({ id: t.id, name: tt.name || t.name, icon: t.icon || '', desc: tt.desc || t.desc || '', soon: t.soon ? tt.soon || t.soon : '', acts: [] });
    data[ti].forEach(([o, x]) => {
      const a = merge(o, x && { tag: x.tag, name: x.name, story: x.story }), ai = ACTS.length;
      ACTS.push([a.tag, a.name, a.diff || '', a.story || null, ti, !!a.nivel]);
      TRAILS[ti].acts.push(ai);
      o.levels.forEach((L, li) => { const y = x && x.levels && x.levels[li]; LEVELS.push({ ...merge(L, y), key: L.title, orig: L, tr: LANG === 'pt' || !!y, act: ai, trail: ti }); });
    });
  });
}
