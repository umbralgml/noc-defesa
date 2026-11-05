// Linha do tempo de atualizações na tela inicial (dados em src/changelog.json).
// Marca como NOVO a versão mais recente até o jogador iniciar o turno.
import { $, esc } from './util.js';
import { LANG } from './i18n.js';
// Versão com tradução ("es": { title, items }) aparece no idioma do jogo; sem ela, em português.
const loc = v => (v[LANG] && { ...v, ...v[LANG] }) || v;

let latest = null;
const seen = () => { try { return localStorage.getItem('noc_seen_ver'); } catch (e) { return null; } };
const fmtDate = d => d.split('-').reverse().join('/');

let VERS = [];
export async function loadNews() {
  const r = await fetch(new URL('../changelog.json', import.meta.url));
  if (!r.ok) throw new Error('changelog.json: HTTP ' + r.status);
  VERS = (await r.json()).versions.map(loc);
  latest = VERS[0].v;
  const fresh = seen() !== latest;
  $('newsDot')?.classList.toggle('on', fresh);
  $('tUpdLast').textContent = `v${VERS[0].v}: ${VERS[0].title}`;
  $('tUpdBtn').classList.toggle('fresh', fresh);
}

// Log de mudanças para o painel (aba Mudanças): só a última versão, o resto no "ver mais".
export function newsHTML() {
  if (!VERS.length) return '<div class="rmsg">Não consegui carregar as novidades agora.</div>';
  const fresh = seen() !== latest, n = VERS.length - 1;
  return `<div class="tl" id="newsList">${VERS.map((v, i) => `<div class="ver${i ? '' : ' latest'}">
    <div class="vh"><span class="vn">v${esc(v.v)}</span><span class="vd">${fmtDate(v.date)}</span>${!i && fresh ? '<span class="vnew">NOVO</span>' : ''}</div>
    <b class="vt">${esc(v.title)}</b><ul>${v.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}
    ${n ? `<button class="tlmore" id="tlMore" type="button">ver mais (${n} versões anteriores)</button>` : ''}</div>`;
}
export function wireNews() {
  const more = $('tlMore'); if (!more) return;
  const n = VERS.length - 1;
  more.onclick = () => { const all = $('newsList').classList.toggle('all'); more.textContent = all ? 'ver menos' : `ver mais (${n} versões anteriores)`; };
}

// Chamado ao iniciar o turno: o jogador já viu as novidades desta versão.
export function markNewsSeen() {
  if (!latest) return;
  try { localStorage.setItem('noc_seen_ver', latest); } catch (e) {}
  $('newsDot')?.classList.remove('on'); $('tUpdBtn')?.classList.remove('fresh');
}
