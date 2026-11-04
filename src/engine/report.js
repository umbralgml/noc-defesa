// Reportar erro de conteúdo e Fale com o NOC (sugestões, dúvidas, contato): painel próprio (por cima de tudo, até do modal) com o tipo do problema,
// um comentário e um contato opcional. Grava na tabela "reportes" do Supabase (tools/ranking.sql);
// sem ranking configurado ou sem internet, abre o e-mail já preenchido.
// Os outros módulos não importam este: chamam flow.report(ctx) (ui.js), preenchido em initReport().
import { $, store } from './util.js';
import { S } from './state.js';
import { flow } from './ui.js';
import { sendReport, profile } from './rank.js';

const MAIL = 'marcos.anjosarth@gmail.com';
const KINDS = [['resposta', 'A resposta certa está errada'], ['explicacao', 'Explicação errada ou incompleta'], ['texto', 'Erro de português ou digitação'], ['outro', 'Outra coisa']];
// Fale com o NOC: sugestões, dúvidas e contato, fora de uma fase. Vai para a mesma tabela, com level "Contato".
const CKINDS = [['sugestao', 'Sugestão para o jogo'], ['duvida', 'Dúvida de redes, Linux ou do jogo'], ['contato', 'Quero falar com o criador']];
const MODES = {
  erro: { kinds: KINDS, tag: 'REPORTAR ERRO', h: 'Achou algo errado?', ph: 'O que está errado e qual seria o certo? Se tiver, cite a fonte (RFC, manual do fabricante...).',
    need: 'Conte em poucas palavras o que está errado.', ok: 'Cada reporte é conferido e, se estiver certo, a correção entra numa próxima versão.', subj: l => 'NOC: erro em ' + l },
  contato: { kinds: CKINDS, tag: 'FALE COM O NOC', h: 'Sugestões, dúvidas e contato', ph: 'Escreva sua sugestão, dúvida ou recado. Para receber resposta, deixe um e-mail ou LinkedIn no campo abaixo.',
    need: 'Escreva sua mensagem antes de enviar.', ok: 'Sua mensagem chegou para o Marcos. Se deixou contato, a resposta vai por lá.', subj: () => 'NOC: mensagem pelo jogo' }
};
const cut = (s, n) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const native = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
let ver = '';

// Botão pequeno para pôr no painel de explicação, na explicação do quiz ou no fim da fase.
// ctx = { item: o que estava na tela (pergunta, ficha, comando), shown: a explicação mostrada }.
export function reportBtn(ctx, label = '⚑ REPORTAR ERRO') {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'repbtn'; b.textContent = label;
  b.setAttribute('aria-label', 'Reportar erro neste conteúdo');
  b.onclick = e => { e.stopPropagation(); openReport(ctx); };
  return b;
}

export const openContact = () => openReport({ level: 'Contato' }, 'contato');

export function openReport(ctx = {}, mode = 'erro') {
  const M = MODES[mode], K = M.kinds;
  const lv = mode === 'contato' ? 'Contato' : (S.lv && (S.lv.key || S.lv.title)) || ctx.level || 'Geral';
  const p = profile() || {};
  const box = document.createElement('div');
  box.className = 'repwrap'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = `<div class="repcard">
    <div class="tag">${M.tag}</div><h2>${M.h}</h2>
    ${mode === 'contato' ? '' : '<div class="repctx"><b></b><span></span></div>'}
    <div class="repk">${K.map(([v, t], i) => `<label><input type="radio" name="repk" value="${v}"${i ? '' : ' checked'}> ${t}</label>`).join('')}</div>
    <textarea id="repTxt" maxlength="1000" rows="4" placeholder="${M.ph}"></textarea>
    <input id="repWho" maxlength="100" placeholder="Seu nome ou contato (opcional)">
    <div class="repmsg" id="repMsg" aria-live="polite"></div>
    <div class="row"><button class="btn ghostb" id="repNo">CANCELAR</button><button class="btn" id="repGo">ENVIAR</button></div>
  </div>`;
  if (mode !== 'contato') { box.querySelector('.repctx b').textContent = lv; box.querySelector('.repctx span').textContent = ctx.item ? ' · ' + cut(ctx.item, 140) : ''; }
  if (p.consent && p.name) box.querySelector('#repWho').value = p.name;
  document.body.append(box);
  const close = () => box.remove();
  box.onclick = e => { if (e.target === box) close(); };
  box.querySelector('#repNo').onclick = close;
  box.querySelector('#repTxt').focus();
  box.querySelector('#repGo').onclick = async () => {
    const kind = box.querySelector('input[name=repk]:checked').value, comment = cut(box.querySelector('#repTxt').value, 1000);
    if (!comment && (kind === 'outro' || mode === 'contato')) { box.querySelector('#repMsg').textContent = M.need; return; }
    const last = store('noc_rep_t') || 0;
    if (Date.now() - last < 15000) { box.querySelector('#repMsg').textContent = 'Espere alguns segundos antes de mandar outro.'; return; }
    const row = { level: cut(lv, 60) || 'Geral', item: cut(ctx.item, 300) || null, shown: cut(ctx.shown, 1000) || null, kind,
      comment: comment || null, contact: cut(box.querySelector('#repWho').value, 100) || null, version: ver || null, platform: native() ? 'android' : 'web' };
    const go = box.querySelector('#repGo'); go.disabled = true; go.textContent = 'ENVIANDO...';
    try {
      await sendReport(row);
      store('noc_rep_t', Date.now());
      box.querySelector('.repcard').innerHTML = `<div class="tag">${M.tag}</div><h2>Recebido. Valeu!</h2><p class="fnote">${M.ok}</p><div class="row"><button class="btn" id="repOk">FECHAR</button></div>`;
      box.querySelector('#repOk').onclick = close;
    } catch (e) {
      // Sem internet ou banco sem a tabela: manda pelo e-mail, com tudo preenchido.
      const body = `${mode === 'contato' ? '' : `Fase: ${row.level}\nItem: ${row.item || '-'}\nExplicação mostrada: ${row.shown || '-'}\n`}Tipo: ${K.find(k => k[0] === kind)[1]}\nMensagem: ${row.comment || '-'}\nContato: ${row.contact || '-'}\nVersão: ${row.version || '-'} (${row.platform})`;
      box.querySelector('#repMsg').innerHTML = `Não consegui enviar agora. <a href="mailto:${MAIL}?subject=${encodeURIComponent(M.subj(row.level))}&body=${encodeURIComponent(body)}">Mandar por e-mail</a>`;
      go.disabled = false; go.textContent = 'TENTAR DE NOVO';
    }
  };
}

export function initReport() {
  flow.report = (ctx, label = '⚑ ERRO?') => reportBtn(ctx, label);
  fetch(new URL('../changelog.json', import.meta.url)).then(r => r.json()).then(c => { ver = c.versions[0].v; }).catch(() => {});
}
