// Ranking público opcional, gravado no Supabase pela API REST (sem SDK).
// Fica desligado (botões escondidos) enquanto src/config.json não tiver url e key.
// Setup do banco: docs/RANKING.md. Todo jogador com perfil entra (anônimo por padrão);
// nome e LinkedIn só são enviados com consentimento.
import { $, esc, fmt, store as ls } from './util.js';
import { progress } from './state.js';
import { modal, closeModal } from './ui.js';

let CFG = null;
export const rankOn = () => !!CFG;

export const profile = () => {
  const p = ls('noc_profile');
  if (p && p.consent === undefined) p.consent = !!p.name;   // perfis da v1.3 só existiam com consentimento
  return p;
};

export async function loadRankConfig() {
  try {
    const r = await fetch(new URL('../config.json', import.meta.url));
    const c = (await r.json()).ranking;
    if (c && c.url && c.key) CFG = { url: c.url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, ''), key: c.key.trim() };
  } catch (e) {}
  document.querySelectorAll('.rankBtn').forEach(b => { b.hidden = !CFG; });
  return !!CFG;
}

// Id anônimo do aparelho: separa os jogadores sem pedir login. Nunca é exibido.
function playerId() {
  let id = ls('noc_player');
  if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2); ls('noc_player', id); }
  return id;
}

// Aceita "linkedin.com/in/fulano", com ou sem https/www. Devolve '' (vazio), a URL normalizada ou null (inválido).
export function normLinkedin(s) {
  s = (s || '').trim(); if (!s) return '';
  const m = s.match(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9_-]{3,100})\/?(?:[?#].*)?$/i);
  return m ? 'https://www.linkedin.com/in/' + m[1] : null;
}
const BAD = /(porr|caralh|merd|buceta|puta|fdp|viad|arrombad|cuz[aã]o|nazi|hitler)/i;
const cleanName = s => (s || '').replace(/\s+/g, ' ').trim();

async function api(path, opt = {}) {
  // Chave nova (sb_publishable_...) vai só no apikey; a anon antiga (JWT) também no Authorization.
  const h = { apikey: CFG.key, 'Content-Type': 'application/json', ...opt.headers };
  if (!CFG.key.startsWith('sb_')) h.Authorization = 'Bearer ' + CFG.key;
  const r = await fetch(`${CFG.url}/rest/v1/${path}`, { ...opt, headers: h });
  if (!r.ok) throw new Error('ranking: HTTP ' + r.status);
  return r.status === 200 ? r.json() : null;
}

export async function submit(board, score, stars) {
  const p = profile(); if (!CFG || !p) return false;
  await api('ranking', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ player: playerId(), name: publicName(), linkedin: publicLinkedin(), board, score, stars }) });
  return true;
}

// Envia o total da campanha quando ele melhora (o ranking guarda o melhor de cada jogador).
export function submitCampaign() {
  if (!CFG || !profile()) return;
  const p = progress(), sent = ls('noc_rank_sent') || 0;
  if (p.pts <= sent) return;
  submit('campanha', p.pts, p.stars).then(() => ls('noc_rank_sent', p.pts)).catch(console.error);
}

// Ganchos: daily.js reenvia o resultado de hoje; main.js atualiza a tela inicial.
export const hooks = { joined() {}, profile() {} };

// Quem não informa nome aparece como "Analista #4F2A" (derivado do id anônimo do aparelho).
export const anonName = () => 'Analista #' + playerId().replace(/-/g, '').slice(0, 4).toUpperCase();
const isAnon = n => /^Analista #[0-9A-F]{4}$/.test(n || '');
// Nome e LinkedIn só vão para o ranking público com consentimento.
export const publicName = () => { const p = profile(); return p && p.consent && p.name ? p.name : anonName(); };
const publicLinkedin = () => { const p = profile(); return p && p.consent && p.linkedin ? p.linkedin : null; };

// Pede o perfil na primeira vez e depois segue para "next".
export function ensureProfile(next) { if (profile()) next(); else profileForm(next, true); }

