// Geradores de pergunta (sub-rede, wildcard, faixas de IP, portas...), usados pelo desafio diário
// e pela Academia. ATENÇÃO: GEN e a ordem das chaves definem o desafio do dia de todo mundo;
// mudar GEN muda as perguntas de hoje e de datas passadas (duelos). Gerador novo vai em ACAD.
import { fmt } from './util.js';

// ---------- sorteio com semente ----------
export function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (const c of seed) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export const sh = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- geradores de pergunta ----------
export const mask = n => { const m = n ? (0xffffffff << (32 - n)) >>> 0 : 0; return [24, 16, 8, 0].map(s => m >>> s & 255); };
export const dots = a => a.join('.');
const wc = n => dots(mask(n).map(x => 255 - x));
const oct = r => int(r, 1, 254);

const CATS = [
  ['Privado (RFC 1918)', 'Privado são só 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16.'],
  ['CGNAT (RFC 6598)', 'CGNAT é só 100.64.0.0/10, de 100.64 a 100.127.'],
  ['Público', 'Público é o que não cai em nenhuma faixa reservada.'],
  ['Link-local', 'Link-local é só 169.254.0.0/16.']
];
const IPS = [
  r => [0, `10.${oct(r)}.${oct(r)}.${oct(r)}`, 'Começa com 10: está em 10.0.0.0/8, privado.'],
  r => { const b = int(r, 16, 31); return [0, `172.${b}.${oct(r)}.${oct(r)}`, `172.${b} está entre 172.16 e 172.31, dentro do /12 privado.`]; },
  r => [0, `192.168.${oct(r)}.${oct(r)}`, 'Todo 192.168.x.x é privado (192.168.0.0/16).'],
  r => { const b = int(r, 64, 127); return [1, `100.${b}.${oct(r)}.${oct(r)}`, `100.${b} está entre 100.64 e 100.127: é o /10 do CGNAT.`]; },
  r => { const b = pick(r, [15, 32]); return [2, `172.${b}.${oct(r)}.${oct(r)}`, b === 15 ? '172.15 fica antes do 172.16, fora do /12: é público.' : '172.32 passou do fim do /12, que termina em 172.31: é público.']; },
  r => { const b = pick(r, [63, 128]); return [2, `100.${b}.${oct(r)}.${oct(r)}`, b === 63 ? '100.63 fica antes do início do CGNAT (100.64): é público.' : '100.128 passou do fim do CGNAT, que termina em 100.127: é público.']; },
  r => [2, `192.169.${oct(r)}.${oct(r)}`, 'Só 192.168 é privado. 192.169 já é público.'],
  r => [3, `169.254.${oct(r)}.${oct(r)}`, '169.254 é link-local: o IP que o host se dá quando não encontra DHCP.']
];
const PORTS = [
  ['SSH', 'TCP 22', 'acesso remoto criptografado'], ['Telnet', 'TCP 23', 'acesso remoto antigo, tudo em texto puro'],
  ['SMTP', 'TCP 25', 'envio de e-mail entre servidores'], ['DNS', 'UDP 53', 'resolução de nomes (TCP 53 em respostas grandes)'],
  ['HTTP', 'TCP 80', 'web sem criptografia'], ['NTP', 'UDP 123', 'sincronização de relógio'],
  ['SNMP', 'UDP 161', 'monitoramento (os traps chegam na 162)'], ['BGP', 'TCP 179', 'sessão entre roteadores de AS diferentes'],
  ['LDAP', 'TCP 389', 'consulta a diretório (LDAPS usa a 636)'], ['HTTPS', 'TCP 443', 'HTTP sobre TLS'],
  ['Syslog', 'UDP 514', 'envio de logs para um servidor central'], ['RDP', 'TCP 3389', 'área de trabalho remota do Windows']
];

