// Certificado de plantão por ato: desenhado num canvas e salvo como PNG (baixar ou compartilhar).
// O nome digitado fica só no aparelho; nada é enviado.
import { $, store, esc } from './util.js';
import { S, LEVELS, ACTS, K } from './state.js';
import { modal, closeModal, share } from './ui.js';
import { profile } from './rank.js';

const W = 1400, H = 990;
const fit = (x, t, max, size, font) => { let s = size; do x.font = `${font} ${s}px ${font.includes('800') ? 'Orbitron' : 'system-ui'}, sans-serif`; while (x.measureText(t).width > max && --s > 10); };

export async function drawCert(name, ai) {
  try { await document.fonts.ready; } catch (e) {}
  const a = ACTS[ai], lv = LEVELS.map((L, i) => [L, i]).filter(([L]) => L.act === ai);
  const stars = lv.reduce((n, [, i]) => n + (S.prog[K(i)] || 0), 0), gold = store('noc_gold') || [];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#070d18'; x.fillRect(0, 0, W, H);
  // grade sutil e moldura dupla
  x.strokeStyle = 'rgba(0,224,168,.06)'; x.lineWidth = 1;
  for (let g = 0; g < W; g += 40) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); }
  for (let g = 0; g < H; g += 40) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }
  x.strokeStyle = '#00e0a8'; x.lineWidth = 4; x.strokeRect(36, 36, W - 72, H - 72);
  x.strokeStyle = 'rgba(0,224,168,.35)'; x.lineWidth = 1.5; x.strokeRect(52, 52, W - 104, H - 104);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = '#00e0a8'; x.font = "800 30px Orbitron, sans-serif"; x.fillText('NOC · ÚLTIMA LINHA DE DEFESA', W / 2, 128);
  x.fillStyle = '#e6f1ff'; x.font = "800 58px Orbitron, sans-serif"; x.fillText('CERTIFICADO DE PLANTÃO', W / 2, 212);
  x.fillStyle = '#8a9bb8'; x.font = '28px system-ui, sans-serif'; x.fillText('Certificamos que', W / 2, 282);
  x.fillStyle = '#ffd166'; fit(x, name, W - 260, 64, '800'); x.fillText(name, W / 2, 362);
  x.fillStyle = '#c9d6ea'; fit(x, `concluiu o ${a[0]} · ${a[1]}${a[2] ? ` (nível ${a[2]})` : ''}, defendendo a rede em:`, W - 220, 28, '500');
  x.fillText(`concluiu o ${a[0]} · ${a[1]}${a[2] ? ` (nível ${a[2]})` : ''}, defendendo a rede em:`, W / 2, 422);
  // fases do ato, em uma ou duas colunas
  const two = lv.length > 4, colW = two ? 520 : 760, rows = two ? Math.ceil(lv.length / 2) : lv.length;
  lv.forEach(([L, i], k) => {
    const col = two ? Math.floor(k / rows) : 0, row = two ? k % rows : k;
    const cx = two ? W / 2 + (col ? 30 : -30 - colW) : (W - colW) / 2, cy = 490 + row * 50;
    const st = S.prog[K(i)] || 0;
    x.textAlign = 'left'; x.fillStyle = '#e6f1ff'; fit(x, L.title, colW - 150, 28, '500'); x.fillText(L.title, cx, cy);
    x.textAlign = 'right'; x.fillStyle = gold.includes(L.title) ? '#ffcc33' : '#ffd166'; x.font = '28px system-ui, sans-serif';
    x.fillText('★'.repeat(st) + '☆'.repeat(3 - st), cx + colW, cy);
  });
  x.textAlign = 'center';
  const by = 490 + rows * 50 + 30;
  x.fillStyle = '#00e0a8'; x.font = "800 26px Orbitron, sans-serif"; x.fillText(`★ ${stars}/${lv.length * 3}`, W / 2, by);
  const d = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  x.fillStyle = '#8a9bb8'; x.font = '24px system-ui, sans-serif';
  x.textAlign = 'left'; x.fillText(d, 110, H - 130);
  x.textAlign = 'right'; x.fillText('Chefe do NOC', W - 110, H - 130);
  x.strokeStyle = '#3a5680'; x.lineWidth = 2; x.beginPath(); x.moveTo(W - 420, H - 165); x.lineTo(W - 110, H - 165); x.stroke();
  x.textAlign = 'center'; x.fillStyle = '#5f7394'; x.font = '20px system-ui, sans-serif';
  x.fillText('Jogo educativo de redes e segurança · certificado de participação, sem valor acadêmico', W / 2, H - 86);
  x.fillStyle = '#8a9bb8'; x.fillText(location.host + location.pathname.replace(/index\.html$/, ''), W / 2, H - 60);
  return c;
}

export function certModal(ai) {
  const p = profile(), a = ACTS[ai];
  modal(`<div class="tag">${esc(a[0])} CONCLUÍDO</div><h2>Certificado de plantão</h2>
    <label class="fl">Nome no certificado<input id="cName" maxlength="40" autocomplete="name" placeholder="Seu nome"></label>
    <div class="fnote">O nome fica só no certificado, neste aparelho. Nada é enviado.</div>
    <div class="cprev" id="cPrev"></div>
    <div class="row"><button class="btn ghostb" id="mOk">FECHAR</button><button class="btn" id="cSave">BAIXAR PNG</button></div>
    <button class="btn ghostb wideb" id="cShare">COMPARTILHAR</button>`);
  $('cName').value = (p && p.name) || store('noc_cert_name') || '';
  let canvas = null;
  const draw = async () => {
    const n = $('cName').value.trim() || 'Analista de plantão';
    canvas = await drawCert(n, ai);
    const img = new Image(); img.alt = 'Prévia do certificado'; img.src = canvas.toDataURL('image/png');
    const box = $('cPrev'); if (box) { box.innerHTML = ''; box.append(img); }
  };
  let t; $('cName').oninput = () => { clearTimeout(t); t = setTimeout(draw, 300); };
  draw();
  const file = () => new Promise(r => canvas.toBlob(b => r(new File([b], `certificado-noc-${a[0].toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' }))));
  $('cSave').onclick = async () => {
    if (!canvas) return; store('noc_cert_name', $('cName').value.trim());
    const f = await file(), u = URL.createObjectURL(f), l = document.createElement('a');
    l.href = u; l.download = f.name; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  };
  $('cShare').onclick = async e => {
    if (!canvas) return;
    const f = await file(), text = `Concluí o ${a[0]} · ${a[1]} no NOC: Última Linha de Defesa 🛡️ ${location.origin + location.pathname}`;
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text }); } catch (er) {} }
    else share(text, e.currentTarget);
  };
  $('mOk').onclick = closeModal;
}