export function profileForm(after, first) {
  const p = profile() || {};
  modal(`<div class="tag">IDENTIFICAÇÃO DO PLANTÃO</div><h2>${first ? 'Quem está de plantão?' : 'Seu perfil'}</h2>
    <div class="fnote" style="margin-top:6px;font-size:13px;color:#c9d6ea">Como você quer aparecer no ranking? Os dois campos são <b>opcionais</b>. Em branco, você aparece como <b id="fAnon"></b>.</div>
    <label class="fl">Nome ou apelido <small>(opcional)</small><input id="fName" maxlength="24" autocomplete="nickname" placeholder="Ex.: Marcos"></label>
    <label class="fl">Perfil do LinkedIn <small>(opcional)</small><input id="fIn" inputmode="url" placeholder="linkedin.com/in/seu-perfil" autocomplete="url"></label>
    <label class="fc"><input type="checkbox" id="fOk"> Pode mostrar meu nome e o LinkedIn no ranking público, junto com a minha pontuação.</label>
    <div class="fnote">Sem marcar a caixa, seus pontos entram como anônimos. Para apagar dados já publicados, abra uma issue em <a href="https://github.com/umbralgml/noc-defesa/issues" target="_blank" rel="noopener">github.com/umbralgml/noc-defesa</a>.</div>
    <div class="ferr" id="fErr"></div>
    <div class="row"><button class="btn ghostb" id="fSkip">${first ? 'PULAR' : 'VOLTAR'}</button><button class="btn" id="fSave">${first ? 'ENTRAR NO PLANTÃO' : 'SALVAR'}</button></div>`);
  $('fAnon').textContent = anonName();
  $('fName').value = p.name || ''; $('fIn').value = p.linkedin || ''; $('fOk').checked = !!p.consent;
  const done = v => { ls('noc_profile', v); ls('noc_rank_sent', null); submitCampaign(); hooks.joined(); hooks.profile(); closeModal(); after && after(); };
  $('fSkip').onclick = () => { if (first) done({ name: '', linkedin: '', consent: false }); else { closeModal(); after && after(); } };
  $('fSave').onclick = () => {
    const name = cleanName($('fName').value), li = normLinkedin($('fIn').value), ok = $('fOk').checked, err = m => { $('fErr').textContent = m; };
    if (name && name.length < 2) return err('O nome precisa de pelo menos 2 letras (ou deixe em branco).');
    if (BAD.test(name) || isAnon(name)) return err('Escolha outro nome, por favor.');
    if (li === null) return err('Use o endereço do perfil, no formato linkedin.com/in/seu-perfil.');
    if ((name || li) && !ok) return err('Para mostrar nome ou LinkedIn no ranking, marque a caixa. Ou deixe os campos em branco.');
    done({ name, linkedin: li || '', consent: !!(name || li) && ok });
  };
}

const BOARDS = [['campanha', 'CAMPANHA'], [null, 'DESAFIO DE HOJE']];
const top = (board, n) => api(`ranking_top?board=eq.${encodeURIComponent(board)}&order=score.desc,created_at.asc&limit=${n}&select=name,linkedin,score,stars`);
const tabsHTML = tab => `<div class="tabs">${BOARDS.map((b, i) => `<button class="tabb${i === tab ? ' on' : ''}" data-t="${i}">${b[1]}</button>`).join('')}</div>`;
const failMsg = el => { if (el) el.innerHTML = '<div class="rmsg">Não consegui carregar o ranking agora. Tente de novo mais tarde.</div>'; };

export function openRanking(dailyBoard, tab = 0) {
  if (!CFG) return;
  modal(`<div class="tag">QUADRO DE PLANTÃO</div><h2>Ranking</h2>${tabsHTML(tab)}
    <div class="rlist" id="rList"><div class="rmsg">Carregando...</div></div>
    <div class="rme">Você aparece como <b></b>. <button class="lnk" id="rEdit">editar perfil</button></div>
    <div class="row"><button class="btn ghostb" id="mOk">FECHAR</button></div>`);
  $('mcard').querySelector('.rme b').textContent = publicName();
  $('mOk').onclick = closeModal;
  $('rEdit').onclick = () => profileForm(() => openRanking(dailyBoard, tab));
  $('mcard').querySelectorAll('.tabb').forEach(b => b.onclick = () => openRanking(dailyBoard, +b.dataset.t));
  top(BOARDS[tab][0] || dailyBoard, 50).then(rows => renderRows($('rList'), rows, !!BOARDS[tab][0])).catch(e => { console.error(e); failMsg($('rList')); });
}

// Quadro compacto (top 10) na tela inicial.
export function titleRanking(dailyBoard, tab = 0) {
  const box = $('rkBox'); if (!CFG || !box) return;
  $('rkTabs').innerHTML = tabsHTML(tab);
  $('rkTabs').querySelectorAll('.tabb').forEach(b => b.onclick = () => titleRanking(dailyBoard, +b.dataset.t));
  $('rkAll').onclick = () => openRanking(dailyBoard, tab);
  $('rkList').innerHTML = '<div class="rmsg">Carregando...</div>';
  top(BOARDS[tab][0] || dailyBoard, 10).then(rows => renderRows($('rkList'), rows, !!BOARDS[tab][0])).catch(e => { console.error(e); failMsg($('rkList')); });
}

function renderRows(l, rows, campaign) {
  if (!l) return;
  if (!rows.length) { l.innerHTML = `<div class="rmsg">${campaign ? 'Ninguém no quadro ainda. Seja o primeiro.' : 'Ninguém fez o desafio de hoje ainda.'}</div>`; return; }
  const me = publicName();
  l.innerHTML = rows.map((r, i) => {
    const li = normLinkedin(r.linkedin), you = r.name === me ? ' <span class="you">você</span>' : '';
    const name = li ? `<a href="${esc(li)}" target="_blank" rel="noopener nofollow ugc">${esc(r.name)} <span class="in">in</span></a>` : esc(r.name);
    return `<div class="rrow${i < 3 ? ' top' : ''}${isAnon(r.name) ? ' anon' : ''}${you ? ' me' : ''}"><span class="rp">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="rn">${name}${you}</span><span class="rs">${campaign ? `<i>★ ${r.stars}</i>` : ''}${fmt(r.score)}</span></div>`;
  }).join('');
}
