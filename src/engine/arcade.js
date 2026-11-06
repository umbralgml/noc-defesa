// Modo Arcade "Plantão Caótico": sobrevivência rápida contra incidentes em tempo real.
// O objetivo é manter o SLA acima de zero durante um turno intenso de 60 segundos.
import { $, store } from './util.js';
import { flow, modal, closeModal } from './ui.js';
import { sfx, music, stopMusic } from './audio.js';
import { addXP, xpHTML } from './career.js';
import { unlock } from './ach.js';
import { cyberConfetti } from './particles.js';
import { speakRadio } from './radio.js';
import { t } from './i18n.js';

const INCIDENTS = [
  {
    q: '🚨 ATAQUE SYN FLOOD NA PORTA 80!',
    desc: 'Milhões de pacotes SYN sem completar o handshake.',
    a: 'Ativar SYN Cookies no kernel',
    b: 'Desligar o switch central',
    ok: 0,
    why: 'SYN Cookies permitem responder conexões legítimas sem alocar memória na tabela de estados.'
  },
  {
    q: '🔌 CABO GIGABIT 0/1 COM PERDA DE PACOTES!',
    desc: 'CRC errors subindo a cada segundo na interface da borda.',
    a: 'Mudar máscara de rede para /32',
    b: 'Trocar o patch cord Cat6 danificado',
    ok: 1,
    why: 'Erros de CRC na camada física indicam cabo defeituoso, crimpagem frouxa ou conector oxidado.'
  },
  {
    q: '🔄 LOOP DE REDE TRAVANDO O DATACENTER!',
    desc: 'Luzes de todos os switches piscando juntas (Broadcast Storm).',
    a: 'Ativar Spanning Tree Protocol (STP)',
    b: 'Conectar mais cabos para dividir a carga',
    ok: 0,
    why: 'O STP bloqueia portas redundantes e impede que quadros circulem em loop infinito.'
  },
  {
    q: '🔑 BRUTE FORCE SSH NA PORTA 22!',
    desc: 'IP externo tentando 200 senhas por segundo como root.',
    a: 'Ativar Fail2ban e autenticação por chaves',
    b: 'Dar permissão 777 em /etc/shadow',
    ok: 0,
    why: 'O Fail2ban bloqueia IPs suspeitos no firewall após falhas repetidas de login.'
  },
  {
    q: '🧪 DNS SPOOFING NO ROTEADOR RECURSIVO!',
    desc: 'Usuários sendo redirecionados para site clone do banco.',
    a: 'Limpar cache DNS e validar DNSSEC',
    b: 'Configurar IP 127.0.0.1 em todos os clientes',
    ok: 0,
    why: 'Limpar o cache elimina entradas venenosas e o DNSSEC valida a assinatura criptográfica dos registros.'
  },
  {
    q: '💥 BROADCAST STORM NA VLAN DE VISITANTES!',
    desc: 'Tráfego ARP saturando 98% da banda do switch.',
    a: 'Desativar o firewall do roteador',
    b: 'Ativar Storm Control / Port Isolation',
    ok: 1,
    why: 'Storm Control limita a porcentagem de broadcast permitida por porta no switch.'
  },
  {
    q: '👾 CONEXÃO REVERSA NA PORTA 4444 (METASPLOIT)!',
    desc: 'Servidor interno abrindo shell para IP desconhecido.',
    a: 'Dropar conexão na saída e isolar o host',
    b: 'Abrir portas no roteador para inspecionar',
    ok: 0,
    why: 'Bloquear a porta de C2 e isolar o host contaminado impede a movimentação lateral do atacante.'
  },
  {
    q: '💣 PING OF DEATH / FLOOD ICMP!',
    desc: 'Buffer do roteador estourando com pacotes ICMP gigantes.',
    a: 'Aplicar rate limit de ICMP no firewall',
    b: 'Mudar o IP de broadcast para 0.0.0.0',
    ok: 0,
    why: 'Rate limiting impede que requisições ICMP consumam toda a capacidade de processamento.'
  },
  {
    q: '⚠️ CONFLITO DE IP: GATEWAY INALCANÇÁVEL!',
    desc: 'Duas máquinas brigando pelo IP 192.168.1.1.',
    a: 'Aumentar MTU para 9000 bytes',
    b: 'Localizar MAC invasor e reconfigurar DHCP',
    ok: 1,
    why: 'Dois equipamentos com o mesmo IP causam instabilidade ARP e derrubam o gateway.'
  },
  {
    q: '🔓 SERVIÇO TELNET DESPROTEGIDO NA WAN!',
    desc: 'Porta 23 aberta transmitindo credenciais em texto claro.',
    a: 'Encerrar Telnet e migrar para SSH criptografado',
    b: 'Ignorar, pois texto puro é mais rápido',
    ok: 0,
    why: 'Telnet não tem criptografia; qualquer sniffer na rede captura senhas em texto puro.'
  }
];

