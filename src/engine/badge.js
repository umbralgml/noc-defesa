// Gerador de Crachá Oficial do Analista (NOC Security Access Badge).
// Gera card visual interativo e exportação em PNG de alta resolução via Canvas 2D nativo.
import { esc } from './util.js';
import { progress } from './state.js';
import { rankOf } from './career.js';
import { achCount, unlock } from './ach.js';
import { publicName, profile } from './rank.js';
import { AV_ME } from './scene.js';
import { cyberConfetti } from './particles.js';
import { sfx } from './audio.js';
import { t } from './i18n.js';

export function badgeHTML() {
  unlock('cracha');
  const p = profile() || {};
  const name = publicName();
  const r = rankOf();
  const prog = progress();
  const aCount = achCount();
  const clearance = Math.min(5, Math.floor(prog.stars / 15) + 1);
  const serial = 'NOC-' + Math.abs(name.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 1337)).toString(16).toUpperCase().padStart(6, '0');

  return `
    <div class="tag">${t('CREDENCIAL OFICIAL')}</div>
    <h2>${t('Crachá do Analista')}</h2>
    <div class="fnote" style="margin-top:2px;margin-bottom:12px">${t('Identidade de segurança do operador para acesso aos servidores e racks do NOC.')}</div>

    <div class="badge-card" id="badgeCard">
      <div class="badge-holo"></div>
      <div class="badge-top">
        <div class="badge-org">
          <img src="src/icons/icon.svg" width="28" height="28" alt="NOC Escudo">
          <div>
            <b>${t('NOC DEFENSE DIVISION')}</b>
            <small>${t('NETWORK SECURITY OPERATOR')}</small>
          </div>
        </div>
        <div class="badge-sec">${t('CLASSE')} ${clearance}</div>
      </div>

      <div class="badge-body">
        <div class="badge-photo">
          <div class="badge-av">${AV_ME}</div>
          <span class="badge-status">${t('● ATIVO')}</span>
        </div>
        <div class="badge-info">
          <div class="b-lbl">${t('ANALISTA')}</div>
          <b class="b-val b-name">${esc(name)}</b>
          
          <div class="b-lbl" style="margin-top:6px">${t('PATENTE / CARGO')}</div>
          <b class="b-val b-rank">${esc(t(r.name))}</b>

          <div class="badge-stats">
            <span><b>${prog.stars}</b> ${t('★ ESTRELAS')}</span>
            <span><b>${aCount}</b> ${t('🎖️ CONQUISTAS')}</span>
            <span><b>${serial}</b></span>
          </div>
        </div>
      </div>

      <div class="badge-bottom">
        <div class="badge-barcode">
          ${Array.from({ length: 32 }, (_, i) => `<i style="width:${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1.5 : 2.5)}px;opacity:${(i % 5 === 0 ? 0.4 : 0.85)}"></i>`).join('')}
        </div>
        <div class="badge-auth">${t('AUTORIZADO · SLA {n}%').replace('{n}', '99.9')}</div>
      </div>
    </div>

    <div class="badge-actions">
      <button class="btn" id="bDl">${t('📥 BAIXAR IMAGEM (PNG)')}</button>
      <button class="btn ghostb" id="bShare">${t('📲 COMPARTILHAR')}</button>
    </div>
  `;
}

export function wireBadge() {
  const dlBtn = document.getElementById('bDl');
  const shareBtn = document.getElementById('bShare');

  if (dlBtn) {
    dlBtn.onclick = () => {
      sfx.ok(2);
      cyberConfetti({ count: 30 });
      exportBadgePNG();
    };
  }

  if (shareBtn) {
    shareBtn.onclick = async () => {
      const name = publicName();
      const r = rankOf();
      const prog = progress();
      const text = `🛡️ ${t('Meu Crachá do NOC: Última Linha de Defesa!')}\n${t('Codinome')}: ${name}\n${t('Cargo')}: ${t(r.name)} (${prog.stars}★)\n${t('Jogue e defenda o NOC contra o Z3R0:')} https://umbralgml.github.io/noc-defesa/`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'NOC: Última Linha de Defesa',
            text: text,
            url: 'https://umbralgml.github.io/noc-defesa/'
          });
          return;
        } catch (e) {}
      }

      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
          shareBtn.textContent = t('COPIADO! ✓');
          setTimeout(() => { shareBtn.textContent = t('📲 COMPARTILHAR'); }, 2200);
        } catch (e) {}
      }
    };
  }
}