export const GEN = {
  hosts(r) {
    const n = int(r, 22, 29), b = 32 - n, h = 2 ** b - 2;
    return { q: `Quantos hosts úteis tem uma /${n}?`, a: 0, why: `A /${n} deixa ${b} bits de host: 2^${b} = ${fmt(h + 2)} endereços, menos rede e broadcast = ${fmt(h)}.`,
      o: [fmt(h), { t: fmt(h + 2), why: `${fmt(h + 2)} é o total de endereços. Faltou tirar a rede e o broadcast.` },
        { t: fmt(2 ** (b - 1) - 2), why: `Esse é o número de hosts úteis de uma /${n + 1}.` }, { t: fmt(2 ** (b + 1) - 2), why: `Esse é o número de hosts úteis de uma /${n - 1}.` }] };
  },
  wildcard(r) {
    const n = int(r, 16, 30);
    return { q: `Qual a wildcard de uma /${n}?`, a: 0, why: `A máscara da /${n} é ${dots(mask(n))}. Wildcard é 255 menos cada octeto: ${wc(n)}.`,
      o: [wc(n), { t: dots(mask(n)), why: `Essa é a máscara da /${n}. A ACL pede o inverso dela.` },
        { t: wc(n + 1), why: `Essa é a wildcard de uma /${n + 1}.` }, { t: wc(n - 1), why: `Essa é a wildcard de uma /${n - 1}.` }] };
  },
  network(r) {
    const n = int(r, 25, 29), blk = 2 ** (32 - n), net = int(r, 0, 256 / blk - 1) * blk, z = net + int(r, 1, blk - 2), bc = net + blk - 1;
    const nx = net + blk < 256 ? net + blk : net - blk, ip = `192.168.${int(r, 0, 254)}.`;
    return { q: `Qual o endereço de rede do host ${ip}${z}/${n}?`, a: 0, why: `A /${n} anda em blocos de ${blk}. O .${z} cai no bloco .${net} a .${bc}, e a rede é o primeiro endereço: .${net}.`,
      o: [ip + net, { t: ip + bc, why: `.${bc} é o broadcast desse bloco, o último endereço.` },
        { t: ip + z, why: 'Esse é o próprio IP do host, não o endereço da rede.' }, { t: ip + nx, why: `.${nx} é o início de ${nx > net ? 'outro bloco, o seguinte' : 'outro bloco, o anterior'}.` }] };
  },
  range(r) {
    const [cat, ip, why] = pick(r, IPS)(r);
    return { q: `O endereço ${ip} é:`, a: cat, why, o: CATS.map((c, i) => i === cat ? c[0] : { t: c[0], why: c[1] }) };
  },
  port(r) {
    const [svc, port, note] = pick(r, PORTS), other = sh(r, PORTS.filter(p => p[0] !== svc)).slice(0, 3);
    return { q: `Qual a porta padrão do ${svc}?`, a: 0, why: `${svc} usa ${port}: ${note}.`, o: [port, ...other.map(p => ({ t: p[1], why: `${p[1]} é a porta do ${p[0]}.` }))] };
  }
};


// ---------- geradores da Academia (fora do desafio diário) ----------
// Recebem r = função aleatória (Math.random serve). Devolvem pergunta no formato do quiz, com why em tudo.
const uniq = o => o.filter((x, i) => o.findIndex(y => (y.t || y) === (x.t || x)) === i);
const bits = n => n.toString(2).padStart(8, '0');
const sum = n => [128, 64, 32, 16, 8, 4, 2, 1].filter(v => n & v);
const flip = (r, n) => { let m; do m = n ^ (1 << int(r, 0, 7)); while (m === n || m === 0); return m; };
const near = (r, n) => { const a = flip(r, n); let b; do b = flip(r, n); while (b === a); return [a, b]; };

