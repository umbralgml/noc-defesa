// Painel da tela inicial: ranking e log de mudanças em abas, no lugar da antiga coluna da direita.
// O botão RANKING abre na aba do ranking; NOVIDADES e a linha "Novo" abrem em Mudanças.
import { $ } from './util.js';
import { modal, closeModal } from './ui.js';
import { openRanking, rankOn } from './rank.js';
import { newsHTML, wireNews, markNewsSeen } from './news.js';
import { dailyBoard } from './daily.js';

const head = cur => rankOn()
  ? `<div class="ptabs" role="tablist"><button class="ptab${cur === 'rank' ? ' on' : ''}" role="tab" data-p="rank">🏆 Ranking</button><button class="ptab${cur === 'news' ? ' on' : ''}" role="tab" data-p="news">📋 Mudanças</button></div>`
  : '';
const wire = () => $('mcard').querySelectorAll('.ptab').forEach(b => b.onclick = () => openBoard(b.dataset.p));

export function openBoard(view = 'rank') {
  if (view === 'rank' && rankOn()) { openRanking(dailyBoard(), 0, head('rank'), wire); return; }
  modal(`${head('news')}<div class="tag">LOG DE MUDANÇAS</div><h2>O que mudou no NOC</h2>${newsHTML()}<div class="row"><button class="btn ghostb" id="mOk">FECHAR</button></div>`);
  $('mOk').onclick = closeModal; wireNews(); wire(); markNewsSeen();
}