function exportBadgePNG() {
  const name = publicName();
  const r = rankOf();
  const prog = progress();
  const aCount = achCount();
  const clearance = Math.min(5, Math.floor(prog.stars / 15) + 1);
  const serial = 'NOC-' + Math.abs(name.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 1337)).toString(16).toUpperCase().padStart(6, '0');

  const canvas = document.createElement('canvas');
  const scale = 2; // Alta resolução
  const w = 540, h = 320;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Fundo com gradiente escuro de alta tecnologia
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#070f1e');
  bg.addColorStop(0.5, '#0a172e');
  bg.addColorStop(1, '#050a14');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, w, h, 18);
  ctx.fill();

  // Borda neon com brilho
  ctx.strokeStyle = '#00e0a8';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0, 224, 168, 0.4)';
  ctx.shadowBlur = 14;
  roundRect(ctx, 2, 2, w - 4, h - 4, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Grade de fundo sutil
  ctx.strokeStyle = 'rgba(77, 210, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 20; x < w; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 20; y < h; y += 24) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Tarja superior
  ctx.fillStyle = 'rgba(0, 224, 168, 0.12)';
  ctx.fillRect(2, 2, w - 4, 48);

  ctx.fillStyle = '#00e0a8';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(t('NOC DEFENSE DIVISION'), 24, 28);
  ctx.fillStyle = '#7f94b6';
  ctx.font = '9px monospace';
  ctx.fillText(t('NETWORK SECURITY OPERATOR · ID CARD'), 24, 42);

  // Clearance badge
  ctx.fillStyle = 'rgba(255, 184, 0, 0.2)';
  ctx.strokeStyle = '#ffb800';
  ctx.lineWidth = 1;
  roundRect(ctx, w - 110, 14, 90, 22, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe8a3';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${t('CLASSE')} ${clearance}`, w - 65, 29);
  ctx.textAlign = 'left';

  // Foto do analista (Placeholder estilizado de segurança)
  ctx.fillStyle = '#101d36';
  ctx.strokeStyle = '#22385e';
  roundRect(ctx, 24, 68, 100, 130, 10);
  ctx.fill(); ctx.stroke();

  // Emblema no avatar
  ctx.fillStyle = '#00e0a8';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️', 74, 136);

  ctx.fillStyle = '#00e0a8';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(t('● ATIVO'), 74, 184);
  ctx.textAlign = 'left';

  // Informações do jogador
  ctx.fillStyle = '#7f94b6';
  ctx.font = '9px monospace';
  ctx.fillText(t('NOME DO ANALISTA'), 144, 82);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(name.slice(0, 20), 144, 104);

  ctx.fillStyle = '#7f94b6';
  ctx.font = '9px monospace';
  ctx.fillText(t('PATENTE / CARGO'), 144, 126);

  ctx.fillStyle = '#4dd2ff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(t(r.name), 144, 146);

  ctx.fillStyle = '#ffe8a3';
  ctx.font = '11px monospace';
  ctx.fillText(`★ ${prog.stars} ${t('Estrelas')}  ·  🎖️ ${aCount} ${t('Conquistas')}`, 144, 172);

  ctx.fillStyle = '#7f94b6';
  ctx.font = '10px monospace';
  ctx.fillText(`${t('REGISTRO')}: ${serial}`, 144, 190);

  // Faixa inferior com código de barras
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(2, h - 52, w - 4, 50);

  // Desenha código de barras
  ctx.fillStyle = '#00e0a8';
  let bx = 24;
  for (let i = 0; i < 46; i++) {
    const bw = (i % 3 === 0 ? 3 : i % 2 === 0 ? 1.5 : 2);
    ctx.fillRect(bx, h - 42, bw, 32);
    bx += bw + (i % 4 === 0 ? 4 : 2);
  }

  ctx.fillStyle = '#7f94b6';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(t('AUTORIZADO · UPTIME 99.9%'), w - 24, h - 22);
  ctx.font = '8px monospace';
  ctx.fillText(t('SISTEMA NOC DE DEFESA'), w - 24, h - 10);
  ctx.textAlign = 'left';

  // Dispara download da imagem PNG
  const link = document.createElement('a');
  link.download = `cracha-noc-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
