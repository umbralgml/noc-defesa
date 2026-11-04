// Geradores de pergunta (sub-rede, wildcard, faixas de IP, portas...), usados pelo desafio diário
// e pela Academia. ATENÇÃO: GEN e a ordem das chaves definem o desafio do dia de todo mundo;
// mudar GEN muda as perguntas de hoje e de datas passadas (duelos). Gerador novo vai em ACAD.
import { fmt } from './util.js';
import { LANG } from './i18n.js';
// Texto no idioma do jogo: g(português, espanhol). Só o texto muda; o sorteio é o mesmo em todo idioma.
const g = (pt, es) => LANG === 'es' ? es : pt;

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
  [g('Privado (RFC 1918)', 'Privada (RFC 1918)'), g('Privado são só 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16.', 'Privadas son solo 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16.')],
  ['CGNAT (RFC 6598)', g('CGNAT é só 100.64.0.0/10, de 100.64 a 100.127.', 'CGNAT es solo 100.64.0.0/10, de 100.64 a 100.127.')],
  [g('Público', 'Pública'), g('Público é o que não cai em nenhuma faixa reservada.', 'Pública es la que no cae en ningún rango reservado.')],
  ['Link-local', g('Link-local é só 169.254.0.0/16.', 'Link-local es solo 169.254.0.0/16.')]
];
const IPS = [
  r => [0, `10.${oct(r)}.${oct(r)}.${oct(r)}`, g('Começa com 10: está em 10.0.0.0/8, privado.', 'Empieza con 10: está en 10.0.0.0/8, privada.')],
  r => { const b = int(r, 16, 31); return [0, `172.${b}.${oct(r)}.${oct(r)}`, g(`172.${b} está entre 172.16 e 172.31, dentro do /12 privado.`, `172.${b} está entre 172.16 y 172.31, dentro del /12 privado.`)]; },
  r => [0, `192.168.${oct(r)}.${oct(r)}`, g('Todo 192.168.x.x é privado (192.168.0.0/16).', 'Todo 192.168.x.x es privado (192.168.0.0/16).')],
  r => { const b = int(r, 64, 127); return [1, `100.${b}.${oct(r)}.${oct(r)}`, g(`100.${b} está entre 100.64 e 100.127: é o /10 do CGNAT.`, `100.${b} está entre 100.64 y 100.127: es el /10 del CGNAT.`)]; },
  r => { const b = pick(r, [15, 32]); return [2, `172.${b}.${oct(r)}.${oct(r)}`, b === 15 ? g('172.15 fica antes do 172.16, fora do /12: é público.', '172.15 está antes de 172.16, fuera del /12: es pública.') : g('172.32 passou do fim do /12, que termina em 172.31: é público.', '172.32 ya pasó el final del /12, que termina en 172.31: es pública.')]; },
  r => { const b = pick(r, [63, 128]); return [2, `100.${b}.${oct(r)}.${oct(r)}`, b === 63 ? g('100.63 fica antes do início do CGNAT (100.64): é público.', '100.63 está antes del inicio del CGNAT (100.64): es pública.') : g('100.128 passou do fim do CGNAT, que termina em 100.127: é público.', '100.128 ya pasó el final del CGNAT, que termina en 100.127: es pública.')]; },
  r => [2, `192.169.${oct(r)}.${oct(r)}`, g('Só 192.168 é privado. 192.169 já é público.', 'Solo 192.168 es privado. 192.169 ya es pública.')],
  r => [3, `169.254.${oct(r)}.${oct(r)}`, g('169.254 é link-local: o IP que o host se dá quando não encontra DHCP.', '169.254 es link-local: la IP que el host se asigna cuando no encuentra DHCP.')]
];
const PORTS = [
  ['SSH', 'TCP 22', g('acesso remoto criptografado', 'acceso remoto cifrado')], ['Telnet', 'TCP 23', g('acesso remoto antigo, tudo em texto puro', 'acceso remoto antiguo, todo en texto plano')],
  ['SMTP', 'TCP 25', g('envio de e-mail entre servidores', 'envío de correo entre servidores')], ['DNS', 'UDP 53', g('resolução de nomes (TCP 53 em respostas grandes)', 'resolución de nombres (TCP 53 en respuestas grandes)')],
  ['HTTP', 'TCP 80', g('web sem criptografia', 'web sin cifrado')], ['NTP', 'UDP 123', g('sincronização de relógio', 'sincronización de reloj')],
  ['SNMP', 'UDP 161', g('monitoramento (os traps chegam na 162)', 'monitoreo (los traps llegan al 162)')], ['BGP', 'TCP 179', g('sessão entre roteadores de AS diferentes', 'sesión entre routers de AS distintos')],
  ['LDAP', 'TCP 389', g('consulta a diretório (LDAPS usa a 636)', 'consulta a directorio (LDAPS usa el 636)')], ['HTTPS', 'TCP 443', g('HTTP sobre TLS', 'HTTP sobre TLS')],
  ['Syslog', 'UDP 514', g('envio de logs para um servidor central', 'envío de logs a un servidor central')], ['RDP', 'TCP 3389', g('área de trabalho remota do Windows', 'escritorio remoto de Windows')]
];

