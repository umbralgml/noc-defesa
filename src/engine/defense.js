// Motor "defense": defesa em tempo real. Pacotes chegam em ondas e atravessam a pista até o
// servidor; o jogador liga/desliga regras de firewall. Na linha do firewall cada pacote é
// avaliado: ataque bloqueado = acerto; ataque que passa ou cliente legítimo bloqueado
// (falso positivo) = erro com explicação. Ganha quem chega ao fim das ondas com integridade.
import { $, center } from './util.js';
import { sfx } from './audio.js';
import { S } from './state.js';
import { good, damage, explain, info, floatTxt, setScore, flow } from './ui.js';
import { bankAdd } from './bank.js';
import { matches } from './netlib.js';

const FW = .72;   // posição da linha do firewall na pista (0 a 1)
let L = null, timers = [], on = new Set(), seen = new Set();
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

// Rótulo curto do pacote: "origem PROTO [porta de origem→]porta de destino".
const label = p => p.t || `${p.src} ${(p.proto || 'tcp').toUpperCase()} ${p.sport ? p.sport + '→' : ''}${p.port || ''}`.trim();

export function resetDefense() { timers.forEach(clearTimeout); timers = []; }

export function renderDefense(level) {
  L = level; resetDefense(); on = new Set(); seen = new Set();
  S.need = L.waves.reduce((n, w) => n + w.packets.length, 0); S.placed = 0;
  const st = $('stage');
  st.innerHTML = `<div class="dstat"><span id="dWave">ONDA 1/${L.waves.length}</span><span><b id="dDone">0</b>/${S.need} PACOTES</span></div>
    <div class="lane" id="lane"><div class="fwline"><span>FIREWALL</span></div><div class="dsrv"><b>🖥️</b><small></small></div></div>
    <div class="dlegend">${L.reveal ? '🟥 ataque · 🟦 cliente legítimo. Ligue as regras que barram os vermelhos sem barrar os azuis.' : 'Os pacotes não dizem o que são: leia origem, protocolo e porta e decida pelas regras.'}</div>
    ${L.intro ? `<div class="task">${L.intro}</div>` : ''}`;
  st.querySelector('.dsrv small').textContent = L.server || 'SERVIDOR';
  const bank = $('bank');
  bank.innerHTML = '<div class="bankh"><span>REGRAS · TOQUE PARA LIGAR</span><span id="bankCnt">0 ATIVAS</span></div>';
  bank.style.display = 'flex';
  L.rules.forEach(r => {
    const b = document.createElement('button'); b.className = 'rule'; b.textContent = r.t; b.setAttribute('aria-pressed', 'false');
    b.onclick = () => toggle(r, b); bank.append(b);
  });
  later(() => wave(0), L.start || 2500);
}

function toggle(r, b) {
  if (S.busy) return;
  const was = on.has(r.id);
  was ? on.delete(r.id) : on.add(r.id);
  b.classList.toggle('on', !was); b.setAttribute('aria-pressed', String(!was));
  sfx.sel();
  if (!was && !seen.has(r.id)) { seen.add(r.id); if (r.why) info(r.t, r.why, 'REGRA'); }
  $('bankCnt').textContent = `${on.size} ATIVA${on.size === 1 ? '' : 'S'}`;
}

function wave(i) {
  if (S.busy && S.hp <= 0) return;
  const w = L.waves[i], gap = w.gap || 1500, travel = w.travel || 5200;
  $('dWave').textContent = `ONDA ${i + 1}/${L.waves.length}`;
  if (w.msg) info(`ONDA ${i + 1}`, w.msg, 'ALERTA');
  w.packets.forEach((p, k) => later(() => send(p, k, travel), k * gap));
  if (i + 1 < L.waves.length) later(() => wave(i + 1), w.packets.length * gap + 2600);
}

function send(p, k, travel) {
  const lane = $('lane'); if (!lane) return;
  const d = document.createElement('div');
  d.className = 'pkt' + (L.reveal ? (p.bad ? ' bad' : ' ok') : ''); d.textContent = label(p); d.style.top = `${10 + (k % 3) * 34}px`;
  lane.append(d);
  requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transition = `left ${travel}ms linear`; d.style.left = 'calc(100% - 60px)'; }));
  later(() => judge(p, d), travel * FW);
  later(() => d.remove(), travel + 200);
}

function judge(p, d) {
  if (!d.isConnected || (S.busy && S.hp <= 0)) return;
  const blocked = L.rules.some(r => on.has(r.id) && matches(r.match, p)), at = center(d);
  d.classList.add(p.bad ? 'bad' : 'ok');   // depois de avaliado, a cor revela o que era
  if (blocked) { d.classList.add('dropped'); setTimeout(() => d.remove(), 350); }
  if (p.bad && blocked) { explain(true, label(p), p.why); good(at, '#00e0a8'); }
  else if (p.bad) { d.classList.add('leak'); explain(false, label(p), p.why); toBank(p); damage(L.dmg || 10, at); }
  else if (blocked) { explain(false, label(p), 'Falso positivo: ' + p.why); toBank(p); damage(L.dmg || 10, at); }
  else { S.score += 20; setScore(); floatTxt(at.x, at.y - 12, '+20', '#4dd2ff'); }
  S.placed++; $('dDone').textContent = S.placed;
  if (S.placed >= S.need && S.hp > 0) { S.busy = true; later(() => flow.win(), 900); }
}

function toBank(p) {
  bankAdd(`${L.title}|${label(p)}`, { lv: L.title, q: `${L.title}: o pacote "${label(p)}" deve ser bloqueado ou liberado?`,
    o: [p.bad ? 'Bloquear' : 'Liberar', { t: p.bad ? 'Liberar' : 'Bloquear', why: p.why }], a: 0, why: p.why });
}
