// Estudo: aula em cartões com checagem no briefing, e o modal de estudo do mapa
// (biblioteca com as aulas das fases liberadas + glossário completo).
import { $, store, esc } from './util.js';
import { LEVELS, ACTS, unlocked } from './state.js';
import { flow, modal, closeModal, linkGloss } from './ui.js';
import { GLOSS } from './glossary.js';
import { addXP } from './career.js';
import { sfx } from './audio.js';

const opt = o => typeof o === 'string' ? { t: o } : o;

// ---------- aula em cartões ----------
// Um tópico por cartão; depois do último, a pergunta "entendeu?" (campo "check" da fase), sem custo.
export const cardsHTML = L => L.lesson ? `<div class="lcards" id="lcards"><div class="lch"><span class="lh">AULA RÁPIDA</span><span id="lcN"></span></div>
  <div class="lcb" id="lcB" aria-live="polite"></div><div class="lcnav"><button class="btn ghostb" id="lcPrev" aria-label="Cartão anterior">◀</button><span class="lcdots" id="lcDots"></span><button class="btn" id="lcNext">PRÓXIMO ▶</button></div>
  <button class="lnk lcall" id="lcAll">ver tudo em lista</button></div>` : '';

export function initCards(L) {
  if (!L.lesson || !$('lcards')) return;
  const n = L.lesson.length, total = n + (L.check ? 1 : 0);
  let k = 0;
  const show = () => {
    $('lcN').textContent = `${Math.min(k + 1, total)}/${total}`;
    $('lcDots').innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i === k ? 'on' : i < k ? 'done' : ''}"></i>`).join('');
    $('lcPrev').disabled = k === 0;
    if (k < n) {
      $('lcB').innerHTML = `<div class="lcc">${L.lesson[k]}</div>`; linkGloss($('lcB'));
      $('lcNext').hidden = false; $('lcNext').textContent = k === n - 1 ? (L.check ? 'ENTENDI? ▶' : 'PRONTO ✓') : 'PRÓXIMO ▶';
      $('lcNext').disabled = k === n - 1 && !L.check;
    } else check();
  };
  const check = () => {
    const q = L.check;
    $('lcNext').hidden = true;
    $('lcB').innerHTML = `<div class="lcq"><span class="lh">VERIFIQUE SE ENTENDEU</span><div class="q"></div><div class="lco"></div><div class="lcw" id="lcW"></div></div>`;
    $('lcB').querySelector('.q').textContent = q.q;
    let tries = 0;
    q.o.map((o, i) => ({ ...opt(o), ok: i === q.a })).sort(() => Math.random() - .5).forEach(o => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = o.t;
      b.onclick = () => {
        tries++;
        if (!o.ok) { b.disabled = true; b.classList.add('wrong'); sfx.bad(); $('lcW').textContent = (o.why || q.why) + ' Tente de novo.'; return; }
        $('lcB').querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x === b) x.classList.add('right'); });
        $('lcW').textContent = q.why; sfx.ok(1);
        const done = store('noc_check') || {};
        if (tries === 1 && !done[L.title]) { done[L.title] = 1; store('noc_check', done); addXP(5); $('lcW').textContent += ' +5 XP'; }
      };
      $('lcB').querySelector('.lco').append(b);
    });
  };
  $('lcPrev').onclick = () => { if (k > 0) { k--; show(); } };
  $('lcNext').onclick = () => { if (k < total - 1) { k++; show(); } };
  $('lcAll').onclick = () => { $('lcards').outerHTML = `<div class="lesson"><span class="lh">AULA RÁPIDA</span><ul>${L.lesson.map(x => `<li>${x}</li>`).join('')}</ul></div>`; linkGloss($('mcard')); };
  show();
}

// ---------- estudo: biblioteca e glossário ----------
export function openStudy(tab = 0) {
  modal(`<div class="tag">SALA DE ESTUDO</div><h2>${tab ? 'Glossário' : 'Biblioteca de aulas'}</h2>
    <div class="tabs"><button class="tabb${tab ? '' : ' on'}" data-t="0">📚 AULAS</button><button class="tabb${tab ? ' on' : ''}" data-t="1">📘 GLOSSÁRIO</button></div>
    <div id="stBody"></div><div class="row"><button class="btn" id="mOk">FECHAR</button></div>`);
  $('mOk').onclick = closeModal;
  $('mcard').querySelectorAll('.tabb').forEach(b => b.onclick = () => openStudy(+b.dataset.t));
  const box = $('stBody');
  if (!tab) {
    box.innerHTML = ACTS.map((a, ai) => {
      const lv = LEVELS.map((L, i) => [L, i]).filter(([L]) => L.act === ai);
      return `<details class="lib"${ai === 0 ? ' open' : ''}><summary><span>${esc(a[0])}</span> ${esc(a[1])}</summary>${lv.map(([L, i]) => unlocked(i)
        ? `<details class="libl"><summary>${i + 1}. ${esc(L.title)}</summary><ul>${(L.lesson || []).map(x => `<li>${x}</li>`).join('')}</ul><div class="libk"><b>Resumo:</b> ${L.learn}</div></details>`
        : `<div class="libl lock">🔒 ${i + 1}. ${esc(L.title)}</div>`).join('')}</details>`;
    }).join('') + '<div class="fnote">As aulas aparecem aqui conforme as fases são liberadas no mapa.</div>';
    linkGloss(box);
  } else {
    const seen = new Set(JSON.parse(localStorage.getItem('noc_gloss') || '[]'));
    box.innerHTML = `<input class="glsearch" id="glQ" placeholder="buscar termo..." aria-label="Buscar no glossário" autocomplete="off">
      <dl class="gllist">${GLOSS.map(g => `<div data-k="${esc((g[0] + ' ' + g[1].join(' ')).toLowerCase())}"><dt>${seen.has(g[0]) ? '👁 ' : ''}${esc(g[0])}</dt><dd>${esc(g[2])}</dd></div>`).join('')}</dl>
      <div class="fnote">👁 = termos que você já consultou durante as aulas. Toque nos termos sublinhados das aulas para ver a definição na hora.</div>`;
    $('glQ').oninput = () => { const q = $('glQ').value.toLowerCase().trim(); box.querySelectorAll('.gllist > div').forEach(d => { d.hidden = q && !d.dataset.k.includes(q); }); };
  }
}

// Cartão no mapa, abaixo da Academia.
function card() {
  const box = $('studyBox'); if (!box) return;
  box.innerHTML = '<button class="daily studyc" id="studyBtn"><span class="di">📚</span><span class="dt"><b>Sala de estudo</b><small>Todas as aulas liberadas e o glossário</small></span><span class="dg">ESTUDAR</span></button>';
  $('studyBtn').onclick = () => openStudy();
}
export function initStudy() { flow.study = card; }