export const ACAD = {
  bin(r) {
    const n = int(r, 3, 254), [a, b] = near(r, n), s = sum(n).join(' + ');
    if (r() < .5) return { q: `Quanto é ${bits(n)} em decimal?`, a: 0, why: `Some as posições com 1: ${s} = ${n}.`,
      o: uniq([String(n), { t: String(a), why: `${a} seria ${bits(a)}: um bit diferente.` }, { t: String(b), why: `${b} seria ${bits(b)}: um bit diferente.` }, { t: String(255 - n), why: `${255 - n} é o inverso: ${bits(255 - n)}, com 0 e 1 trocados.` }]) };
    return { q: `Como fica ${n} em binário?`, a: 0, why: `${n} = ${s}. Ligue essas posições (128 64 32 16 8 4 2 1): ${bits(n)}.`,
      o: uniq([bits(n), { t: bits(a), why: `${bits(a)} vale ${a}, não ${n}.` }, { t: bits(b), why: `${bits(b)} vale ${b}, não ${n}.` }, { t: bits(255 - n), why: `${bits(255 - n)} é o inverso: vale ${255 - n}.` }]) };
  },
  cidr(r) {
    const n = int(r, 8, 30), o2 = n + 8 <= 30 ? n + 8 : n - 8, alt = [n + 1, n - 1, o2];
    if (r() < .5) return { q: `Qual a máscara da /${n}?`, a: 0, why: `/${n} = ${n} bits ligados da esquerda para a direita: ${dots(mask(n))}.`,
      o: uniq([dots(mask(n)), ...alt.map(k => ({ t: dots(mask(k)), why: `${dots(mask(k))} é a máscara da /${k}.` }))]) };
    return { q: `A máscara ${dots(mask(n))} é qual CIDR?`, a: 0, why: `Conte os bits 1: ${mask(n).map(x => x.toString(2).replace(/0/g, '').length).join(' + ')} = ${n}.`,
      o: uniq(['/' + n, ...alt.map(k => ({ t: '/' + k, why: `/${k} é ${dots(mask(k))}.` }))]) };
  },
  hosts(r) {
    const n = int(r, 16, 29), b = 32 - n, h = 2 ** b - 2;
    return { q: `Quantos hosts úteis tem uma /${n}?`, a: 0, why: `A /${n} deixa ${b} bits de host: 2^${b} = ${fmt(h + 2)} endereços, menos rede e broadcast = ${fmt(h)}.`,
      o: uniq([fmt(h), { t: fmt(h + 2), why: `${fmt(h + 2)} é o total de endereços. Faltou tirar a rede e o broadcast.` },
        { t: fmt(2 ** (b - 1) - 2), why: `Esse é o número de hosts úteis de uma /${n + 1}.` }, { t: fmt(2 ** (b + 1) - 2), why: `Esse é o número de hosts úteis de uma /${n - 1}.` }]) };
  },
  net(r) {
    const n = int(r, 25, 30), blk = 2 ** (32 - n), net = int(r, 0, 256 / blk - 1) * blk, z = net + int(r, 1, blk - 2), bc = net + blk - 1;
    const ip = `10.${int(r, 0, 255)}.${int(r, 0, 255)}.`;
    if (r() < .5) return GEN.network(r);
    return { q: `Qual o broadcast da rede do host ${ip}${z}/${n}?`, a: 0, why: `A /${n} anda em blocos de ${blk}. O .${z} cai no bloco .${net} a .${bc}; o broadcast é o último: .${bc}.`,
      o: uniq([ip + bc, { t: ip + net, why: `.${net} é o endereço de rede, o primeiro do bloco.` }, { t: ip + 255, why: `.255 só seria o broadcast numa /24 ou no último bloco. Aqui o bloco termina em .${bc}.` },
        { t: ip + (bc + blk <= 255 ? bc + blk : bc - blk), why: 'Esse é o broadcast de outro bloco.' }]) };
  },
  range: r => GEN.range(r),
  port: r => GEN.port(r),
  wild: r => GEN.wildcard(r)
};
