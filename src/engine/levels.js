// Carrega as fases de src/levels/. O index.json lista os arquivos de ato na ordem do mapa.
import { LEVELS, ACTS } from './state.js';

const BASE = new URL('../levels/', import.meta.url);

async function get(file) {
  const r = await fetch(new URL(file, BASE));
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return r.json();
}

export async function loadLevels() {
  const { acts } = await get('index.json');
  const data = await Promise.all(acts.map(get));
  data.forEach((a, ai) => {
    ACTS.push([a.tag, a.name, a.diff || '', a.story || null]);
    a.levels.forEach(L => LEVELS.push({ ...L, act: ai }));
  });
}