let timer = null, timeLeft = 60, sla = 100, score = 0, combo = 1, currentInc = null;

export function startArcade() {
  timeLeft = 60;
  sla = 100;
  score = 0;
  combo = 1;
  speakRadio('Iniciando plantão caótico. Mantenha o SLA de pé!');

  showArcadeModal();
  nextIncident();

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateHUD();
    if (timeLeft <= 0 || sla <= 0) {
      endArcade();
    }
  }, 1000);
}

function showArcadeModal() {
  modal(`
    <div class="tag">${t('MODO SOBREVIVÊNCIA')}</div>
    <h2>${t('Plantão Caótico')}</h2>

    <div class="arc-hud">
      <div class="arc-stat">
        <small>${t('TEMPO RESTANTE')}</small>
        <b id="arcTime">60s</b>
      </div>
      <div class="arc-stat">
        <small>${t('DISPONIBILIDADE (SLA)')}</small>
        <b id="arcSla" style="color:var(--acc)">100%</b>
      </div>
      <div class="arc-stat">
        <small>${t('SCORE')}</small>
        <b id="arcScore" style="color:var(--warn)">0</b>
      </div>
      <div class="arc-stat">
        <small>${t('COMBO')}</small>
        <b id="arcCombo">x1</b>
      </div>
    </div>

    <div class="arc-sla-bar"><div class="arc-sla-fill" id="arcSlaFill" style="width:100%"></div></div>

    <div class="arc-card" id="arcCard">
      <div class="arc-q" id="arcQ">${t('Preparando incidentes...')}</div>
      <div class="arc-desc" id="arcDesc"></div>
      <div class="arc-opts">
        <button class="btn arc-btn" id="arcA"></button>
        <button class="btn arc-btn" id="arcB"></button>
      </div>
    </div>

    <div class="row" style="margin-top:14px">
      <button class="btn ghostb danger" id="arcQuit">${t('ABORTAR PLANTÃO')}</button>
    </div>
  `);

  $('arcQuit').onclick = () => {
    clearInterval(timer);
    closeModal();
  };
}

function updateHUD() {
  const t = document.getElementById('arcTime');
  const s = document.getElementById('arcSla');
  const sc = document.getElementById('arcScore');
  const cm = document.getElementById('arcCombo');
  const fill = document.getElementById('arcSlaFill');

  if (t) t.textContent = `${timeLeft}s`;
  if (s) {
    s.textContent = `${sla}%`;
    s.style.color = sla > 60 ? 'var(--acc)' : sla > 30 ? 'var(--warn)' : 'var(--z)';
  }
  if (fill) {
    fill.style.width = `${sla}%`;
    fill.style.background = sla > 60 ? 'var(--acc)' : sla > 30 ? 'var(--warn)' : 'var(--z)';
  }
  if (sc) sc.textContent = score.toLocaleString('pt-BR');
  if (cm) cm.textContent = `x${combo}`;
}

