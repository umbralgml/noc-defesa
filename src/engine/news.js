// Linha do tempo de atualizações na tela inicial (dados em src/changelog.json).
// Marca como NOVO a versão mais recente até o jogador iniciar o turno.
import { $, esc } from './util.js';

let latest = null;
const seen = () => { try { return localStorage.getItem('noc_seen_ver'); } catch (e) { return null; } };
const fmtDate = d => d.split('-').reverse().join('/');

export async function loadNews() {
  const r = await fetch(new URL('../changelog.json', import.meta.url));
  if (!r.ok) throw new Error('changelog.json: HTTP ' + r.status);
  const { versions } = await r.json();
  latest = versions[0].v;
  const fresh = seen() !== latest;
  $('newsList').innerHTML = versions.map((v, i) => `<div class="ver${i ? '' : ' latest'}">
    <div class="vh"><span class="vn">v${esc(v.v)}</span><span class="vd">${fmtDate(v.date)}</span>${!i && fresh ? '<span class="vnew">NOVO</span>' : ''}</div>
    <b class="vt">${esc(v.title)}</b><ul>${v.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('');
  $('newsDot').classList.toggle('on', fresh);
  $('newsBtn').onclick = $('tUpdBtn').onclick = () => $('news').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('tUpdLast').textContent = `(última: v${versions[0].v}, ${versions[0].title})`;
}

// Chamado ao iniciar o turno: o jogador já viu as novidades desta versão.
export function markNewsSeen() {
  if (!latest) return;
  try { localStorage.setItem('noc_seen_ver', latest); } catch (e) {}
  $('newsDot').classList.remove('on');
}
