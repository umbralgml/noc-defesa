// PWA: registra o service worker (sw.js na raiz) e mostra "INSTALAR APP" quando dá para instalar.
// Android/Chrome/Edge usam o pedido nativo; no iPhone o botão explica o "Adicionar à Tela de Início".
import { $ } from './util.js';
import { modal, closeModal } from './ui.js';

const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferred = null;

export function initPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(e => console.warn('service worker:', e));
  const btn = $('installBtn');
  if (standalone()) return;
  if (isIOS()) btn.hidden = false;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btn.hidden = false; });
  addEventListener('appinstalled', () => { deferred = null; btn.hidden = true; });
  btn.onclick = async () => {
    if (deferred) { deferred.prompt(); const r = await deferred.userChoice; if (r.outcome === 'accepted') btn.hidden = true; deferred = null; return; }
    modal(`<div class="tag">INSTALAR O NOC</div><h2>Jogo na tela inicial</h2>
      <div class="lesson"><span class="lh">NO IPHONE / IPAD (SAFARI)</span><ul>
        <li>Toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima).</li>
        <li>Role e toque em <b>Adicionar à Tela de Início</b>.</li>
        <li>Pronto: o NOC abre em tela cheia, como um app, e funciona até sem internet.</li></ul></div>
      <div class="row"><button class="btn" id="mOk">ENTENDI</button></div>`);
    $('mOk').onclick = closeModal;
  };
}
