// Telão Global de Ataques do SOC (Threat Map / Monitor de Ameaças em Tempo Real).
// Visual cinematográfico estilo Cloudflare / Matrix com arcos de ataque vetoriais e telemetria ao vivo.
import { $ } from './util.js';
import { modal, closeModal } from './ui.js';
import { sfx } from './audio.js';
import { unlock } from './ach.js';
import { addXP } from './career.js';
import { cyberConfetti } from './particles.js';
import { speakRadio } from './radio.js';
import { t } from './i18n.js';

let animId = null;

// Cidades globais com coordenadas no mapa vetorial (W=500, H=260)
const CITIES = [
  { name: 'São Paulo (NOC Central)', x: 165, y: 180, isNOC: true },
  { name: 'Virgínia (US-East)', x: 125, y: 88 },
  { name: 'Frankfurt (EU)', x: 260, y: 72 },
  { name: 'Londres (UK)', x: 242, y: 65 },
  { name: 'Tóquio (APAC)', x: 420, y: 92 },
  { name: 'Singapura (SEA)', x: 375, y: 152 },
  { name: 'Sydney (ANZ)', x: 440, y: 215 },
  { name: 'Moscou (RU)', x: 295, y: 60 }
];

const ATTACK_TYPES = [
  'DDoS SYN Flood (Porta 80)',
  'Amplificação NTP (Porta 123)',
  'DNS Water Torture (Porta 53)',
  'Brute Force SSH (Porta 22)',
  'Exploit BGP Hijacking',
  'Scanner Botnet Mirai-Z'
];

export function openThreatMap() {
  unlock('threat_hunter');
  speakRadio('Monitor global de ameaças ativado.');

  modal(`
    <div class="tag">${t('CENTRO DE OPERAÇÕES DE SEGURANÇA')}</div>
    <h2>${t('Telão Global de Ameaças')}</h2>
    <div class="fnote" style="margin-top:2px;margin-bottom:10px">${t('Radar de ataques cibernéticos em tempo real convergindo para a infraestrutura do NOC.')}</div>

    <div class="threat-frame">
      <div class="threat-hud">
        <div class="th-stat"><small>${t('STATUS DO NOC')}</small><b style="color:var(--acc)">${t('● SOB DEFESA ATIVA')}</b></div>
        <div class="th-stat"><small>${t('VOLUME DE TRÁFEGO')}</small><b id="thPps">1.482.300 pps</b></div>
        <div class="th-stat"><small>${t('MITIGAÇÕES / MIN')}</small><b style="color:var(--warn)" id="thMit">42.810</b></div>
      </div>

      <div class="threat-canvas-box">
        <canvas id="threatCanvas" width="500" height="260"></canvas>
        <div class="threat-scanline"></div>
      </div>

      <div class="threat-log" id="thLog">
        <div class="th-row"><span class="th-time">03:12:48</span><span class="th-type">SYN Flood</span><span>Virgínia → NOC São Paulo</span><b class="th-drop">${t('DROPADO')}</b></div>
        <div class="th-row"><span class="th-time">03:12:47</span><span class="th-type">BGP Hijack</span><span>Moscou → Rota 200.147.0/20</span><b class="th-drop">${t('FILTRADO')}</b></div>
      </div>
    </div>

    <div class="row" style="margin-top:12px;gap:8px">
      <button class="btn" id="thMitigate">${t('🛡️ ATIVAR DEFESA TOTAL (+25 XP)')}</button>
      <button class="btn ghostb" id="mOk">${t('FECHAR')}</button>
    </div>
  `);

  $('mOk').onclick = () => {
    stopThreatAnim();
    closeModal();
  };

  let mitigated = false;
  $('thMitigate').onclick = () => {
    if (mitigated) return;
    mitigated = true;
    sfx.win();
    cyberConfetti({ count: 40 });
    addXP(25);
    speakRadio('Contramedidas globais aplicadas. Tráfego anômalo mitigado.');
    $('thMitigate').textContent = t('DEFESA APLICADA ✓ (+25 XP)');
    $('thMitigate').disabled = true;
  };

  startThreatAnim();
}

