// Ranking público opcional, gravado no Supabase pela API REST (sem SDK).
// Fica desligado (botões escondidos) enquanto src/config.json não tiver url e key.
// Setup do banco: docs/RANKING.md. Nome e LinkedIn só são enviados com consentimento.
import { $, esc, fmt, store as ls } from './util.js';
import { progress } from './state.js';
import { modal, closeModal } from './ui.js';

let CFG = null;
export const rankOn = () => !!CFG;

export const profile = () => ls('noc_profile');

export async function loadRankConfig() {
  try {
    const r = await fetch(new URL('../config.json', import.meta.url));
    const c = (await r.json()).ranking;
    if (c && c.url && c.key) CFG = { url: c.url.replace(/\/+$/, ''), key: c.key };
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
  await api('ranking', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ player: playerId(), name: p.name, linkedin: p.linkedin || null, board, score, stars }) });
  return true;
}

// Envia o total da campanha quando ele melhora (o ranking guarda o melhor de cada jogador).
export function submitCampaign() {
  if (!CFG || !profile()) return;
  const p = progress(), sent = ls('noc_rank_sent') || 0;
  if (p.pts <= sent) return;
  submit('campanha', p.pts, p.stars).then(() => ls('noc_rank_sent', p.pts)).catch(console.error);
}

// Callback do daily.js para reenviar o resultado de hoje quando o jogador entra no ranking.
export const hooks = { joined() {} };

const BOARDS = [['campanha', 'CAMPANHA'], [null, 'DESAFIO DE HOJE']];

export function openRanking(dailyBoard, tab = 0) {
  if (!CFG) return;
  const p = profile();
  modal(`<div class="tag">QUADRO DE PLANTÃO</div><h2>Ranking</h2>
    <div class="tabs">${BOARDS.map((b, i) => `<button class="tabb${i === tab ? ' on' : ''}" data-t="${i}">${b[1]}</button>`).join('')}</div>
    <div class="rlist" id="rList"><div class="rmsg">Carregando...</div></div>
    <div class="rme">${p ? `Você aparece como <b></b>. <button class="lnk" id="rEdit">editar</button> · <button class="lnk" id="rLeave">parar de enviar</button>` : 'Você ainda não está no ranking. Nome e LinkedIn são opcionais: jogar não depende disso.'}</div>
    <div class="row">${p ? '' : '<button class="btn" id="rJoin">ENTRAR NO RANKING</button>'}<button class="btn ghostb" id="mOk">FECHAR</button></div>`);
  if (p) $('mcard').querySelector('.rme b').textContent = p.name;
  $('mOk').onclick = closeModal;
  if ($('rJoin')) $('rJoin').onclick = () => joinForm(dailyBoard);
  if ($('rEdit')) $('rEdit').onclick = () => joinForm(dailyBoard);
  if ($('rLeave')) $('rLeave').onclick = () => { ls('noc_profile', null); ls('noc_rank_sent', null); openRanking(dailyBoard, tab); };
  $('mcard').querySelectorAll('.tabb').forEach(b => b.onclick = () => openRanking(dailyBoard, +b.dataset.t));
  const board = BOARDS[tab][0] || dailyBoard;
  api(`ranking_top?board=eq.${encodeURIComponent(board)}&order=score.desc,created_at.asc&limit=50&select=name,linkedin,score,stars`)
    .then(rows => renderRows(rows, !!BOARDS[tab][0]))
    .catch(e => { console.error(e); const l = $('rList'); if (l) l.innerHTML = '<div class="rmsg">Não consegui carregar o ranking agora. Tente de novo mais tarde.</div>'; });
}

function renderRows(rows, campaign) {
  const l = $('rList'); if (!l) return;
  if (!rows.length) { l.innerHTML = `<div class="rmsg">${campaign ? 'Ninguém no quadro ainda. Seja o primeiro.' : 'Ninguém fez o desafio de hoje ainda.'}</div>`; return; }
  l.innerHTML = rows.map((r, i) => {
    const li = normLinkedin(r.linkedin);
    const name = li ? `<a href="${esc(li)}" target="_blank" rel="noopener nofollow ugc">${esc(r.name)} <span class="in">in</span></a>` : esc(r.name);
    return `<div class="rrow${i < 3 ? ' top' : ''}"><span class="rp">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="rn">${name}</span><span class="rs">${campaign ? `<i>★ ${r.stars}</i>` : ''}${fmt(r.score)}</span></div>`;
  }).join('');
}

function joinForm(dailyBoard) {
  const p = profile() || {};
  modal(`<div class="tag">QUADRO DE PLANTÃO</div><h2>Entrar no ranking</h2>
    <label class="fl">Nome ou apelido <small>(2 a 24 letras)</small><input id="fName" maxlength="24" autocomplete="nickname"></label>
    <label class="fl">Perfil do LinkedIn <small>(opcional)</small><input id="fIn" inputmode="url" placeholder="linkedin.com/in/seu-perfil" autocomplete="url"></label>
    <label class="fc"><input type="checkbox" id="fOk"> Concordo em mostrar este nome e, se preenchido, o LinkedIn no ranking público, junto com minha pontuação.</label>
    <div class="fnote">Nada é enviado sem marcar a caixa acima. Para apagar dados já publicados, abra uma issue em <a href="https://github.com/umbralgml/noc-defesa/issues" target="_blank" rel="noopener">github.com/umbralgml/noc-defesa</a>.</div>
    <div class="ferr" id="fErr"></div>
    <div class="row"><button class="btn ghostb" id="mCancel">VOLTAR</button><button class="btn" id="fSave">SALVAR</button></div>`);
  $('fName').value = p.name || ''; $('fIn').value = p.linkedin || '';
  $('mCancel').onclick = () => openRanking(dailyBoard);
  $('fSave').onclick = () => {
    const name = cleanName($('fName').value), li = normLinkedin($('fIn').value), err = m => { $('fErr').textContent = m; };
    if (name.length < 2) return err('Coloque um nome com pelo menos 2 letras.');
    if (BAD.test(name)) return err('Escolha outro nome, por favor.');
    if (li === null) return err('Use o endereço do perfil, no formato linkedin.com/in/seu-perfil.');
    if (!$('fOk').checked) return err('Marque a caixa de consentimento para aparecer no ranking.');
    ls('noc_profile', { name, linkedin: li || '' }); ls('noc_rank_sent', null);
    submitCampaign(); hooks.joined();
    openRanking(dailyBoard);
  };
}
