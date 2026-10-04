// Interface compartilhada: telas, modal, toast, partículas, barra de integridade,
// pontuação, acerto/erro e o painel de explicação (coach).
import { $, buzz, esc, fmt } from './util.js';
import { AV_ME, AV_Z, heroState, sceneFx } from './scene.js';
import { sfx } from './audio.js';
import { unlock } from './ach.js';
import { S, diffOf } from './state.js';
import { findGloss } from './glossary.js';

// Ganchos preenchidos por game.js (win, fail) e daily.js (map). Quem chama não precisa importar quem trata.
export const flow = { win() {}, fail() {}, map() {}, room() {}, train() {}, acad() {}, study() {}, good() {} };

const TAUNT = ['Hahaha, errou feio!', 'Seu firewall é de papel?', 'Mais um erro e a rede é minha.', 'Nem o estagiário erra isso.', 'Tic tac, analista...', 'Obrigado pelo acesso!'];
const PRAISE = ['Link UP!', 'Boa!', 'Na mosca.', 'Isso aí.', 'Perfeito.', 'Segue o baile.'];
export const ZHURT = ['Argh! Sorte sua.', 'Isso não vai durar.', 'Como você sabia?!', 'Meu C2 está caindo...'];

export function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
export function modal(html) { $('mcard').innerHTML = html; $('modal').classList.add('on'); $('mcard').scrollTop = 0; linkGloss($('mcard')); }

// ---------- glossário tocável ----------
// Negritos que batem com um termo do glossário viram botões; tocar mostra a definição embaixo da tela.
export function linkGloss(root) {
  if (!root) return;
  root.querySelectorAll('b:not(.gl)').forEach(b => {
    if (b.closest('button,a,.gl') || !findGloss(b.textContent)) return;
    b.classList.add('gl'); b.tabIndex = 0; b.setAttribute('role', 'button'); b.title = 'Ver no glossário';
  });
}
function glossPop(b) {
  const g = findGloss(b.textContent); if (!g) return;
  let p = $('glpop');
  if (!p) { p = document.createElement('div'); p.id = 'glpop'; p.className = 'glpop'; p.setAttribute('role', 'dialog'); document.body.append(p); }
  p.innerHTML = '<span class="glk">📘 GLOSSÁRIO</span><b></b><span class="gld"></span><button class="lnk" type="button">fechar</button>';
  p.querySelector('b').textContent = g[0]; p.querySelector('.gld').textContent = g[2];
  p.querySelector('button').onclick = () => p.classList.remove('on');
  p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
  const seen = new Set(JSON.parse(localStorage.getItem('noc_gloss') || '[]')); seen.add(g[0]);
  try { localStorage.setItem('noc_gloss', JSON.stringify([...seen])); } catch (e) {}
}
document.addEventListener('click', e => { const b = e.target.closest('.gl'); if (b) { e.stopPropagation(); glossPop(b); } else if (!e.target.closest('#glpop')) $('glpop')?.classList.remove('on'); }, true);
document.addEventListener('keydown', e => { const b = e.target.closest && e.target.closest('.gl'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); glossPop(b); } });
export function closeModal() { $('modal').classList.remove('on'); }

