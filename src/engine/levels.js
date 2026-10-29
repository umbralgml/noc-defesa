// Carrega as fases de src/levels/. O index.json lista as trilhas e, em cada uma, os arquivos de ato na ordem do mapa.
// "acts" (lista plana de todos os atos) continua lá para o validador e o teste; a ordem é a mesma das trilhas.
import { LEVELS, ACTS, TRAILS } from './state.js';

const BASE = new URL('../levels/', import.meta.url);

async function get(file) {
  const r = await fetch(new URL(file, BASE));
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return r.json();
}

export async function loadLevels() {
  const idx = await get('index.json');
  const trails = idx.trilhas || [{ id: 'inicial', name: 'Trilha inicial', icon: '🧭', desc: '', acts: idx.acts }];
  const data = await Promise.all(trails.map(t => Promise.all(t.acts.map(get))));
  trails.forEach((t, ti) => {
    TRAILS.push({ id: t.id, name: t.name, icon: t.icon || '', desc: t.desc || '', soon: t.soon || '', acts: [] });
    data[ti].forEach(a => {
      const ai = ACTS.length;
      ACTS.push([a.tag, a.name, a.diff || '', a.story || null, ti]);
      TRAILS[ti].acts.push(ai);
      a.levels.forEach(L => LEVELS.push({ ...L, act: ai, trail: ti }));
    });
  });
}