function startThreatAnim() {
  const canvas = document.getElementById('threatCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  const noc = CITIES[0];
  const attackers = CITIES.slice(1);

  // Feixes de ataque ativos
  let arcs = [];
  const makeArc = () => {
    const src = attackers[Math.floor(Math.random() * attackers.length)];
    return {
      sx: src.x, sy: src.y,
      dx: noc.x, dy: noc.y,
      p: 0,
      speed: Math.random() * 0.018 + 0.012,
      color: Math.random() > 0.3 ? '#ff2e63' : '#ffd166',
      type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
      srcName: src.name
    };
  };

  for (let i = 0; i < 5; i++) {
    const a = makeArc();
    a.p = Math.random();
    arcs.push(a);
  }

  let lastLogTime = Date.now();

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    // Fundo escuro com grade do globo
    ctx.fillStyle = '#060d19';
    ctx.fillRect(0, 0, w, h);

    // Linhas de latitude e longitude holográficas
    ctx.strokeStyle = 'rgba(77, 210, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 30; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Desenho simplificado dos continentes em pixel/vetor estilizado
    ctx.fillStyle = 'rgba(18, 38, 70, 0.45)';
    drawContinents(ctx);

    // Desenha e anima os arcos de ataque
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      a.p += a.speed;

      // Ponto de controle para curvatura do arco
      const mx = (a.sx + a.dx) / 2;
      const my = Math.min(a.sy, a.dy) - 40;

      // Desenha o rastro do arco
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.quadraticCurveTo(mx, my, a.dx, a.dy);
      ctx.strokeStyle = 'rgba(255, 46, 99, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Posição atual do projétil/laser na curva de Bézier
      const t = Math.min(1, a.p);
      const px = (1 - t) * (1 - t) * a.sx + 2 * (1 - t) * t * mx + t * t * a.dx;
      const py = (1 - t) * (1 - t) * a.sy + 2 * (1 - t) * t * my + t * t * a.dy;

      ctx.fillStyle = a.color;
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (a.p >= 1) {
        // Impacto no NOC
        arcs[i] = makeArc();
      }
    }

    // Cidades / Nós
    CITIES.forEach(c => {
      ctx.fillStyle = c.isNOC ? '#00e0a8' : '#4dd2ff';
      ctx.shadowColor = c.isNOC ? '#00e0a8' : '#4dd2ff';
      ctx.shadowBlur = c.isNOC ? 12 : 5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.isNOC ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pulso no NOC Central
      if (c.isNOC) {
        const pulse = (Date.now() % 1600) / 1600;
        ctx.strokeStyle = `rgba(0, 224, 168, ${1 - pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4.5 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#b9c7dc';
      ctx.font = '7.5px monospace';
      ctx.fillText(t(c.name).split(' (')[0], c.x + 6, c.y + 3);   // nome inteiro ("São Paulo"), sem a região entre parênteses
    });

    // Atualiza log a cada ~1.8s
    if (Date.now() - lastLogTime > 1800) {
      lastLogTime = Date.now();
      updateLog(arcs[0]);
    }

    animId = requestAnimationFrame(draw);
  };

  animId = requestAnimationFrame(draw);
}

function stopThreatAnim() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function updateLog(arc) {
  const log = document.getElementById('thLog');
  const pps = document.getElementById('thPps');
  const mit = document.getElementById('thMit');
  if (!log) return;

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const div = document.createElement('div');
  div.className = 'th-row';
  div.innerHTML = `<span class="th-time">${time}</span><span class="th-type">${t(arc.type).split(' (')[0]}</span><span>${t(arc.srcName).split(' (')[0]} → NOC</span><b class="th-drop">${t('DROPADO')}</b>`;
  
  log.prepend(div);
  if (log.children.length > 5) log.removeChild(log.lastChild);

  if (pps) pps.textContent = (1400000 + Math.floor(Math.random() * 250000)).toLocaleString('pt-BR') + ' pps';
  if (mit) mit.textContent = (42000 + Math.floor(Math.random() * 1500)).toLocaleString('pt-BR');
}

function drawContinents(ctx) {
  // Silhuetas aproximadas e minimalistas dos continentes (estilo low-poly radar)
  // Américas
  ctx.beginPath();
  ctx.moveTo(90, 45); ctx.lineTo(155, 45); ctx.lineTo(135, 115); ctx.lineTo(110, 115); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(135, 125); ctx.lineTo(195, 155); ctx.lineTo(165, 230); ctx.lineTo(145, 175); ctx.closePath(); ctx.fill();
  // Europa & África
  ctx.beginPath();
  ctx.moveTo(230, 45); ctx.lineTo(290, 45); ctx.lineTo(285, 95); ctx.lineTo(225, 85); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(235, 100); ctx.lineTo(295, 105); ctx.lineTo(275, 205); ctx.lineTo(225, 135); ctx.closePath(); ctx.fill();
  // Ásia & Oceania
  ctx.beginPath();
  ctx.moveTo(300, 40); ctx.lineTo(440, 50); ctx.lineTo(430, 130); ctx.lineTo(340, 140); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(405, 175); ctx.lineTo(465, 180); ctx.lineTo(450, 230); ctx.lineTo(400, 215); ctx.closePath(); ctx.fill();
}