function nextIncident() {
  currentInc = INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)];
  const q = document.getElementById('arcQ');
  const d = document.getElementById('arcDesc');
  const btnA = document.getElementById('arcA');
  const btnB = document.getElementById('arcB');

  if (!q || !btnA || !btnB) return;

  q.textContent = t(currentInc.q);
  d.textContent = t(currentInc.desc);
  btnA.textContent = t(currentInc.a);
  btnB.textContent = t(currentInc.b);

  btnA.className = 'btn arc-btn';
  btnB.className = 'btn arc-btn';
  btnA.disabled = false;
  btnB.disabled = false;

  btnA.onclick = () => answer(0, btnA, btnB);
  btnB.onclick = () => answer(1, btnB, btnA);
}

function answer(idx, chosen, other) {
  chosen.disabled = true;
  other.disabled = true;

  if (idx === currentInc.ok) {
    chosen.classList.add('arc-ok');
    sfx.ok(combo);
    score += 100 * combo;
    combo = Math.min(8, combo + 1);
    sla = Math.min(100, sla + 4);
  } else {
    chosen.classList.add('arc-bad');
    sfx.bad();
    combo = 1;
    sla = Math.max(0, sla - 25);
  }

  updateHUD();

  if (sla <= 0) {
    setTimeout(endArcade, 600);
    return;
  }

  setTimeout(nextIncident, 450);
}

function endArcade() {
  clearInterval(timer);
  const survived = sla > 0;
  const best = Math.max(score, store('noc_arcade_best') || 0);
  store('noc_arcade_best', best);

  const xpEarned = Math.round(score / 20) + (survived ? 60 : 15);
  const xr = addXP(xpEarned);

  if (survived && sla >= 75) {
    unlock('sobrevivente');
    cyberConfetti({ count: 50 });
    speakRadio('Plantão concluído com sucesso. SLA preservado!');
  } else if (!survived) {
    speakRadio('SLA zerado. O NOC caiu temporariamente.');
  }

  modal(`
    <div class="tag">${t('RELATÓRIO DO PLANTÃO CAÓTICO')}</div>
    <h2>${survived ? t('Turno Sobrevivido!') : t('SLA Esgotado!')}</h2>
    <div class="pts"><span>${t('Disponibilidade Final (SLA)')}</span><b style="color:${sla > 60 ? 'var(--acc)' : 'var(--z)'}">${sla}%</b></div>
    <div class="pts"><span>${t('Pontuação do Turno')}</span><b>${score.toLocaleString('pt-BR')} pts</b></div>
    <div class="pts"><span>${t('Seu Recorde')}</span><b style="color:var(--warn)">${best.toLocaleString('pt-BR')} pts</b></div>
    ${xpHTML(xr)}
    <div class="learn"><b>${t('ANÁLISE PÓS-INCIDENTE')}</b>${t('No mundo real, SLAs de 99.9% permitem menos de 43 minutos de downtime por mês. Respostas táticas rápidas salvam a infraestrutura.')}</div>
    <div class="row">
      <button class="btn ghostb" id="arcClose">${t('FECHAR')}</button>
      <button class="btn" id="arcAgain">${t('JOGAR DE NOVO')}</button>
    </div>
  `);

  $('arcClose').onclick = closeModal;
  $('arcAgain').onclick = () => {
    closeModal();
    startArcade();
  };
}

export function initArcade() {
  flow.arcade = card;
}

function card() {
  const box = $('arcadeBox');
  if (!box) return;
  const best = store('noc_arcade_best') || 0;
  box.innerHTML = `
    <button class="daily arc-hub-btn" id="arcadeBtn">
      <span class="di">⚡</span>
      <span class="dt">
        <b>${t('Plantão Caótico')}</b>
        <small>${best ? t('Sobrevivência rápida · 60s contra o relógio · Recorde: {n} pts').replace('{n}', best) : t('Sobrevivência rápida · 60s contra o relógio')}</small>
      </span>
      <span class="dg">${t('SOBREVIVER')}</span>
    </button>
  `;
  $('arcadeBtn').onclick = startArcade;
}
