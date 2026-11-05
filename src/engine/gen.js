// Geradores de pergunta (sub-rede, wildcard, faixas de IP, portas...), usados pelo desafio diário
// e pela Academia. ATENÇÃO: GEN e a ordem das chaves definem o desafio do dia de todo mundo;
// mudar GEN muda as perguntas de hoje e de datas passadas (duelos). Gerador novo vai em ACAD.
import { fmt } from './util.js';
import { LANG } from './i18n.js';
// Texto no idioma do jogo: g(português, espanhol, inglês). Só o texto muda; o sorteio é o mesmo em todo idioma.
const g = (pt, es, en) => LANG === 'es' ? es : LANG === 'en' ? en : pt;

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
  [g('Privado (RFC 1918)', 'Privada (RFC 1918)', 'Private (RFC 1918)'), g('Privado são só 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16.', 'Privadas son solo 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16.', 'Private is only 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.')],
  ['CGNAT (RFC 6598)', g('CGNAT é só 100.64.0.0/10, de 100.64 a 100.127.', 'CGNAT es solo 100.64.0.0/10, de 100.64 a 100.127.', 'CGNAT is only 100.64.0.0/10, from 100.64 to 100.127.')],
  [g('Público', 'Pública', 'Public'), g('Público é o que não cai em nenhuma faixa reservada.', 'Pública es la que no cae en ningún rango reservado.', 'Public is whatever does not fall in any reserved range.')],
  ['Link-local', g('Link-local é só 169.254.0.0/16.', 'Link-local es solo 169.254.0.0/16.', 'Link-local is only 169.254.0.0/16.')]
];
const IPS = [
  r => [0, `10.${oct(r)}.${oct(r)}.${oct(r)}`, g('Começa com 10: está em 10.0.0.0/8, privado.', 'Empieza con 10: está en 10.0.0.0/8, privada.', 'Starts with 10: it is in 10.0.0.0/8, private.')],
  r => { const b = int(r, 16, 31); return [0, `172.${b}.${oct(r)}.${oct(r)}`, g(`172.${b} está entre 172.16 e 172.31, dentro do /12 privado.`, `172.${b} está entre 172.16 y 172.31, dentro del /12 privado.`, `172.${b} is between 172.16 and 172.31, inside the private /12.`)]; },
  r => [0, `192.168.${oct(r)}.${oct(r)}`, g('Todo 192.168.x.x é privado (192.168.0.0/16).', 'Todo 192.168.x.x es privado (192.168.0.0/16).', 'Every 192.168.x.x is private (192.168.0.0/16).')],
  r => { const b = int(r, 64, 127); return [1, `100.${b}.${oct(r)}.${oct(r)}`, g(`100.${b} está entre 100.64 e 100.127: é o /10 do CGNAT.`, `100.${b} está entre 100.64 y 100.127: es el /10 del CGNAT.`, `100.${b} is between 100.64 and 100.127: it is the CGNAT /10.`)]; },
  r => { const b = pick(r, [15, 32]); return [2, `172.${b}.${oct(r)}.${oct(r)}`, b === 15 ? g('172.15 fica antes do 172.16, fora do /12: é público.', '172.15 está antes de 172.16, fuera del /12: es pública.', '172.15 comes before 172.16, outside the /12: it is public.') : g('172.32 passou do fim do /12, que termina em 172.31: é público.', '172.32 ya pasó el final del /12, que termina en 172.31: es pública.', '172.32 is past the end of the /12, which ends at 172.31: it is public.')]; },
  r => { const b = pick(r, [63, 128]); return [2, `100.${b}.${oct(r)}.${oct(r)}`, b === 63 ? g('100.63 fica antes do início do CGNAT (100.64): é público.', '100.63 está antes del inicio del CGNAT (100.64): es pública.', '100.63 comes before the start of CGNAT (100.64): it is public.') : g('100.128 passou do fim do CGNAT, que termina em 100.127: é público.', '100.128 ya pasó el final del CGNAT, que termina en 100.127: es pública.', '100.128 is past the end of CGNAT, which ends at 100.127: it is public.')]; },
  r => [2, `192.169.${oct(r)}.${oct(r)}`, g('Só 192.168 é privado. 192.169 já é público.', 'Solo 192.168 es privado. 192.169 ya es pública.', 'Only 192.168 is private. 192.169 is already public.')],
  r => [3, `169.254.${oct(r)}.${oct(r)}`, g('169.254 é link-local: o IP que o host se dá quando não encontra DHCP.', '169.254 es link-local: la IP que el host se asigna cuando no encuentra DHCP.', '169.254 is link-local: the IP a host gives itself when it finds no DHCP.')]
];
const PORTS = [
  ['SSH', 'TCP 22', g('acesso remoto criptografado', 'acceso remoto cifrado', 'encrypted remote access')], ['Telnet', 'TCP 23', g('acesso remoto antigo, tudo em texto puro', 'acceso remoto antiguo, todo en texto plano', 'old remote access, everything in plain text')],
  ['SMTP', 'TCP 25', g('envio de e-mail entre servidores', 'envío de correo entre servidores', 'sending email between servers')], ['DNS', 'UDP 53', g('resolução de nomes (TCP 53 em respostas grandes)', 'resolución de nombres (TCP 53 en respuestas grandes)', 'name resolution (TCP 53 for large answers)')],
  ['HTTP', 'TCP 80', g('web sem criptografia', 'web sin cifrado', 'unencrypted web')], ['NTP', 'UDP 123', g('sincronização de relógio', 'sincronización de reloj', 'clock sync')],
  ['SNMP', 'UDP 161', g('monitoramento (os traps chegam na 162)', 'monitoreo (los traps llegan al 162)', 'monitoring (traps arrive on 162)')], ['BGP', 'TCP 179', g('sessão entre roteadores de AS diferentes', 'sesión entre routers de AS distintos', 'session between routers in different ASes')],
  ['LDAP', 'TCP 389', g('consulta a diretório (LDAPS usa a 636)', 'consulta a directorio (LDAPS usa el 636)', 'directory lookup (LDAPS uses 636)')], ['HTTPS', 'TCP 443', g('HTTP sobre TLS', 'HTTP sobre TLS', 'HTTP over TLS')],
  ['Syslog', 'UDP 514', g('envio de logs para um servidor central', 'envío de logs a un servidor central', 'sending logs to a central server')], ['RDP', 'TCP 3389', g('área de trabalho remota do Windows', 'escritorio remoto de Windows', 'Windows remote desktop')]
];