// ---------- fx ----------
export function burst(x, y, c, n = 12) {
  const fx = $('fx');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div'); p.className = 'pt';
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
    p.style.cssText = `left:${x}px;top:${y}px;background:${c};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    fx.append(p); setTimeout(() => p.remove(), 700);
  }
}
export function floatTxt(x, y, t, c) {
  const e = document.createElement('div'); e.className = 'ft'; e.textContent = t;
  e.style.cssText = `left:${x}px;top:${y}px;color:${c}`;
  $('fx').append(e); setTimeout(() => e.remove(), 1000);
}
export function flash(el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 400); }

// ---------- hud ----------
const mult = () => Math.min(5, S.streak);
export function setHP() {
  $('hpFill').style.width = S.hp + '%';
  $('hpFill').classList.toggle('low', S.hp <= 40);
  $('hpTxt').textContent = 'REDE ' + S.hp + '%';
}
export function setScore() {
  $('scoreTxt').textContent = fmt(S.score);
  // Mostra o multiplicador que valeu na última jogada (some ao errar).
  const m = mult(), c = $('comboTxt'); c.textContent = 'COMBO x' + m;
  c.classList.toggle('on', m > 1);
  c.classList.remove('pop'); void c.offsetWidth; if (m > 1) c.classList.add('pop');
}
let toastT;
export function toast(msg, good) {
  const t = $('toast');
  $('toastAv').innerHTML = good ? AV_ME : AV_Z; $('toastTxt').textContent = msg;
  t.className = 'toast show' + (good ? ' good' : '');
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = 'toast' + (good ? ' good' : ''); }, 1500);
}

// ---------- acerto / erro ----------
export function damage(n, at) {
  if (S.hard) n *= 2;   // modo difícil
  if (S.practice) n = 0;   // treino sem pressão: o erro conta, mas não tira integridade
  S.err++; S.streak = 0; S.hp = Math.max(0, S.hp - n); setHP(); setScore();
  sfx.bad(); if (S.hp <= 40) setTimeout(sfx.siren, 250); buzz(90); sceneFx('alarm', 900); heroState('hit', 450); vignette('bad');
  const st = $('stage'); st.classList.remove('shk'); void st.offsetWidth; st.classList.add('shk');
  if (at) floatTxt(at.x, at.y, n ? '-' + n + '%' : 'TREINO', n ? '#ff4d6d' : '#ffd166');
  toast(TAUNT[Math.random() * TAUNT.length | 0], false);
  // Iniciante/básico: depois do 2º erro, a dica da fase aparece sozinha no painel.
  if ((S.err === 2 || (S.practice && S.err === 1)) && S.lv && S.lv.tip && diffOf(S.lv) <= 1) setTimeout(() => hint(S.lv.tip), 900);
  if (S.hp <= 0) { S.busy = true; clearInterval(S.timer); setTimeout(() => flow.fail('A integridade da rede chegou a zero. O Z3R0 assumiu o controle.'), 650); }
}
export function good(at, color) {
  S.streak++;
  const pts = 100 * mult();
  S.score += pts; sfx.ok(mult()); setScore();
  sceneFx('okf', 350); heroState('happy', 500);
  if (at) { burst(at.x, at.y, color || '#00e0a8'); floatTxt(at.x, at.y - 10, '+' + pts, color || '#00e0a8'); }
  // Marcos de combo: faixa no centro, som especial e conquista no x5.
  if (S.streak === 3 || S.streak === 5) { comboBanner(mult()); if (S.streak === 5) unlock('combo5'); }
  else if (Math.random() < .3) toast(PRAISE[Math.random() * PRAISE.length | 0], true);
  flow.good(at);
}

// Flash na borda da tela: vermelho no erro, verde no combo.
export function vignette(kind) {
  const v = $('vig'); if (!v) return;
  v.className = ''; void v.offsetWidth; v.className = 'on ' + kind;
}
function comboBanner(m) {
  const el = document.createElement('div'); el.className = 'combob'; el.textContent = `COMBO x${m}!`;
  $('fx').append(el); setTimeout(() => el.remove(), 1100);
  sfx.combo(m); vignette('good');
}
export const stars = () => S.err === 0 ? 3 : S.err <= 2 ? 2 : 1;

// Compartilha pelo menu nativo (celular) ou copia o texto e avisa no botão.
export async function share(text, btn) {
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); if (btn) btn.textContent = 'COPIADO ✓ É SÓ COLAR'; }
  catch (e) { prompt('Copie o texto:', text); }
}

// ---------- ensino ----------
const GENERIC = 'Não encaixa aqui. Toque em ? para rever a aula e a dica.';

// Mostra no painel acima da área de jogo o porquê do acerto ou do erro.
// Erros também entram na revisão do fim da fase.
export function explain(ok, label, why, rec = true) {
  if (!ok && !why) why = GENERIC;
  const c = $('coach');
  if (!why) { hideCoach(); return; }
  c.className = 'coach'; void c.offsetWidth; c.className = 'coach on' + (ok ? '' : ' bad');
  c.innerHTML = `<span class="k">${ok ? '✓ CERTO' : '✗ ERRADO'}</span><span class="ct"><b></b> <span></span></span>`;
  c.querySelector('b').textContent = label + ':';
  c.querySelector('.ct span').textContent = why;
  c.scrollTop = 0;
  if (rec && !ok && why !== GENERIC) note(label, why);
}
// Painel em modo informativo (o que um comando mostra): não conta como erro nem acerto.
export function info(label, text, kind = 'COMANDO') {
  const c = $('coach');
  c.className = 'coach'; void c.offsetWidth; c.className = 'coach on info';
  c.innerHTML = `<span class="k">ℹ ${kind}</span><span class="ct"><b></b> <span></span></span>`;
  c.querySelector('b').textContent = label + ':'; c.querySelector('.ct span').textContent = text; c.scrollTop = 0;
}
// Acrescenta uma dica embaixo da explicação que está no painel.
export function hint(html) {
  const c = $('coach'); if (!c.classList.contains('on')) c.className = 'coach on info';
  const d = document.createElement('div'); d.className = 'chint';
  d.innerHTML = '<b>💡 DICA</b> <span></span>'; d.querySelector('span').textContent = html.replace(/<[^>]+>/g, '');
  (c.querySelector('.ct') || c).append(d);
}
export function hideCoach() { $('coach').className = 'coach'; }
export function note(t, why) { if (!S.miss.some(m => m.t === t)) S.miss.push({ t, why }); }

export const lessonHTML = L => L.lesson ? `<div class="lesson"><span class="lh">AULA RÁPIDA</span><ul>${L.lesson.map(x => `<li>${x}</li>`).join('')}</ul></div>` : '';
export const reviewHTML = (miss = S.miss) => miss.length ? `<div class="review"><span class="lh">PARA REVISAR</span>${miss.slice(0, 6).map(m => `<div><b>${esc(m.t)}</b><br>${esc(m.why)}</div>`).join('')}</div>` : '';


// ---------- aviso de "tem mais embaixo" ----------
// No celular a área da fase e o banco de fichas rolam. Uma pílula aparece no rodapé de cada
// um enquanto houver conteúdo escondido; tocar nela rola para baixo.
export function initScrollHints() {
  const g = $('game');
  const pills = [['stage', '▼ TEM MAIS ABAIXO'], ['bank', '▼ MAIS OPÇÕES']].map(([id, txt]) => {
    const el = $(id), p = document.createElement('button');
    p.className = 'more'; p.type = 'button'; p.textContent = txt; p.setAttribute('aria-label', 'Rolar para ver mais');
    p.onclick = () => el.scrollBy({ top: el.clientHeight * .7, behavior: 'smooth' });
    g.append(p); el.addEventListener('scroll', () => upd(), { passive: true });
    return [el, p];
  });
  const upd = () => {
    if (!g.classList.contains('on')) return;
    pills.forEach(([el, p]) => {
      const show = el.offsetParent !== null && getComputedStyle(el).display !== 'none' && !el.classList.contains('veil')
        && el.scrollHeight - el.scrollTop - el.clientHeight > 24;
      if (show) p.style.top = (el.offsetTop + el.offsetHeight - 38) + 'px';
      p.classList.toggle('on', show);
    });
  };
  setInterval(upd, 400); addEventListener('resize', upd);
}