export const GEN = {
  hosts(r) {
    const n = int(r, 22, 29), b = 32 - n, h = 2 ** b - 2;
    return { q: g(`Quantos hosts úteis tem uma /${n}?`, `¿Cuántos hosts útiles tiene una /${n}?`), a: 0, why: g(`A /${n} deixa ${b} bits de host: 2^${b} = ${fmt(h + 2)} endereços, menos rede e broadcast = ${fmt(h)}.`, `Una /${n} deja ${b} bits de host: 2^${b} = ${fmt(h + 2)} direcciones, menos red y broadcast = ${fmt(h)}.`),
      o: [fmt(h), { t: fmt(h + 2), why: g(`${fmt(h + 2)} é o total de endereços. Faltou tirar a rede e o broadcast.`, `${fmt(h + 2)} es el total de direcciones. Faltó restar la red y el broadcast.`) },
        { t: fmt(2 ** (b - 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n + 1}.`, `Esa es la cantidad de hosts útiles de una /${n + 1}.`) }, { t: fmt(2 ** (b + 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n - 1}.`, `Esa es la cantidad de hosts útiles de una /${n - 1}.`) }] };
  },
  wildcard(r) {
    const n = int(r, 16, 30);
    return { q: g(`Qual a wildcard de uma /${n}?`, `¿Cuál es la wildcard de una /${n}?`), a: 0, why: g(`A máscara da /${n} é ${dots(mask(n))}. Wildcard é 255 menos cada octeto: ${wc(n)}.`, `La máscara de la /${n} es ${dots(mask(n))}. La wildcard es 255 menos cada octeto: ${wc(n)}.`),
      o: [wc(n), { t: dots(mask(n)), why: g(`Essa é a máscara da /${n}. A ACL pede o inverso dela.`, `Esa es la máscara de la /${n}. La ACL pide su inverso.`) },
        { t: wc(n + 1), why: g(`Essa é a wildcard de uma /${n + 1}.`, `Esa es la wildcard de una /${n + 1}.`) }, { t: wc(n - 1), why: g(`Essa é a wildcard de uma /${n - 1}.`, `Esa es la wildcard de una /${n - 1}.`) }] };
  },
  network(r) {
    const n = int(r, 25, 29), blk = 2 ** (32 - n), net = int(r, 0, 256 / blk - 1) * blk, z = net + int(r, 1, blk - 2), bc = net + blk - 1;
    const nx = net + blk < 256 ? net + blk : net - blk, ip = `192.168.${int(r, 0, 254)}.`;
    return { q: g(`Qual o endereço de rede do host ${ip}${z}/${n}?`, `¿Cuál es la dirección de red del host ${ip}${z}/${n}?`), a: 0, why: g(`A /${n} anda em blocos de ${blk}. O .${z} cai no bloco .${net} a .${bc}, e a rede é o primeiro endereço: .${net}.`, `La /${n} avanza en bloques de ${blk}. El .${z} cae en el bloque .${net} a .${bc}, y la red es la primera dirección: .${net}.`),
      o: [ip + net, { t: ip + bc, why: g(`.${bc} é o broadcast desse bloco, o último endereço.`, `.${bc} es el broadcast de ese bloque, la última dirección.`) },
        { t: ip + z, why: g('Esse é o próprio IP do host, não o endereço da rede.', 'Esa es la IP del propio host, no la dirección de red.') }, { t: ip + nx, why: g(`.${nx} é o início de ${nx > net ? 'outro bloco, o seguinte' : 'outro bloco, o anterior'}.`, `.${nx} es el inicio de ${nx > net ? 'otro bloque, el siguiente' : 'otro bloque, el anterior'}.`) }] };
  },
  range(r) {
    const [cat, ip, why] = pick(r, IPS)(r);
    return { q: g(`O endereço ${ip} é:`, `La dirección ${ip} es:`), a: cat, why, o: CATS.map((c, i) => i === cat ? c[0] : { t: c[0], why: c[1] }) };
  },
  port(r) {
    const [svc, port, note] = pick(r, PORTS), other = sh(r, PORTS.filter(p => p[0] !== svc)).slice(0, 3);
    return { q: g(`Qual a porta padrão do ${svc}?`, `¿Cuál es el puerto estándar de ${svc}?`), a: 0, why: g(`${svc} usa ${port}: ${note}.`, `${svc} usa ${port}: ${note}.`), o: [port, ...other.map(p => ({ t: p[1], why: g(`${p[1]} é a porta do ${p[0]}.`, `${p[1]} es el puerto de ${p[0]}.`) }))] };
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
    if (r() < .5) return { q: g(`Quanto é ${bits(n)} em decimal?`, `¿Cuánto es ${bits(n)} en decimal?`), a: 0, why: g(`Some as posições com 1: ${s} = ${n}.`, `Suma las posiciones con 1: ${s} = ${n}.`),
      o: uniq([String(n), { t: String(a), why: g(`${a} seria ${bits(a)}: um bit diferente.`, `${a} sería ${bits(a)}: un bit distinto.`) }, { t: String(b), why: g(`${b} seria ${bits(b)}: um bit diferente.`, `${b} sería ${bits(b)}: un bit distinto.`) }, { t: String(255 - n), why: g(`${255 - n} é o inverso: ${bits(255 - n)}, com 0 e 1 trocados.`, `${255 - n} es el inverso: ${bits(255 - n)}, con 0 y 1 intercambiados.`) }]) };
    return { q: g(`Como fica ${n} em binário?`, `¿Cómo queda ${n} en binario?`), a: 0, why: g(`${n} = ${s}. Ligue essas posições (128 64 32 16 8 4 2 1): ${bits(n)}.`, `${n} = ${s}. Enciende esas posiciones (128 64 32 16 8 4 2 1): ${bits(n)}.`),
      o: uniq([bits(n), { t: bits(a), why: g(`${bits(a)} vale ${a}, não ${n}.`, `${bits(a)} vale ${a}, no ${n}.`) }, { t: bits(b), why: g(`${bits(b)} vale ${b}, não ${n}.`, `${bits(b)} vale ${b}, no ${n}.`) }, { t: bits(255 - n), why: g(`${bits(255 - n)} é o inverso: vale ${255 - n}.`, `${bits(255 - n)} es el inverso: vale ${255 - n}.`) }]) };
  },
  cidr(r) {
    const n = int(r, 8, 30), o2 = n + 8 <= 30 ? n + 8 : n - 8, alt = [n + 1, n - 1, o2];
    if (r() < .5) return { q: g(`Qual a máscara da /${n}?`, `¿Cuál es la máscara de la /${n}?`), a: 0, why: g(`/${n} = ${n} bits ligados da esquerda para a direita: ${dots(mask(n))}.`, `/${n} = ${n} bits encendidos de izquierda a derecha: ${dots(mask(n))}.`),
      o: uniq([dots(mask(n)), ...alt.map(k => ({ t: dots(mask(k)), why: g(`${dots(mask(k))} é a máscara da /${k}.`, `${dots(mask(k))} es la máscara de la /${k}.`) }))]) };
    return { q: g(`A máscara ${dots(mask(n))} é qual CIDR?`, `¿Qué CIDR es la máscara ${dots(mask(n))}?`), a: 0, why: g(`Conte os bits 1: ${mask(n).map(x => x.toString(2).replace(/0/g, '').length).join(' + ')} = ${n}.`, `Cuenta los bits en 1: ${mask(n).map(x => x.toString(2).replace(/0/g, '').length).join(' + ')} = ${n}.`),
      o: uniq(['/' + n, ...alt.map(k => ({ t: '/' + k, why: g(`/${k} é ${dots(mask(k))}.`, `/${k} es ${dots(mask(k))}.`) }))]) };
  },
  hosts(r) {
    const n = int(r, 16, 29), b = 32 - n, h = 2 ** b - 2;
    return { q: g(`Quantos hosts úteis tem uma /${n}?`, `¿Cuántos hosts útiles tiene una /${n}?`), a: 0, why: g(`A /${n} deixa ${b} bits de host: 2^${b} = ${fmt(h + 2)} endereços, menos rede e broadcast = ${fmt(h)}.`, `Una /${n} deja ${b} bits de host: 2^${b} = ${fmt(h + 2)} direcciones, menos red y broadcast = ${fmt(h)}.`),
      o: uniq([fmt(h), { t: fmt(h + 2), why: g(`${fmt(h + 2)} é o total de endereços. Faltou tirar a rede e o broadcast.`, `${fmt(h + 2)} es el total de direcciones. Faltó restar la red y el broadcast.`) },
        { t: fmt(2 ** (b - 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n + 1}.`, `Esa es la cantidad de hosts útiles de una /${n + 1}.`) }, { t: fmt(2 ** (b + 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n - 1}.`, `Esa es la cantidad de hosts útiles de una /${n - 1}.`) }]) };
  },
  net(r) {
    const n = int(r, 25, 30), blk = 2 ** (32 - n), net = int(r, 0, 256 / blk - 1) * blk, z = net + int(r, 1, blk - 2), bc = net + blk - 1;
    const ip = `10.${int(r, 0, 255)}.${int(r, 0, 255)}.`;
    if (r() < .5) return GEN.network(r);
    return { q: g(`Qual o broadcast da rede do host ${ip}${z}/${n}?`, `¿Cuál es el broadcast de la red del host ${ip}${z}/${n}?`), a: 0, why: g(`A /${n} anda em blocos de ${blk}. O .${z} cai no bloco .${net} a .${bc}; o broadcast é o último: .${bc}.`, `La /${n} avanza en bloques de ${blk}. El .${z} cae en el bloque .${net} a .${bc}; el broadcast es el último: .${bc}.`),
      o: uniq([ip + bc, { t: ip + net, why: g(`.${net} é o endereço de rede, o primeiro do bloco.`, `.${net} es la dirección de red, la primera del bloque.`) }, { t: ip + 255, why: g(`.255 só seria o broadcast numa /24 ou no último bloco. Aqui o bloco termina em .${bc}.`, `.255 solo sería el broadcast en una /24 o en el último bloque. Aquí el bloque termina en .${bc}.`) },
        { t: ip + (bc + blk <= 255 ? bc + blk : bc - blk), why: g('Esse é o broadcast de outro bloco.', 'Ese es el broadcast de otro bloque.') }]) };
  },
  range: r => GEN.range(r),
  port: r => GEN.port(r),
  wild: r => GEN.wildcard(r)
};