export const GEN = {
  hosts(r) {
    const n = int(r, 22, 29), b = 32 - n, h = 2 ** b - 2;
    return { q: g(`Quantos hosts úteis tem uma /${n}?`, `¿Cuántos hosts útiles tiene una /${n}?`, `How many usable hosts does a /${n} have?`), a: 0, why: g(`A /${n} deixa ${b} bits de host: 2^${b} = ${fmt(h + 2)} endereços, menos rede e broadcast = ${fmt(h)}.`, `Una /${n} deja ${b} bits de host: 2^${b} = ${fmt(h + 2)} direcciones, menos red y broadcast = ${fmt(h)}.`, `A /${n} leaves ${b} host bits: 2^${b} = ${fmt(h + 2)} addresses, minus network and broadcast = ${fmt(h)}.`),
      o: [fmt(h), { t: fmt(h + 2), why: g(`${fmt(h + 2)} é o total de endereços. Faltou tirar a rede e o broadcast.`, `${fmt(h + 2)} es el total de direcciones. Faltó restar la red y el broadcast.`, `${fmt(h + 2)} is the total number of addresses. You forgot to subtract the network and the broadcast.`) },
        { t: fmt(2 ** (b - 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n + 1}.`, `Esa es la cantidad de hosts útiles de una /${n + 1}.`, `That is the number of usable hosts in a /${n + 1}.`) }, { t: fmt(2 ** (b + 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n - 1}.`, `Esa es la cantidad de hosts útiles de una /${n - 1}.`, `That is the number of usable hosts in a /${n - 1}.`) }] };
  },
  wildcard(r) {
    const n = int(r, 16, 30);
    return { q: g(`Qual a wildcard de uma /${n}?`, `¿Cuál es la wildcard de una /${n}?`, `What is the wildcard of a /${n}?`), a: 0, why: g(`A máscara da /${n} é ${dots(mask(n))}. Wildcard é 255 menos cada octeto: ${wc(n)}.`, `La máscara de la /${n} es ${dots(mask(n))}. La wildcard es 255 menos cada octeto: ${wc(n)}.`, `The /${n} mask is ${dots(mask(n))}. The wildcard is 255 minus each octet: ${wc(n)}.`),
      o: [wc(n), { t: dots(mask(n)), why: g(`Essa é a máscara da /${n}. A ACL pede o inverso dela.`, `Esa es la máscara de la /${n}. La ACL pide su inverso.`, `That is the /${n} mask. The ACL wants its inverse.`) },
        { t: wc(n + 1), why: g(`Essa é a wildcard de uma /${n + 1}.`, `Esa es la wildcard de una /${n + 1}.`, `That is the wildcard of a /${n + 1}.`) }, { t: wc(n - 1), why: g(`Essa é a wildcard de uma /${n - 1}.`, `Esa es la wildcard de una /${n - 1}.`, `That is the wildcard of a /${n - 1}.`) }] };
  },
  network(r) {
    const n = int(r, 25, 29), blk = 2 ** (32 - n), net = int(r, 0, 256 / blk - 1) * blk, z = net + int(r, 1, blk - 2), bc = net + blk - 1;
    const nx = net + blk < 256 ? net + blk : net - blk, ip = `192.168.${int(r, 0, 254)}.`;
    return { q: g(`Qual o endereço de rede do host ${ip}${z}/${n}?`, `¿Cuál es la dirección de red del host ${ip}${z}/${n}?`, `What is the network address of host ${ip}${z}/${n}?`), a: 0, why: g(`A /${n} anda em blocos de ${blk}. O .${z} cai no bloco .${net} a .${bc}, e a rede é o primeiro endereço: .${net}.`, `La /${n} avanza en bloques de ${blk}. El .${z} cae en el bloque .${net} a .${bc}, y la red es la primera dirección: .${net}.`, `A /${n} moves in blocks of ${blk}. The .${z} falls in the .${net} to .${bc} block, and the network is the first address: .${net}.`),
      o: [ip + net, { t: ip + bc, why: g(`.${bc} é o broadcast desse bloco, o último endereço.`, `.${bc} es el broadcast de ese bloque, la última dirección.`, `.${bc} is the broadcast of that block, the last address.`) },
        { t: ip + z, why: g('Esse é o próprio IP do host, não o endereço da rede.', 'Esa es la IP del propio host, no la dirección de red.', 'That is the host IP itself, not the network address.') }, { t: ip + nx, why: g(`.${nx} é o início de ${nx > net ? 'outro bloco, o seguinte' : 'outro bloco, o anterior'}.`, `.${nx} es el inicio de ${nx > net ? 'otro bloque, el siguiente' : 'otro bloque, el anterior'}.`, `.${nx} is the start of ${nx > net ? 'another block, the next one' : 'another block, the previous one'}.`) }] };
  },
  range(r) {
    const [cat, ip, why] = pick(r, IPS)(r);
    return { q: g(`O endereço ${ip} é:`, `La dirección ${ip} es:`, `The address ${ip} is:`), a: cat, why, o: CATS.map((c, i) => i === cat ? c[0] : { t: c[0], why: c[1] }) };
  },
  port(r) {
    const [svc, port, note] = pick(r, PORTS), other = sh(r, PORTS.filter(p => p[0] !== svc)).slice(0, 3);
    return { q: g(`Qual a porta padrão do ${svc}?`, `¿Cuál es el puerto estándar de ${svc}?`, `What is the default port for ${svc}?`), a: 0, why: g(`${svc} usa ${port}: ${note}.`, `${svc} usa ${port}: ${note}.`, `${svc} uses ${port}: ${note}.`), o: [port, ...other.map(p => ({ t: p[1], why: g(`${p[1]} é a porta do ${p[0]}.`, `${p[1]} es el puerto de ${p[0]}.`, `${p[1]} is the ${p[0]} port.`) }))] };
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
    if (r() < .5) return { q: g(`Quanto é ${bits(n)} em decimal?`, `¿Cuánto es ${bits(n)} en decimal?`, `What is ${bits(n)} in decimal?`), a: 0, why: g(`Some as posições com 1: ${s} = ${n}.`, `Suma las posiciones con 1: ${s} = ${n}.`, `Add the positions with 1: ${s} = ${n}.`),
      o: uniq([String(n), { t: String(a), why: g(`${a} seria ${bits(a)}: um bit diferente.`, `${a} sería ${bits(a)}: un bit distinto.`, `${a} would be ${bits(a)}: one bit off.`) }, { t: String(b), why: g(`${b} seria ${bits(b)}: um bit diferente.`, `${b} sería ${bits(b)}: un bit distinto.`, `${b} would be ${bits(b)}: one bit off.`) }, { t: String(255 - n), why: g(`${255 - n} é o inverso: ${bits(255 - n)}, com 0 e 1 trocados.`, `${255 - n} es el inverso: ${bits(255 - n)}, con 0 y 1 intercambiados.`, `${255 - n} is the inverse: ${bits(255 - n)}, with 0 and 1 swapped.`) }]) };
    return { q: g(`Como fica ${n} em binário?`, `¿Cómo queda ${n} en binario?`, `What is ${n} in binary?`), a: 0, why: g(`${n} = ${s}. Ligue essas posições (128 64 32 16 8 4 2 1): ${bits(n)}.`, `${n} = ${s}. Enciende esas posiciones (128 64 32 16 8 4 2 1): ${bits(n)}.`, `${n} = ${s}. Turn on those positions (128 64 32 16 8 4 2 1): ${bits(n)}.`),
      o: uniq([bits(n), { t: bits(a), why: g(`${bits(a)} vale ${a}, não ${n}.`, `${bits(a)} vale ${a}, no ${n}.`, `${bits(a)} is ${a}, not ${n}.`) }, { t: bits(b), why: g(`${bits(b)} vale ${b}, não ${n}.`, `${bits(b)} vale ${b}, no ${n}.`, `${bits(b)} is ${b}, not ${n}.`) }, { t: bits(255 - n), why: g(`${bits(255 - n)} é o inverso: vale ${255 - n}.`, `${bits(255 - n)} es el inverso: vale ${255 - n}.`, `${bits(255 - n)} is the inverse: it is ${255 - n}.`) }]) };
  },
  cidr(r) {
    const n = int(r, 8, 30), o2 = n + 8 <= 30 ? n + 8 : n - 8, alt = [n + 1, n - 1, o2];
    if (r() < .5) return { q: g(`Qual a máscara da /${n}?`, `¿Cuál es la máscara de la /${n}?`, `What is the /${n} mask?`), a: 0, why: g(`/${n} = ${n} bits ligados da esquerda para a direita: ${dots(mask(n))}.`, `/${n} = ${n} bits encendidos de izquierda a derecha: ${dots(mask(n))}.`, `/${n} = ${n} bits on from left to right: ${dots(mask(n))}.`),
      o: uniq([dots(mask(n)), ...alt.map(k => ({ t: dots(mask(k)), why: g(`${dots(mask(k))} é a máscara da /${k}.`, `${dots(mask(k))} es la máscara de la /${k}.`, `${dots(mask(k))} is the /${k} mask.`) }))]) };
    return { q: g(`A máscara ${dots(mask(n))} é qual CIDR?`, `¿Qué CIDR es la máscara ${dots(mask(n))}?`, `Which CIDR is the mask ${dots(mask(n))}?`), a: 0, why: g(`Conte os bits 1: ${mask(n).map(x => x.toString(2).replace(/0/g, '').length).join(' + ')} = ${n}.`, `Cuenta los bits en 1: ${mask(n).map(x => x.toString(2).replace(/0/g, '').length).join(' + ')} = ${n}.`, `Count the 1 bits: ${mask(n).map(x => x.toString(2).replace(/0/g, '').length).join(' + ')} = ${n}.`),
      o: uniq(['/' + n, ...alt.map(k => ({ t: '/' + k, why: g(`/${k} é ${dots(mask(k))}.`, `/${k} es ${dots(mask(k))}.`, `/${k} is ${dots(mask(k))}.`) }))]) };
  },
  hosts(r) {
    const n = int(r, 16, 29), b = 32 - n, h = 2 ** b - 2;
    return { q: g(`Quantos hosts úteis tem uma /${n}?`, `¿Cuántos hosts útiles tiene una /${n}?`, `How many usable hosts does a /${n} have?`), a: 0, why: g(`A /${n} deixa ${b} bits de host: 2^${b} = ${fmt(h + 2)} endereços, menos rede e broadcast = ${fmt(h)}.`, `Una /${n} deja ${b} bits de host: 2^${b} = ${fmt(h + 2)} direcciones, menos red y broadcast = ${fmt(h)}.`, `A /${n} leaves ${b} host bits: 2^${b} = ${fmt(h + 2)} addresses, minus network and broadcast = ${fmt(h)}.`),
      o: uniq([fmt(h), { t: fmt(h + 2), why: g(`${fmt(h + 2)} é o total de endereços. Faltou tirar a rede e o broadcast.`, `${fmt(h + 2)} es el total de direcciones. Faltó restar la red y el broadcast.`, `${fmt(h + 2)} is the total number of addresses. You forgot to subtract the network and the broadcast.`) },
        { t: fmt(2 ** (b - 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n + 1}.`, `Esa es la cantidad de hosts útiles de una /${n + 1}.`, `That is the number of usable hosts in a /${n + 1}.`) }, { t: fmt(2 ** (b + 1) - 2), why: g(`Esse é o número de hosts úteis de uma /${n - 1}.`, `Esa es la cantidad de hosts útiles de una /${n - 1}.`, `That is the number of usable hosts in a /${n - 1}.`) }]) };
  },
  net(r) {
    const n = int(r, 25, 30), blk = 2 ** (32 - n), net = int(r, 0, 256 / blk - 1) * blk, z = net + int(r, 1, blk - 2), bc = net + blk - 1;
    const ip = `10.${int(r, 0, 255)}.${int(r, 0, 255)}.`;
    if (r() < .5) return GEN.network(r);
    return { q: g(`Qual o broadcast da rede do host ${ip}${z}/${n}?`, `¿Cuál es el broadcast de la red del host ${ip}${z}/${n}?`, `What is the broadcast of the network of host ${ip}${z}/${n}?`), a: 0, why: g(`A /${n} anda em blocos de ${blk}. O .${z} cai no bloco .${net} a .${bc}; o broadcast é o último: .${bc}.`, `La /${n} avanza en bloques de ${blk}. El .${z} cae en el bloque .${net} a .${bc}; el broadcast es el último: .${bc}.`, `A /${n} moves in blocks of ${blk}. The .${z} falls in the .${net} to .${bc} block; the broadcast is the last one: .${bc}.`),
      o: uniq([ip + bc, { t: ip + net, why: g(`.${net} é o endereço de rede, o primeiro do bloco.`, `.${net} es la dirección de red, la primera del bloque.`, `.${net} is the network address, the first of the block.`) }, { t: ip + 255, why: g(`.255 só seria o broadcast numa /24 ou no último bloco. Aqui o bloco termina em .${bc}.`, `.255 solo sería el broadcast en una /24 o en el último bloque. Aquí el bloque termina en .${bc}.`, `.255 would only be the broadcast in a /24 or in the last block. Here the block ends at .${bc}.`) },
        { t: ip + (bc + blk <= 255 ? bc + blk : bc - blk), why: g('Esse é o broadcast de outro bloco.', 'Ese es el broadcast de otro bloque.', 'That is the broadcast of another block.') }]) };
  },
  range: r => GEN.range(r),
  port: r => GEN.port(r),
  wild: r => GEN.wildcard(r),
  osi(r) {
    const kind = int(r, 0, 3);
    if (kind === 0) {
      const pool = [
        ['Roteador', 'Router', 'Router', g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), g('O roteador opera na Camada 3: encaminha pacotes entre redes diferentes usando endereços IP.', 'El router opera en la Capa 3: reenvía paquetes entre redes distintas usando direcciones IP.', 'A router operates at Layer 3: forwards packets between different networks using IP addresses.'), [
          { t: g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), why: g('Na Camada 2 operam switches L2 e placas de rede usando MAC, sem roteamento IP.', 'En la Capa 2 operan switches L2 y tarjetas de red usando MAC, sin enrutamiento IP.', 'Layer 2 is where L2 switches and NICs operate using MAC, without IP routing.') },
          { t: g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), why: g('A Camada 4 cuida de portas e controle de fluxo (TCP/UDP), não de roteamento.', 'La Capa 4 se encarga de puertos y control de flujo (TCP/UDP), no de enrutamiento.', 'Layer 4 handles ports and flow control (TCP/UDP), not routing.') },
          { t: g('Camada 1 (Física)', 'Capa 1 (Física)', 'Layer 1 (Physical)'), why: g('A Camada 1 trata apenas da transmissão de sinais brutos (cabos, hubs).', 'La Capa 1 solo trata la transmisión de señales brutas (cables, hubs).', 'Layer 1 only deals with raw signal transmission (cables, hubs).') }
        ]],
        ['Switch L2', 'Switch L2', 'L2 Switch', g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), g('O switch tradicional (L2) opera no enlace: comuta quadros na rede local usando tabela MAC.', 'El switch tradicional (L2) opera en el enlace: conmuta tramas en la red local usando tabla MAC.', 'A standard L2 switch operates at Data Link: switches frames in the local network using a MAC table.'), [
          { t: g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), why: g('A Camada 3 usa endereços IP para rotear entre redes distintas (roteador ou switch L3).', 'La Capa 3 usa direcciones IP para enrutar entre redes distintas (router o switch L3).', 'Layer 3 uses IP addresses to route between distinct networks (router or L3 switch).') },
          { t: g('Camada 1 (Física)', 'Capa 1 (Física)', 'Layer 1 (Physical)'), why: g('Na Camada 1 o hub replica bits cegamente; o switch L2 lê o endereço MAC do quadro.', 'En la Capa 1 el hub replica bits a ciegas; el switch L2 lee la dirección MAC de la trama.', 'At Layer 1 a hub blindly repeats bits; an L2 switch reads the frame MAC address.') },
          { t: g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), why: g('A Camada 4 cuida de portas e transporte (TCP/UDP), acima da visão do switch L2.', 'La Capa 4 cuida puertos y transporte (TCP/UDP), por encima de la visión del switch L2.', 'Layer 4 manages ports and transport (TCP/UDP), above an L2 switch scope.') }
        ]],
        ['IP (IPv4/IPv6)', 'IP (IPv4/IPv6)', 'IP (IPv4/IPv6)', g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), g('O protocolo IP é o núcleo da Camada 3: provê endereçamento lógico e roteamento global.', 'El protocolo IP es el núcleo de la Capa 3: provee direccionamiento lógico y enrutamiento global.', 'The IP protocol is the core of Layer 3: provides logical addressing and global routing.'), [
          { t: g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), why: g('A Camada 2 usa endereços MAC em quadros Ethernet locais.', 'La Capa 2 usa direcciones MAC en tramas Ethernet locales.', 'Layer 2 uses MAC addresses in local Ethernet frames.') },
          { t: g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), why: g('A Camada 4 transporta os dados (TCP/UDP) encapsulados dentro do pacote IP.', 'La Capa 4 transporta los datos (TCP/UDP) encapsulados dentro del paquete IP.', 'Layer 4 carries data (TCP/UDP) encapsulated inside the IP packet.') },
          { t: g('Camada 7 (Aplicação)', 'Capa 7 (Aplicación)', 'Layer 7 (Application)'), why: g('Na Camada 7 ficam os protocolos de usuário como HTTP, DNS e SSH.', 'En la Capa 7 están los protocolos de usuario como HTTP, DNS y SSH.', 'Layer 7 is where user protocols like HTTP, DNS, and SSH reside.') }
        ]],
        ['TCP e UDP', 'TCP y UDP', 'TCP and UDP', g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), g('TCP e UDP operam na Camada 4: controlam portas de comunicação e entrega ponta a ponta.', 'TCP y UDP operan en la Capa 4: controlan puertos de comunicación y entrega extremo a extremo.', 'TCP and UDP operate at Layer 4: manage communication ports and end-to-end delivery.'), [
          { t: g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), why: g('A Camada 3 é do protocolo IP (endereçamento e roteamento).', 'La Capa 3 es del protocolo IP (direccionamiento y enrutamiento).', 'Layer 3 belongs to the IP protocol (addressing and routing).') },
          { t: g('Camada 7 (Aplicação)', 'Capa 7 (Aplicación)', 'Layer 7 (Application)'), why: g('A Camada 7 é onde rodam aplicações como HTTP e SSH, que usam o TCP/UDP.', 'La Capa 7 es donde corren aplicaciones como HTTP y SSH, que usan TCP/UDP.', 'Layer 7 is where applications like HTTP and SSH run, using TCP/UDP.') },
          { t: g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), why: g('A Camada 2 cuida da entrega local de quadros via MAC.', 'La Capa 2 cuida la entrega local de tramas vía MAC.', 'Layer 2 handles local frame delivery via MAC.') }
        ]],
        ['HTTP, DNS e SSH', 'HTTP, DNS y SSH', 'HTTP, DNS and SSH', g('Camada 7 (Aplicação)', 'Capa 7 (Aplicación)', 'Layer 7 (Application)'), g('HTTP, DNS e SSH são protocolos da Camada 7: interagem diretamente com o usuário e aplicações.', 'HTTP, DNS y SSH son protocolos de la Capa 7: interactúan directamente con el usuario y las aplicaciones.', 'HTTP, DNS, and SSH are Layer 7 protocols: they interact directly with user applications.'), [
          { t: g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), why: g('A Camada 4 provê apenas o transporte (portas TCP/UDP) usado por esses protocolos.', 'La Capa 4 solo provee el transporte (puertos TCP/UDP) usado por estos protocolos.', 'Layer 4 only provides transport (TCP/UDP ports) used by these protocols.') },
          { t: g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), why: g('A Camada 3 cuida do roteamento dos pacotes IP.', 'La Capa 3 cuida el enrutamiento de los paquetes IP.', 'Layer 3 handles IP packet routing.') },
          { t: g('Camada 5 (Sessão)', 'Capa 5 (Sesión)', 'Layer 5 (Session)'), why: g('A Camada 5 gerencia o estabelecimento e término de sessões.', 'La Capa 5 gestiona el establecimiento y cierre de sesiones.', 'Layer 5 manages session establishment and termination.') }
        ]],
        ['Hub Ethernet', 'Hub Ethernet', 'Ethernet Hub', g('Camada 1 (Física)', 'Capa 1 (Física)', 'Layer 1 (Physical)'), g('O hub repete sinais elétricos cegamente em todas as portas: opera puramente na Camada 1.', 'El hub repite señales eléctricas a ciegas en todos los puertos: opera puramente en la Capa 1.', 'An Ethernet hub blindly repeats electrical signals on all ports: operates purely at Layer 1.'), [
          { t: g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), why: g('Equipamentos de Camada 2 (como switches) leem endereços MAC; o hub não.', 'Los equipos de Capa 2 (como switches) leen direcciones MAC; el hub no.', 'Layer 2 devices (like switches) inspect MAC addresses; a hub does not.') },
          { t: g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), why: g('A Camada 3 exige roteamento IP, algo que o hub desconhece por completo.', 'La Capa 3 exige enrutamiento IP, algo que el hub desconoce por completo.', 'Layer 3 requires IP routing, which a hub knows nothing about.') },
          { t: g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), why: g('A Camada 4 cuida de transporte ponta a ponta (portas TCP/UDP).', 'La Capa 4 cuida transporte extremo a extremo (puertos TCP/UDP).', 'Layer 4 handles end-to-end transport (TCP/UDP ports).') }
        ]]
      ];
      const item = pick(r, pool);
      const name = LANG === 'es' ? item[1] : LANG === 'en' ? item[2] : item[0];
      return {
        q: g(`Em qual camada do Modelo OSI opera o ${name}?`, `¿En qué capa del Modelo OSI opera el ${name}?`, `At which layer of the OSI Model does ${name} operate?`),
        a: 0,
        why: item[4],
        o: uniq([item[3], ...item[5]])
      };
    }
    if (kind === 1) {
      const pdus = [
        [g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), g('Quadro (Frame)', 'Trama (Frame)', 'Frame'), g('No Enlace (L2), a unidade de dados é o Quadro (Frame), delimitado por endereços MAC.', 'En el Enlace (L2), la unidad de datos es la Trama (Frame), delimitada por direcciones MAC.', 'At Data Link (L2), the data unit is the Frame, bounded by MAC addresses.'), [
          { t: g('Pacote (Packet)', 'Paquete (Packet)', 'Packet'), why: g('Pacote é a PDU da Camada 3 (Rede/IP).', 'Paquete es la PDU de la Capa 3 (Red/IP).', 'Packet is the Layer 3 (Network/IP) PDU.') },
          { t: g('Segmento (Segment)', 'Segmento (Segment)', 'Segment'), why: g('Segmento é a PDU da Camada 4 (Transporte/TCP).', 'Segmento es la PDU de la Capa 4 (Transporte/TCP).', 'Segment is the Layer 4 (Transport/TCP) PDU.') },
          { t: g('Bits', 'Bits', 'Bits'), why: g('Bits são os sinais brutos da Camada 1 (Física).', 'Bits son las señales brutas de la Capa 1 (Física).', 'Bits are the raw signals of Layer 1 (Physical).') }
        ]],
        [g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), g('Pacote (Packet)', 'Paquete (Packet)', 'Packet'), g('Na Rede (L3), a PDU é o Pacote (Packet), com cabeçalho contendo IPs de origem e destino.', 'En la Red (L3), la PDU es el Paquete (Packet), con encabezado que contiene IPs de origen y destino.', 'At Network (L3), the PDU is the Packet, with headers containing source and destination IPs.'), [
          { t: g('Quadro (Frame)', 'Trama (Frame)', 'Frame'), why: g('Quadro é a PDU da Camada 2 (Enlace/MAC).', 'Trama es la PDU de la Capa 2 (Enlace/MAC).', 'Frame is the Layer 2 (Data Link/MAC) PDU.') },
          { t: g('Segmento (Segment)', 'Segmento (Segment)', 'Segment'), why: g('Segmento é a PDU da Camada 4 (Transporte/TCP).', 'Segmento es la PDU de la Capa 4 (Transporte/TCP).', 'Segment is the Layer 4 (Transport/TCP) PDU.') },
          { t: g('Bits', 'Bits', 'Bits'), why: g('Bits são os sinais brutos da Camada 1 (Física).', 'Bits son las señales brutas de la Capa 1 (Física).', 'Bits are the raw signals of Layer 1 (Physical).') }
        ]],
        [g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), g('Segmento (Segment)', 'Segmento (Segment)', 'Segment'), g('No Transporte (L4), a PDU é o Segmento (TCP) ou Datagrama (UDP), com números de porta.', 'En el Transporte (L4), la PDU es el Segmento (TCP) o Datagrama (UDP), con números de puerto.', 'At Transport (L4), the PDU is the Segment (TCP) or Datagram (UDP), with port numbers.'), [
          { t: g('Pacote (Packet)', 'Paquete (Packet)', 'Packet'), why: g('Pacote é a PDU da Camada 3 (Rede/IP).', 'Paquete es la PDU de la Capa 3 (Red/IP).', 'Packet is the Layer 3 (Network/IP) PDU.') },
          { t: g('Quadro (Frame)', 'Trama (Frame)', 'Frame'), why: g('Quadro é a PDU da Camada 2 (Enlace/MAC).', 'Trama es la PDU de la Capa 2 (Enlace/MAC).', 'Frame is the Layer 2 (Data Link/MAC) PDU.') },
          { t: g('Dados (Data)', 'Datos (Data)', 'Data'), why: g('Dados/Mensagem é a representação nas Camadas de Aplicação (5 a 7).', 'Datos/Mensaje es la representación en las Capas de Aplicación (5 a 7).', 'Data/Message represents Application Layers (5 to 7).') }
        ]]
      ];
      const p = pick(r, pdus);
      return {
        q: g(`Qual é a PDU (unidade de dados) da ${p[0]}?`, `¿Cuál es la PDU (unidad de datos) de la ${p[0]}?`, `What is the PDU (protocol data unit) of ${p[0]}?`),
        a: 0,
        why: p[2],
        o: uniq([p[1], ...p[3]])
      };
    }
    if (kind === 2) {
      const layers = [
        [1, g('Física', 'Física', 'Physical'), g('A Camada 1 é a Física: cabos, conectores, rádio e sinais elétricos.', 'La Capa 1 es la Física: cables, conectores, radio y señales eléctricas.', 'Layer 1 is Physical: cables, connectors, radio and electrical signals.')],
        [2, g('Enlace', 'Enlace', 'Data Link'), g('A Camada 2 é o Enlace: controle de acesso ao meio e endereços MAC.', 'La Capa 2 es el Enlace: control de acceso al medio y direcciones MAC.', 'Layer 2 is Data Link: medium access control and MAC addresses.')],
        [3, g('Rede', 'Red', 'Network'), g('A Camada 3 é a Rede: roteamento e endereçamento lógico IP.', 'La Capa 3 es la Red: enrutamiento y direccionamiento lógico IP.', 'Layer 3 is Network: routing and logical IP addressing.')],
        [4, g('Transporte', 'Transporte', 'Transport'), g('A Camada 4 é o Transporte: comunicação confiável (TCP) ou rápida (UDP) com portas.', 'La Capa 4 es el Transporte: comunicación confiable (TCP) o rápida (UDP) con puertos.', 'Layer 4 is Transport: reliable (TCP) or fast (UDP) communication with ports.')],
        [7, g('Aplicação', 'Aplicación', 'Application'), g('A Camada 7 é a Aplicação: protocolos finais como HTTP, DNS e SSH.', 'La Capa 7 es la Aplicación: protocolos finales como HTTP, DNS y SSH.', 'Layer 7 is Application: end-user protocols like HTTP, DNS, and SSH.')]
      ];
      const sel = pick(r, layers);
      const others = layers.filter(x => x[0] !== sel[0]);
      return {
        q: g(`Qual é a Camada ${sel[0]} do Modelo OSI?`, `¿Cuál es la Capa ${sel[0]} del Modelo OSI?`, `What is Layer ${sel[0]} of the OSI Model?`),
        a: 0,
        why: sel[2],
        o: uniq([sel[1], ...sh(r, others).slice(0, 3).map(o => ({ t: o[1], why: g(`A camada ${o[1]} é a Camada ${o[0]}.`, `La capa ${o[1]} es la Capa ${o[0]}.`, `${o[1]} is Layer ${o[0]}.`) }))])
      };
    }
    const funcs = [
      [
        g('Roteamento de pacotes entre diferentes redes baseado em endereços lógicos (IP)', 'Enrutamiento de paquetes entre diferentes redes basado en direcciones lógicas (IP)', 'Routing packets between different networks based on logical addresses (IP)'),
        g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'),
        g('A Camada de Rede (L3) é a encarregada do roteamento e interconexão de redes.', 'La Capa de Red (L3) es la encargada del enrutamiento e interconexión de redes.', 'The Network Layer (L3) is responsible for routing and network interconnection.'),
        [
          { t: g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), why: g('O Enlace cuida apenas da entrega local no mesmo segmento.', 'El Enlace solo cuida la entrega local en el mismo segmento.', 'Data Link only handles local delivery on the same segment.') },
          { t: g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'), why: g('O Transporte gerencia a integridade e portas da comunicação ponta a ponta.', 'El Transporte gestiona la integridad y puertos de la comunicación extremo a extremo.', 'Transport manages end-to-end integrity and communication ports.') },
          { t: g('Camada 1 (Física)', 'Capa 1 (Física)', 'Layer 1 (Physical)'), why: g('A Física trata apenas dos pulsos elétricos ou ópticos.', 'La Física solo trata los pulsos eléctricos u ópticos.', 'Physical only deals with electrical or optical pulses.') }
        ]
      ],
      [
        g('Comunicação ponta a ponta, controle de fluxo e multiplexação por portas', 'Comunicación extremo a extremo, control de flujo y multiplexación por puertos', 'End-to-end communication, flow control, and port multiplexing'),
        g('Camada 4 (Transporte)', 'Capa 4 (Transporte)', 'Layer 4 (Transport)'),
        g('A Camada de Transporte (L4) garante a conversa confiável ou rápida entre processos nas pontas.', 'La Capa de Transporte (L4) garantiza la conversación confiable o rápida entre procesos en los extremos.', 'The Transport Layer (L4) guarantees reliable or fast communication between processes at endpoints.'),
        [
          { t: g('Camada 3 (Rede)', 'Capa 3 (Red)', 'Layer 3 (Network)'), why: g('A Rede cuida de entregar pacotes de host a host via IP.', 'La Red cuida entregar paquetes de host a host vía IP.', 'Network handles host-to-host delivery via IP.') },
          { t: g('Camada 7 (Aplicação)', 'Capa 7 (Aplicación)', 'Layer 7 (Application)'), why: g('A Aplicação gera e consome os dados (HTTP, DNS).', 'La Aplicación genera y consume los datos (HTTP, DNS).', 'Application produces and consumes the data (HTTP, DNS).') },
          { t: g('Camada 2 (Enlace)', 'Capa 2 (Enlace)', 'Layer 2 (Data Link)'), why: g('O Enlace controla apenas o meio físico compartilhado localmente.', 'El Enlace solo controla el medio físico compartido localmente.', 'Data Link only controls the locally shared physical medium.') }
        ]
      ]
    ];
    const fn = pick(r, funcs);
    return {
      q: g(`Qual camada do Modelo OSI é responsável por: "${fn[0]}"?`, `¿Qué capa del Modelo OSI es responsable de: "${fn[0]}"?`, `Which OSI Model layer is responsible for: "${fn[0]}"?`),
      a: 0,
      why: fn[2],
      o: uniq([fn[1], ...fn[3]])
    };
  },
  perm(r) {
    const kind = int(r, 0, 3);
    const PERMS = [
      ['755', 'rwxr-xr-x', g('dono: rwx (4+2+1=7); grupo: r-x (4+1=5); outros: r-x (4+1=5)', 'dueño: rwx (4+2+1=7); grupo: r-x (4+1=5); otros: r-x (4+1=5)', 'owner: rwx (4+2+1=7); group: r-x (4+1=5); others: r-x (4+1=5)')],
      ['644', 'rw-r--r--', g('dono: rw- (4+2=6); grupo: r-- (4); outros: r-- (4)', 'dueño: rw- (4+2=6); grupo: r-- (4); otros: r-- (4)', 'owner: rw- (4+2=6); group: r-- (4); others: r-- (4)')],
      ['600', 'rw-------', g('dono: rw- (4+2=6); grupo: --- (0); outros: --- (0)', 'dueño: rw- (4+2=6); grupo: --- (0); otros: --- (0)', 'owner: rw- (4+2=6); group: --- (0); others: --- (0)')],
      ['700', 'rwx------', g('dono: rwx (4+2+1=7); grupo: --- (0); outros: --- (0)', 'dueño: rwx (4+2+1=7); grupo: --- (0); outros: --- (0)', 'owner: rwx (4+2+1=7); group: --- (0); others: --- (0)')],
      ['777', 'rwxrwxrwx', g('dono: rwx (7); grupo: rwx (7); outros: rwx (7) — permissão total', 'dueño: rwx (7); grupo: rwx (7); otros: rwx (7) — permiso total', 'owner: rwx (7); group: rwx (7); others: rwx (7) — full permissions')],
      ['664', 'rw-rw-r--', g('dono: rw- (6); grupo: rw- (6); outros: r-- (4)', 'dueño: rw- (6); grupo: rw- (6); otros: r-- (4)', 'owner: rw- (6); group: rw- (6); others: r-- (4)')],
      ['750', 'rwxr-x---', g('dono: rwx (7); grupo: r-x (5); outros: --- (0)', 'dueño: rwx (7); grupo: r-x (5); outros: --- (0)', 'owner: rwx (7); group: r-x (5); others: --- (0)')],
      ['640', 'rw-r-----', g('dono: rw- (6); grupo: r-- (4); outros: --- (0)', 'dueño: rw- (6); grupo: r-- (4); outros: --- (0)', 'owner: rw- (6); group: r-- (4); others: --- (0)')]
    ];

    if (kind === 0) {
      const [num, sym, calc] = pick(r, PERMS);
      const others = PERMS.filter(p => p[0] !== num);
      return {
        q: g(`No Linux, a permissão octal ${num} corresponde a:`, `En Linux, el permiso octal ${num} corresponde a:`, `In Linux, octal permission ${num} corresponds to:`),
        a: 0,
        why: g(`${num} em octal = ${sym}. Detalhe: ${calc}.`, `${num} en octal = ${sym}. Detalle: ${calc}.`, `${num} in octal = ${sym}. Breakdown: ${calc}.`),
        o: uniq([sym, ...sh(r, others).slice(0, 3).map(p => ({ t: p[1], why: g(`${p[1]} seria a permissão ${p[0]}.`, `${p[1]} sería el permiso ${p[0]}.`, `${p[1]} would be permission ${p[0]}.`) }))])
      };
    }
    if (kind === 1) {
      const [num, sym, calc] = pick(r, PERMS);
      const others = PERMS.filter(p => p[0] !== num);
      return {
        q: g(`A permissão simbólica "${sym}" equivale a qual valor octal?`, `¿El permiso simbólico "${sym}" equivale a qué valor octal?`, `Which octal value does symbolic permission "${sym}" equal?`),
        a: 0,
        why: g(`${sym} equivale a ${num}. Detalhe: ${calc}.`, `${sym} equivale a ${num}. Detalle: ${calc}.`, `${sym} equals ${num}. Breakdown: ${calc}.`),
        o: uniq([num, ...sh(r, others).slice(0, 3).map(p => ({ t: p[0], why: g(`${p[0]} seria ${p[1]}.`, `${p[0]} sería ${p[1]}.`, `${p[0]} would be ${p[1]}.`) }))])
      };
    }
    if (kind === 2) {
      const vals = [
        ['r', 'read (leitura)', 'read (lectura)', 'read', 4],
        ['w', 'write (escrita)', 'write (escritura)', 'write', 2],
        ['x', 'execute (execução)', 'execute (ejecución)', 'execute', 1]
      ];
      const bit = pick(r, vals);
      const alts = [1, 2, 4, 3, 7].filter(v => v !== bit[4]);
      return {
        q: g(`No cálculo octal de permissões do Linux, quanto vale o bit "${bit[0]}" (${LANG === 'es' ? bit[2] : LANG === 'en' ? bit[3] : bit[1]})?`, `En el cálculo octal de permisos de Linux, ¿cuánto vale el bit "${bit[0]}" (${LANG === 'es' ? bit[2] : LANG === 'en' ? bit[3] : bit[1]})?`, `In Linux octal permissions calculation, what is the value of bit "${bit[0]}" (${LANG === 'es' ? bit[2] : LANG === 'en' ? bit[3] : bit[1]})?`),
        a: 0,
        why: g(`O bit ${bit[0]} vale ${bit[4]}. A soma r (4) + w (2) + x (1) forma o total máximo 7.`, `El bit ${bit[0]} vale ${bit[4]}. La suma r (4) + w (2) + x (1) forma el total máximo 7.`, `The ${bit[0]} bit is worth ${bit[4]}. Summing r (4) + w (2) + x (1) gives the maximum of 7.`),
        o: uniq([String(bit[4]), ...alts.slice(0, 3).map(v => ({ t: String(v), why: g(`${v} não é o valor de ${bit[0]}. Lembre-se: r=4, w=2, x=1.`, `${v} no es el valor de ${bit[0]}. Recuerda: r=4, w=2, x=1.`, `${v} is not the value of ${bit[0]}. Remember: r=4, w=2, x=1.`) }))])
      };
    }
    const scenarios = [
      [
        g('Você gerou uma chave SSH privada (~/.ssh/id_ed25519). Qual permissão deve aplicar para o SSH aceitar a chave com segurança?', 'Generaste una clave SSH privada (~/.ssh/id_ed25519). ¿Qué permiso debes aplicar para que SSH acepte la clave con seguridad?', 'You generated a private SSH key (~/.ssh/id_ed25519). Which permission should you set for SSH to securely accept it?'),
        'chmod 600',
        g('Chaves privadas exigem rw------- (600): apenas o dono pode ler/escrever. Permissão aberta faz o cliente SSH abortar.', 'Las claves privadas exigen rw------- (600): solo el dueño puede leer/escribir. Si está abierta, SSH aborta la conexión.', 'Private keys require rw------- (600): only owner can read/write. If too open, SSH client refuses connection.'),
        [
          { t: 'chmod 644', why: g('644 permitiria que outros usuários do sistema lessem sua chave privada.', '644 permitiría que otros usuarios del sistema lean tu clave privada.', '644 would allow other system users to read your private key.') },
          { t: 'chmod 777', why: g('777 daria acesso total a qualquer um no sistema: o SSH bloqueia imediatamente.', '777 daría acceso total a cualquiera en el sistema: SSH lo bloquea de inmediato.', '777 gives full access to anyone: SSH blocks it immediately.') },
          { t: 'chmod 755', why: g('755 dá execução desnecessária e permite que grupo e outros leiam a chave privada.', '755 da ejecución innecesaria y permite que grupo y otros lean la clave privada.', '755 gives unnecessary execution and lets group/others read the key.') }
        ]
      ],
      [
        g('Qual permissão padrão torna um script executável para todos, mas editável apenas pelo seu dono?', '¿Qué permiso estándar hace que un script sea ejecutable por todos, pero editable solo por su dueño?', 'Which standard permission makes a script executable by everyone, but editable only by its owner?'),
        'chmod 755',
        g('755 (rwxr-xr-x) dá rwx (7) para o dono e r-x (5) para grupo e outros.', '755 (rwxr-xr-x) da rwx (7) al dueño y r-x (5) para grupo y otros.', '755 (rwxr-xr-x) grants rwx (7) to owner and r-x (5) to group and others.'),
        [
          { t: 'chmod 777', why: g('777 permite que qualquer usuário edite o script, abrindo brecha de segurança.', '777 permite que cualquier usuario edite el script, abriendo brecha de seguridad.', '777 allows any user to modify the script, creating a security hole.') },
          { t: 'chmod 644', why: g('644 permite apenas leitura (rw-r--r--), sem permissão de execução (x).', '644 solo permite lectura (rw-r--r--), sin permiso de ejecución (x).', '644 only allows reading (rw-r--r--), without execution permission (x).') },
          { t: 'chmod 700', why: g('700 restringe a execução exclusivamente ao dono, impedindo outros usuários.', '700 restringe la ejecución exclusivamente al dueño, impidiendo a otros usuarios.', '700 restricts execution solely to owner, preventing other users.') }
        ]
      ],
      [
        g('O que significa o primeiro bloco na permissão "rwxr-xr--"?', '¿Qué significa el primer bloque en el permiso "rwxr-xr--"?', 'What does the first block in permission "rwxr-xr--" mean?'),
        g('Permissões do usuário dono (u)', 'Permisos del usuario dueño (u)', 'Owner user permissions (u)'),
        g('A sequência é sempre: Dono/Usuário (u), Grupo (g) e Outros (o).', 'La secuencia es siempre: Dueño/Usuario (u), Grupo (g) y Otros (o).', 'The sequence is always: Owner/User (u), Group (g), and Others (o).'),
        [
          { t: g('Permissões do grupo (g)', 'Permisos del grupo (g)', 'Group permissions (g)'), why: g('O grupo é o segundo bloco de 3 letras (r-x).', 'El grupo es el segundo bloque de 3 letras (r-x).', 'The group is the second 3-letter block (r-x).') },
          { t: g('Permissões de outros usuários (o)', 'Permisos de otros usuarios (o)', 'Others permissions (o)'), why: g('Outros é o terceiro e último bloco (r--).', 'Otros es el tercer y último bloque (r--).', 'Others is the third and last block (r--).') },
          { t: g('Tipo de arquivo no sistema', 'Tipo de archivo en el sistema', 'File type in the system'), why: g('O tipo de arquivo vem no caractere antes das permissões (ex: d para diretório, - para arquivo comum).', 'El tipo de archivo va en el carácter antes de los permisos (ej: d para directorio, - para archivo común).', 'File type is indicated by the character before permissions (e.g., d for directory, - for regular file).') }
        ]
      ]
    ];
    const sc = pick(r, scenarios);
    return {
      q: sc[0],
      a: 0,
      why: sc[2],
      o: uniq([sc[1], ...sc[3]])
    };
  }
};
