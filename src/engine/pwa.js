// PWA: registra o service worker (sw.js na raiz) e mostra "INSTALAR APP" sempre que o jogo não está instalado.
// Com o pedido nativo (Chrome/Edge no Android e no PC), o botão abre ele. Sem o pedido (iPhone, Samsung
// Internet, Firefox, navegador dentro de app ou Chrome que já recusou uma vez), o botão explica o passo a passo.
import { $ } from './util.js';
import { modal, closeModal } from './ui.js';

const ua = navigator.userAgent;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Navegadores dentro de outros apps não instalam PWA: é preciso abrir no Chrome/Safari.
const inApp = () => /Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|Line\/|Twitter|TikTok|Snapchat|; wv\)|WhatsApp/i.test(ua);
let deferred = null;

// Passo a passo de cada navegador (o que aparece no menu dele).
function steps() {
  if (inApp()) return ['ABRA NO NAVEGADOR', [
    'Este navegador fica dentro de outro app (Instagram, LinkedIn, WhatsApp...) e não instala apps.',
    `Toque no menu <b>⋮</b> ou <b>…</b> e escolha <b>Abrir no ${isIOS() ? 'Safari' : 'Chrome'}</b> (ou <b>Abrir no navegador</b>).`,
    'Lá, toque de novo em <b>📲 INSTALAR APP</b>.']];
  if (isIOS()) return [/CriOS|FxiOS|EdgiOS/i.test(ua) ? 'NO IPHONE / IPAD' : 'NO IPHONE / IPAD (SAFARI)', [
    'Toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima). No Chrome do iPhone ele fica na barra de endereço.',
    'Role e toque em <b>Adicionar à Tela de Início</b>.',
    'Pronto: o NOC abre em tela cheia, como um app, e funciona até sem internet.']];
  if (/SamsungBrowser/i.test(ua)) return ['NO SAMSUNG INTERNET', [
    'Toque no menu <b>≡</b> (embaixo, à direita).',
    'Toque em <b>Adicionar página a</b> e depois em <b>Tela inicial</b>.']];
  if (/Firefox/i.test(ua)) return [/Android/i.test(ua) ? 'NO FIREFOX (ANDROID)' : 'NO FIREFOX', /Android/i.test(ua)
    ? ['Toque no menu <b>⋮</b>.', 'Toque em <b>Instalar</b> (ou <b>Adicionar à tela inicial</b>).']
    : ['O Firefox no computador não instala apps. Abra o jogo no <b>Chrome</b> ou no <b>Edge</b> e use o botão de novo.']];
  if (/Android/i.test(ua)) return ['NO ANDROID (CHROME)', [
    'Toque no menu <b>⋮</b> (em cima, à direita).',
    'Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.',
    'Se não aparecer, o jogo pode já estar instalado: procure o ícone <b>NOC</b> na tela inicial.']];
  return ['NO COMPUTADOR', [
    'No <b>Chrome</b> ou no <b>Edge</b>, clique no ícone de instalar no fim da barra de endereço (um monitor com seta).',
    'Ou abra o menu <b>⋮</b> e escolha <b>Instalar NOC</b> (no Edge: <b>Apps → Instalar este site como app</b>).']];
}

export function initPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(e => console.warn('service worker:', e));
  const btn = $('installBtn');
  if (standalone()) return;
  btn.hidden = false;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  addEventListener('appinstalled', () => { deferred = null; btn.hidden = true; });
  btn.onclick = async () => {
    if (deferred) {
      const d = deferred; deferred = null; d.prompt();
      const r = await d.userChoice; if (r.outcome === 'accepted') btn.hidden = true;
      return;
    }
    const [head, list] = steps();
    modal(`<div class="tag">INSTALAR O NOC</div><h2>Jogo na tela inicial</h2>
      <div class="lesson"><span class="lh">${head}</span><ul>${list.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="fnote">Instalado, o NOC abre em tela cheia e funciona até sem internet.</div>
      <div class="row">${inApp() ? '<button class="btn ghostb" id="mCopy">COPIAR LINK</button>' : ''}<button class="btn" id="mOk">ENTENDI</button></div>`);
    $('mOk').onclick = closeModal;
    if ($('mCopy')) $('mCopy').onclick = async e => {
      try { await navigator.clipboard.writeText(location.origin + location.pathname); e.currentTarget.textContent = 'COPIADO ✓'; } catch (er) { prompt('Copie o link:', location.origin + location.pathname); }
    };
  };
}
